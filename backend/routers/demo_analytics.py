"""Demo analytics router - Track demo usage and generate reports"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List
from db import get_db
from core_utils import new_id, now_iso, success_response, serialize_doc

router = APIRouter(prefix="/api/demo")
admin_router = APIRouter(prefix="/api/admin")


class DemoAccessRequest(BaseModel):
    case_slug: str
    demo_slug: str
    user_name: str
    user_email: EmailStr
    user_company: Optional[str] = None
    user_phone: Optional[str] = None


class DemoSessionEvent(BaseModel):
    session_id: str
    event_type: str  # page_view, feature_used, session_end
    event_data: Optional[dict] = None


@router.post("/request-access")
async def request_demo_access(request: DemoAccessRequest):
    """Log demo access request, create a real demo session, and return demo_url."""
    from routers.demo import create_demo_session, DemoSessionRequest  # noqa: PLC0415
    db = get_db()

    # Create proper demo session (handles per-email reuse, capacity, seed data)
    try:
        session_result = await create_demo_session(DemoSessionRequest(
            name=request.user_name,
            email=request.user_email,
            company=request.user_company or "",
            app_slug=request.demo_slug or "kn3",
        ))
        session_id = session_result.get("session_id") or session_result.get("token")
        demo_url = session_result.get("demo_url") or f"/demo/{request.demo_slug}?session={session_id}"
    except Exception as exc:
        # Fallback: log access and return error-friendly message
        raise HTTPException(
            status_code=503,
            detail={"code": "SESSION_CREATE_FAILED", "message": f"Gagal membuat sesi demo: {exc}"},
        )

    # Also record access log for analytics (fire-and-forget)
    try:
        access_log = {
            "id": new_id(),
            "case_slug": request.case_slug,
            "demo_slug": request.demo_slug,
            "user_name": request.user_name,
            "user_email": request.user_email,
            "user_company": request.user_company,
            "session_id": session_id,
            "status": "initiated",
            "created_at": now_iso(),
        }
        await db.demo_access_logs.insert_one(access_log)
    except Exception:
        pass  # analytics failure should not block the user

    return success_response({
        "session_id": session_id,
        "expires_at": session_result.get("expires_at"),
        "demo_url": demo_url,
    })


@router.post("/track-event")
async def track_demo_event(event: DemoSessionEvent):
    """Track user interactions within demo"""
    db = get_db()
    
    event_log = {
        "id": new_id(),
        "session_id": event.session_id,
        "event_type": event.event_type,
        "event_data": event.event_data,
        "timestamp": now_iso(),
    }
    
    await db.demo_events.insert_one(event_log)
    
    # Update session status
    if event.event_type == "session_end":
        await db.demo_access_logs.update_one(
            {"session_id": event.session_id},
            {"$set": {"status": "completed", "ended_at": now_iso()}}
        )
    
    return success_response({"logged": True})


@admin_router.get("/demo-analytics/overview")
async def get_demo_analytics_overview():
    """Get demo analytics overview"""
    db = get_db()
    
    # Total demo requests
    total_requests = await db.demo_access_logs.count_documents({})
    
    # Requests last 30 days
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent_requests = await db.demo_access_logs.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Active sessions (not expired)
    now = datetime.utcnow().isoformat()
    active_sessions = await db.demo_access_logs.count_documents({
        "expires_at": {"$gte": now},
        "status": "initiated"
    })
    
    # Completed sessions
    completed_sessions = await db.demo_access_logs.count_documents({
        "status": "completed"
    })
    
    # Completion rate
    completion_rate = (completed_sessions / total_requests * 100) if total_requests > 0 else 0
    
    # Demo requests by case
    pipeline = [
        {"$group": {
            "_id": "$case_slug",
            "count": {"$sum": 1},
            "demo_slug": {"$first": "$demo_slug"}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_case = await db.demo_access_logs.aggregate(pipeline).to_list(10)
    
    # Average session duration
    completed = await db.demo_access_logs.find({
        "status": "completed",
        "ended_at": {"$exists": True}
    }).to_list(100)
    
    durations = []
    for session in completed:
        try:
            start = datetime.fromisoformat(session["created_at"])
            end = datetime.fromisoformat(session["ended_at"])
            duration = (end - start).total_seconds() / 60  # minutes
            durations.append(duration)
        except:
            continue
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    return success_response({
        "total_requests": total_requests,
        "recent_requests_30d": recent_requests,
        "active_sessions": active_sessions,
        "completed_sessions": completed_sessions,
        "completion_rate": round(completion_rate, 1),
        "avg_session_duration_minutes": round(avg_duration, 1),
        "by_case": [
            {
                "case_slug": item["_id"],
                "demo_slug": item["demo_slug"],
                "requests": item["count"]
            }
            for item in by_case
        ]
    })


@admin_router.get("/demo-analytics/requests")
async def get_demo_requests(
    limit: int = 50,
    skip: int = 0,
    case_slug: Optional[str] = None,
    status: Optional[str] = None
):
    """Get list of demo access requests"""
    db = get_db()
    
    query = {}
    if case_slug:
        query["case_slug"] = case_slug
    if status:
        query["status"] = status
    
    requests = await db.demo_access_logs.find(query).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.demo_access_logs.count_documents(query)
    
    return success_response({
        "total": total,
        "data": [serialize_doc(r) for r in requests]
    })


@admin_router.get("/demo-analytics/session/{session_id}")
async def get_session_details(session_id: str):
    """Get detailed analytics for a specific session"""
    db = get_db()
    
    # Get session
    session = await db.demo_access_logs.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all events for this session
    events = await db.demo_events.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(1000)
    
    return success_response({
        "session": serialize_doc(session),
        "events": [serialize_doc(e) for e in events],
        "event_count": len(events)
    })


@admin_router.get("/cases/{case_id}/demo-config")
async def get_case_demo_config(case_id: str):
    """Get demo configuration for a case"""
    db = get_db()
    
    case = await db.cms_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return success_response({
        "demo_enabled": case.get("demo_enabled", False),
        "demo_slug": case.get("demo_slug"),
        "demo_label_id": case.get("demo_label_id"),
        "demo_label_en": case.get("demo_label_en"),
    })


@admin_router.patch("/cases/{case_id}/demo-config")
async def update_case_demo_config(case_id: str, config: dict):
    """Update demo configuration for a case"""
    db = get_db()
    
    # Validate config
    allowed_fields = ["demo_enabled", "demo_slug", "demo_label_id", "demo_label_en"]
    update_data = {k: v for k, v in config.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.cms_cases.update_one(
        {"id": case_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return success_response({"message": "Demo config updated", "updated": update_data})
