"""Public + admin analytics events.

Public endpoint allows the frontend to log lightweight UX events (card views,
clicks, CTA presses) without auth. Events have a TTL via `expires_at` (90 days)
and are stored under `analytics_events`. Admin endpoints expose summaries.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from core_utils import success_response
from demos.kn3.core_utils import new_id
from db import get_db
from security import require_role

router = APIRouter(prefix="/api/analytics")
admin_router = APIRouter(prefix="/api/admin/analytics")

EVENT_TTL_DAYS = 90
ALLOWED_TYPES = {"view", "click", "cta", "hover"}
ALLOWED_TARGETS = {"portfolio", "case-study", "product", "partner", "tech"}


class EventIn(BaseModel):
    event_type: str = Field(..., description="view | click | cta | hover")
    target_type: str = Field(..., description="portfolio | case-study | product | partner | tech")
    target_id: str | None = None
    target_slug: str | None = None
    path: str | None = None
    session_id: str | None = None  # Anonymous client-generated session id
    referrer: str | None = None
    meta: Dict[str, Any] | None = None


class EventBatchIn(BaseModel):
    events: List[EventIn] = Field(..., max_length=50)


def _client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return req.client.host if req.client else ""


def _serialize(event: EventIn, req: Request) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=EVENT_TTL_DAYS)
    return {
        "id": new_id("evt"),
        "event_type": event.event_type if event.event_type in ALLOWED_TYPES else "view",
        "target_type": event.target_type if event.target_type in ALLOWED_TARGETS else "unknown",
        "target_id": event.target_id,
        "target_slug": event.target_slug,
        "path": event.path or "",
        "session_id": event.session_id or "",
        "referrer": event.referrer or "",
        "meta": event.meta or {},
        "user_agent": (req.headers.get("user-agent") or "")[:240],
        "ip": _client_ip(req),
        "created_at": now,
        "expires_at": expires_at,  # MongoDB TTL index drops after this timestamp
    }


@router.post("/events", status_code=201)
async def log_event(payload: EventIn, request: Request) -> Dict[str, Any]:
    """Log a single analytics event. Lightweight + non-auth."""
    db = get_db()
    doc = _serialize(payload, request)
    await db.analytics_events.insert_one(doc)
    return success_response({"id": doc["id"]})


@router.post("/events/batch", status_code=201)
async def log_events_batch(payload: EventBatchIn, request: Request) -> Dict[str, Any]:
    """Log up to 50 events in a single request — batching from frontend."""
    if not payload.events:
        return success_response({"count": 0})
    db = get_db()
    docs = [_serialize(ev, request) for ev in payload.events]
    await db.analytics_events.insert_many(docs)
    return success_response({"count": len(docs)})


# ---------------------------------------------------------------------------
# Admin: summary endpoints
# ---------------------------------------------------------------------------
@admin_router.get("/cards/summary")
async def cards_summary(
    days: int = 30,
    target_type: str | None = None,
    user=Depends(require_role("admin", "staff")),
) -> Dict[str, Any]:
    """
    Aggregated card analytics per target item.
    Returns top items + per-event-type counts.
    """
    db = get_db()
    days = max(1, min(days, 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    match = {"created_at": {"$gte": since}}
    if target_type:
        match["target_type"] = target_type

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "target_type": "$target_type",
                    "target_id": "$target_id",
                    "target_slug": "$target_slug",
                    "event_type": "$event_type",
                },
                "count": {"$sum": 1},
            }
        },
        {
            "$group": {
                "_id": {
                    "target_type": "$_id.target_type",
                    "target_id": "$_id.target_id",
                    "target_slug": "$_id.target_slug",
                },
                "events": {
                    "$push": {"event_type": "$_id.event_type", "count": "$count"}
                },
                "total": {"$sum": "$count"},
            }
        },
        {"$sort": {"total": -1}},
        {"$limit": 50},
    ]
    rows = await db.analytics_events.aggregate(pipeline).to_list(50)

    items = []
    for row in rows:
        per_event: Dict[str, int] = {}
        for ev in row.get("events", []):
            per_event[ev["event_type"]] = ev["count"]
        items.append(
            {
                "target_type": row["_id"]["target_type"],
                "target_id": row["_id"]["target_id"],
                "target_slug": row["_id"]["target_slug"],
                "total": row["total"],
                "views": per_event.get("view", 0),
                "clicks": per_event.get("click", 0),
                "cta": per_event.get("cta", 0),
                "hovers": per_event.get("hover", 0),
            }
        )

    total_events = sum(it["total"] for it in items)
    return success_response(
        {
            "period_days": days,
            "total_events": total_events,
            "top_items": items,
        }
    )


@admin_router.get("/cards/timeline")
async def cards_timeline(
    days: int = 14,
    target_type: str | None = None,
    user=Depends(require_role("admin", "staff")),
) -> Dict[str, Any]:
    """Per-day timeline of events (for charting)."""
    db = get_db()
    days = max(1, min(days, 90))
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    match = {"created_at": {"$gte": since}}
    if target_type:
        match["target_type"] = target_type

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "event_type": "$event_type",
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.day": 1}},
    ]
    rows = await db.analytics_events.aggregate(pipeline).to_list(2000)

    by_day: Dict[str, Dict[str, int]] = {}
    for row in rows:
        day = row["_id"]["day"]
        et = row["_id"]["event_type"]
        by_day.setdefault(day, {"view": 0, "click": 0, "cta": 0, "hover": 0})
        by_day[day][et] = by_day[day].get(et, 0) + row["count"]

    timeline = [
        {"day": day, **counts} for day, counts in sorted(by_day.items())
    ]
    return success_response({"days": days, "timeline": timeline})
