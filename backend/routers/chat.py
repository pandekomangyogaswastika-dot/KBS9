"""Chat / Messaging router (KTI Phase 5/6)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import get_current_user, require_role
import notification_service as inapp

router = APIRouter(prefix="/api")


def _thread_access(thread: dict, user: dict) -> bool:
    if not thread:
        return False
    role = user["role"]
    uid = user["id"]
    if role == "admin":
        return True
    if role == "staff" and uid in (thread.get("staff_ids") or []):
        return True
    if role == "client" and thread.get("client_id") == uid:
        return True
    return False


@router.get("/threads")
async def list_threads(user=Depends(get_current_user)):
    db = get_db()
    filt = {"voided": {"$ne": True}}
    if user["role"] == "client":
        filt["client_id"] = user["id"]
    elif user["role"] == "staff":
        filt["staff_ids"] = user["id"]
    threads = await db.chat_threads.find(filt).sort("last_message_at", -1).to_list(100)
    result = []
    for t in threads:
        t = serialize_doc(t)
        # last message preview
        last = await db.chat_messages.find_one(
            {"thread_id": t["id"], "voided": {"$ne": True}},
            sort=[("created_at", -1)]
        )
        t["last_message"] = last["body"][:80] if last else ""
        t["unread"] = 0  # simplified: no unread tracking in MVP
        result.append(t)
    return success_response(result)


@router.post("/threads")
async def create_thread(payload: dict, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = now_iso()
    client_id = payload.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": "client_id wajib diisi"})
    # check if thread already exists for this project+client combo
    project_id = payload.get("project_id")
    subject = payload.get("subject", "Diskusi Proyek")
    existing_filt = {"client_id": client_id, "voided": {"$ne": True}}
    if project_id:
        existing_filt["project_id"] = project_id
    existing = await db.chat_threads.find_one(existing_filt)
    if existing:
        return success_response(serialize_doc(existing))
    staff_ids = [user["id"]] if user["role"] in ("staff", "admin") else []
    doc = {
        "id": new_id(), "project_id": project_id, "client_id": client_id,
        "staff_ids": staff_ids, "subject": subject,
        "last_message_at": now, "created_at": now, "updated_at": now,
        "created_by": user["id"], "voided": False,
    }
    await db.chat_threads.insert_one(doc)
    return success_response(serialize_doc(doc))


@router.get("/threads/{thread_id}/messages")
async def list_messages(thread_id: str, user=Depends(get_current_user)):
    db = get_db()
    thread = await db.chat_threads.find_one({"id": thread_id, "voided": {"$ne": True}})
    if not _thread_access(thread, user):
        raise HTTPException(status_code=403, detail={"code": "AUTH_INSUFFICIENT_PERMISSION", "message": "Akses ditolak"})
    messages = await db.chat_messages.find(
        {"thread_id": thread_id, "voided": {"$ne": True}}
    ).sort("created_at", 1).to_list(500)
    # enrich with sender name
    result = []
    sender_cache = {}
    for m in messages:
        m = serialize_doc(m)
        sid = m.get("sender_id")
        if sid and sid not in sender_cache:
            su = await db.system_users.find_one({"id": sid}, {"_id": 0, "name": 1, "role": 1})
            sender_cache[sid] = {"name": su["name"], "role": su["role"]} if su else {"name": "Unknown", "role": ""}
        m["sender"] = sender_cache.get(sid, {"name": "Unknown", "role": ""})
        result.append(m)
    return success_response(result)


class MessageIn(BaseModel):
    body: str
    attachments: Optional[List[str]] = []


@router.post("/threads/{thread_id}/messages")
async def send_message(thread_id: str, payload: MessageIn, user=Depends(get_current_user)):
    db = get_db()
    thread = await db.chat_threads.find_one({"id": thread_id, "voided": {"$ne": True}})
    if not _thread_access(thread, user):
        raise HTTPException(status_code=403, detail={"code": "AUTH_INSUFFICIENT_PERMISSION", "message": "Akses ditolak"})
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": "Pesan tidak boleh kosong"})
    now = now_iso()
    doc = {
        "id": new_id(), "thread_id": thread_id,
        "sender_id": user["id"], "body": payload.body.strip(),
        "attachments": payload.attachments or [],
        "created_at": now, "updated_at": now, "voided": False,
    }
    await db.chat_messages.insert_one(doc)
    await db.chat_threads.update_one({"id": thread_id}, {"$set": {"last_message_at": now}})
    # enrich
    msg = serialize_doc(doc)
    msg["sender"] = {"name": user["name"], "role": user["role"]}
    # Phase 15: notify other thread participants (not the sender)
    try:
        recipients = set((thread.get("staff_ids") or []))
        if thread.get("client_id"):
            recipients.add(thread["client_id"])
        recipients.discard(user["id"])
        if recipients:
            preview = (payload.body or "")[:140]
            await inapp.create_for_users(
                list(recipients),
                "chat.message",
                title=f"Pesan baru dari {user.get('name', '—')}",
                body=preview,
                link="/portal/messages" if user["role"] == "client" else "/portal/admin/messages",
                actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
                metadata={"thread_id": thread_id, "message_id": doc["id"]},
            )
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(msg)


@router.patch("/threads/{thread_id}/staff")
async def add_staff_to_thread(thread_id: str, payload: dict, user=Depends(require_role("admin", "staff"))):
    """Admin/staff can add staff members to a thread."""
    db = get_db()
    staff_id = payload.get("staff_id")
    if not staff_id:
        raise HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": "staff_id wajib diisi"})
    await db.chat_threads.update_one(
        {"id": thread_id},
        {"$addToSet": {"staff_ids": staff_id}, "$set": {"updated_at": now_iso()}}
    )
    return success_response({"added": True})
