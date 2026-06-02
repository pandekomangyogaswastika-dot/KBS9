"""In-app notifications service (Phase 15).

Responsibilities:
  * Persist notifications to MongoDB (`notifications` collection).
  * Push real-time payloads via the WebSocket ConnectionManager.
  * Provide high-level helpers used by event-emitting routers
    (lead/project/billing/chat/document).

Notification document shape:
{
  id, user_id, type, title, body, link, read, read_at?, created_at,
  actor: {id, name, role} | None,
  metadata: {...}
}

Note: This is the **in-app** counterpart to `notifications.py` (the existing
email notification dispatcher). Both can be called for the same event so the
user receives both an email AND a live notification.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from db import get_db
from realtime import manager

# Known notification types (server-side, used by clients to render icons).
TYPES = {
    "lead.created",
    "project.created",
    "project.status_changed",
    "project.assigned",
    "approval.requested",
    "approval.signed",
    "approval.decided",
    "invoice.created",
    "invoice.overdue",
    "invoice.status_changed",
    "document.uploaded",
    "chat.message",
    "system",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _admin_staff_ids(db) -> List[str]:
    rows = await db.system_users.find(
        {"role": {"$in": ["admin", "staff"]}, "status": "active", "voided": {"$ne": True}},
        {"_id": 0, "id": 1},
    ).to_list(500)
    return [r["id"] for r in rows]


async def create(
    user_id: str,
    type_: str,
    title: str,
    body: str = "",
    link: Optional[str] = None,
    *,
    actor: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a single notification for one user (DB + WS push)."""
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type_,
        "title": title,
        "body": body,
        "link": link,
        "read": False,
        "read_at": None,
        "actor": actor,
        "metadata": metadata or {},
        "created_at": _now(),
    }
    try:
        await db.notifications.insert_one(doc)
    except Exception as exc:  # noqa: BLE001
        print(f"[notification_service] DB insert failed: {exc}")
        return {}
    # Best-effort live push
    try:
        await manager.send_to_user(
            user_id,
            {
                "kind": "notification",
                "data": {
                    "id": doc["id"],
                    "type": doc["type"],
                    "title": doc["title"],
                    "body": doc["body"],
                    "link": doc["link"],
                    "actor": doc["actor"],
                    "metadata": doc["metadata"],
                    "created_at": doc["created_at"],
                    "read": False,
                },
            },
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[notification_service] WS push failed: {exc}")
    return doc


async def create_for_users(
    user_ids: Iterable[str],
    type_: str,
    title: str,
    body: str = "",
    link: Optional[str] = None,
    *,
    actor: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> int:
    """Fan-out helper: create one notification per user_id; returns count."""
    count = 0
    for uid in set(uid for uid in (user_ids or []) if uid):
        # Don't notify the actor about their own action
        if actor and uid == actor.get("id"):
            continue
        await create(uid, type_, title, body, link, actor=actor, metadata=metadata)
        count += 1
    return count


async def create_for_admin_staff(
    type_: str,
    title: str,
    body: str = "",
    link: Optional[str] = None,
    *,
    actor: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> int:
    """Notify ALL active admin + staff users."""
    db = get_db()
    ids = await _admin_staff_ids(db)
    return await create_for_users(ids, type_, title, body, link, actor=actor, metadata=metadata)


async def broadcast_topic(topic: str, kind: str, data: Dict[str, Any]) -> int:
    """Broadcast a non-persistent update to a topic (e.g. live status changes)."""
    return await manager.send_to_topic(topic, {"kind": kind, "topic": topic, "data": data})
