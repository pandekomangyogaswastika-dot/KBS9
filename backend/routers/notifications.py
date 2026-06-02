"""Notifications router (Phase 15).

Provides:
  * REST endpoints for users to read / mark / clear their notifications.
  * WebSocket endpoint `/ws/notifications?token=<jwt>` for real-time stream.

WebSocket protocol (JSON text frames):
  * Server → client message kinds:
      - `connected`         : {connected: true, user: {id, name, role}}
      - `notification`      : a persisted in-app notification (data: {...})
      - `topic`             : a topic broadcast (topic: "...", data: {...})
      - `pong`              : reply to client ping
  * Client → server commands (as JSON {action: "..."}):
      - `{"action":"ping"}`
      - `{"action":"subscribe","topic":"project:abc"}`
      - `{"action":"unsubscribe","topic":"project:abc"}`
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status,
)

from core_utils import serialize_doc, serialize_list, success_response
from db import get_db
from realtime import manager
from security import decode_token, get_current_user, require_role

router = APIRouter(prefix="/api")

# Allowed topic prefixes (RBAC enforced in subscribe handler)
_ALLOWED_TOPIC_PREFIXES = ("project:", "approval:", "projects", "leads")


# --------------------------------------------------------------------------- #
# REST endpoints                                                              #
# --------------------------------------------------------------------------- #


@router.get("/notifications")
async def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    user=Depends(get_current_user),
):
    """Return paginated notifications for the current user (newest first)."""
    db = get_db()
    flt: Dict[str, Any] = {"user_id": user["id"]}
    if unread_only:
        flt["read"] = False
    cursor = db.notifications.find(flt, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    total = await db.notifications.count_documents(flt)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return success_response({
        "items": serialize_list(items),
        "total": total,
        "unread": unread,
        "limit": limit,
        "skip": skip,
    })


@router.get("/notifications/unread-count")
async def unread_count(user=Depends(get_current_user)):
    db = get_db()
    n = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return success_response({"unread": n})


@router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    res = await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True, "read_at": now}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Notifikasi tidak ditemukan"})
    return success_response({"id": notif_id, "read": True})


@router.post("/notifications/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    res = await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True, "read_at": now}},
    )
    return success_response({"modified": res.modified_count})


@router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, user=Depends(get_current_user)):
    db = get_db()
    res = await db.notifications.delete_one({"id": notif_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Notifikasi tidak ditemukan"})
    return success_response({"id": notif_id, "deleted": True})


@router.get("/admin/realtime/stats")
async def realtime_stats(_user=Depends(require_role("admin"))):
    """Admin-only observability for the live connection manager."""
    return success_response(manager.stats())


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #


async def _resolve_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode JWT and load active user. Returns None on failure."""
    try:
        payload = decode_token(token, "access")
    except HTTPException:
        return None
    db = get_db()
    user = await db.system_users.find_one({"id": payload.get("sub"), "voided": {"$ne": True}})
    if not user or user.get("status") != "active":
        return None
    return {"id": user["id"], "role": user["role"], "name": user.get("name")}


def _validate_topic_for_role(topic: str, role: str) -> bool:
    """Cheap server-side RBAC for topic subscription.

    `project:<id>` and `approval:<id>` are allowed for any authenticated user
    — actual project access is validated indirectly because notifications
    only get fanned-out to authorised users.
    `leads` and `projects` (collection-level updates) restricted to admin/staff.
    """
    if topic.startswith("project:") or topic.startswith("approval:"):
        return True
    if topic in ("leads", "projects"):
        return role in ("admin", "staff")
    return False


# --------------------------------------------------------------------------- #
# WebSocket endpoint                                                          #
# --------------------------------------------------------------------------- #


@router.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket, token: str = Query(...)):
    """Bidirectional WebSocket. Token validated; user_id used for fan-out."""
    user = await _resolve_user_from_token(token)
    if not user:
        # We have NOT accepted yet, so close gracefully with 4401
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user["id"])
    try:
        await websocket.send_text(json.dumps({
            "kind": "connected",
            "user": user,
        }))
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:  # noqa: BLE001 — ignore non-JSON
                continue
            action = (msg.get("action") or "").lower()
            if action == "ping":
                await websocket.send_text(json.dumps({"kind": "pong"}))
            elif action == "subscribe":
                topic = str(msg.get("topic") or "")
                if topic and _validate_topic_for_role(topic, user["role"]):
                    manager.subscribe(websocket, topic)
                    await websocket.send_text(json.dumps({"kind": "subscribed", "topic": topic}))
            elif action == "unsubscribe":
                topic = str(msg.get("topic") or "")
                if topic:
                    manager.unsubscribe(websocket, topic)
                    await websocket.send_text(json.dumps({"kind": "unsubscribed", "topic": topic}))
            # Unknown actions are silently ignored.
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    finally:
        manager.disconnect(websocket)
