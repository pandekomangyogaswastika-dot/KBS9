"""Admin dashboard + Leads (CRM) pipeline + Client management. Phase 20B+20C update."""
import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core_utils import new_id, now_iso, paginate_response, serialize_doc, serialize_list, success_response
from db import get_db
from security import require_role
import notification_service as inapp

router = APIRouter(prefix="/api/admin")

PIPELINE_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost", "archived"]

_CONTENT_COLLECTIONS = [
    "cms_services", "cms_cases", "cms_team", "cms_clients",
    "cms_tech", "cms_blog", "cms_careers", "cms_home_blocks",
]


# ─── STATS ───────────────────────────────────────────────────────────────────

@router.get("/stats")
async def stats(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    counts = {}
    for col in _CONTENT_COLLECTIONS + ["crm_leads", "system_users", "media_assets"]:
        counts[col] = await db[col].count_documents({"voided": {"$ne": True}})
    new_leads = await db.crm_leads.count_documents({"voided": {"$ne": True}, "status": "new"})
    recent_cursor = db.crm_leads.find({"voided": {"$ne": True}}).sort("created_at", -1).limit(5)
    recent = serialize_list(await recent_cursor.to_list(5))
    return success_response({"counts": counts, "new_leads": new_leads, "recent_leads": recent})


# ─── LEADS / CRM PIPELINE ────────────────────────────────────────────────────

@router.get("/leads")
async def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = None,
    source: str | None = None,
    search: str | None = None,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    flt: dict = {"voided": {"$ne": True}}
    if status:
        flt["status"] = status
    if source:
        flt["source"] = source
    if search:
        flt["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"email": {"$regex": re.escape(search), "$options": "i"}},
            {"company": {"$regex": re.escape(search), "$options": "i"}},
        ]
    total = await db.crm_leads.count_documents(flt)
    cursor = db.crm_leads.find(flt).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    docs = serialize_list(await cursor.to_list(limit))
    # Add pipeline counts per stage
    stage_counts = {}
    for stage in PIPELINE_STAGES:
        stage_counts[stage] = await db.crm_leads.count_documents({"voided": {"$ne": True}, "status": stage})
    return {**paginate_response(docs, total, page, limit), "stage_counts": stage_counts}


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    lead = await db.crm_leads.find_one({"id": lead_id, "voided": {"$ne": True}})
    if not lead:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lead tidak ditemukan"})
    events = serialize_list(await db.crm_lead_events.find({"lead_id": lead_id}).sort("created_at", 1).to_list(200))
    row = serialize_doc(lead)
    row["events"] = events
    return success_response(row)


class LeadUpdateIn(BaseModel):
    status: str | None = None
    notes: str | None = None
    assigned_to: str | None = None
    company: str | None = None
    phone: str | None = None
    source: str | None = None


@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: str,
    payload: LeadUpdateIn,
    user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    lead = await db.crm_leads.find_one({"id": lead_id, "voided": {"$ne": True}})
    if not lead:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lead tidak ditemukan"})

    updates: dict[str, Any] = {"updated_at": now_iso()}
    if payload.status is not None:
        if payload.status not in PIPELINE_STAGES:
            raise HTTPException(status_code=422, detail={"code": "INVALID_STATUS", "message": f"Status harus salah satu dari: {', '.join(PIPELINE_STAGES)}"})
        old_status = lead.get("status", "new")
        updates["status"] = payload.status
        # Log the transition event
        if old_status != payload.status:
            await _log_event(db, lead_id, "status_changed",
                f"Status berubah: {old_status} → {payload.status}",
                user["id"], {"from": old_status, "to": payload.status})
    if payload.notes is not None:
        updates["notes"] = payload.notes
        await _log_event(db, lead_id, "note_added", payload.notes[:200], user["id"])
    if payload.assigned_to is not None:
        updates["assigned_to"] = payload.assigned_to
    if payload.company is not None:
        updates["company"] = payload.company
    if payload.phone is not None:
        updates["phone"] = payload.phone
    if payload.source is not None:
        updates["source"] = payload.source

    await db.crm_leads.update_one({"id": lead_id}, {"$set": updates})
    updated = await db.crm_leads.find_one({"id": lead_id})
    return success_response(serialize_doc(updated))


class LeadNoteIn(BaseModel):
    note: str = Field(min_length=1, max_length=2000)
    event_type: str = "note"  # note|call|email|meeting


@router.post("/leads/{lead_id}/events")
async def add_lead_event(
    lead_id: str,
    payload: LeadNoteIn,
    user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    lead = await db.crm_leads.find_one({"id": lead_id, "voided": {"$ne": True}})
    if not lead:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lead tidak ditemukan"})
    event = await _log_event(db, lead_id, payload.event_type, payload.note, user["id"])
    # Auto-trigger: jika event_type=email atau call dan status masih new → contacted
    if payload.event_type in ("email", "call", "meeting") and lead.get("status") == "new":
        await _auto_transition(db, lead_id, "new", "contacted", "system",
                               f"Auto: status berubah ke contacted setelah {payload.event_type}")
    return success_response(serialize_doc(event))


class ConvertLeadIn(BaseModel):
    password: str = Field(min_length=8, max_length=100, default="Client#2026")
    send_welcome: bool = True


@router.post("/leads/{lead_id}/convert")
async def convert_lead(
    lead_id: str,
    payload: ConvertLeadIn,
    user=Depends(require_role("admin")),
):
    """Convert lead menjadi client user. Auto-set status=won."""
    from security import hash_password
    db = get_db()
    lead = await db.crm_leads.find_one({"id": lead_id, "voided": {"$ne": True}})
    if not lead:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lead tidak ditemukan"})
    if lead.get("converted_user_id"):
        raise HTTPException(status_code=409, detail={"code": "ALREADY_CONVERTED", "message": "Lead sudah pernah dikonversi"})
    # Check duplicate email
    existing = await db.system_users.find_one({"email": lead["email"], "voided": {"$ne": True}})
    if existing:
        raise HTTPException(status_code=409, detail={"code": "EMAIL_TAKEN", "message": "Email sudah terdaftar sebagai user"})
    now = now_iso()
    client_user = {
        "id": new_id(), "created_at": now, "updated_at": now, "voided": False,
        "role": "client", "status": "active",
        "name": lead["name"], "email": lead["email"],
        "company": lead.get("company"), "phone": lead.get("phone"),
        "password_hash": hash_password(payload.password),
        "lead_id": lead_id,
    }
    await db.system_users.insert_one(client_user)
    # Update lead: status=won, converted_user_id
    await db.crm_leads.update_one(
        {"id": lead_id},
        {"$set": {"status": "won", "converted_user_id": client_user["id"], "updated_at": now}}
    )
    await _log_event(db, lead_id, "converted",
        f"Lead dikonversi menjadi client user: {lead['email']}", user["id"],
        {"client_user_id": client_user["id"]})
    return success_response({"client_user_id": client_user["id"], "email": lead["email"]})


async def _log_event(db, lead_id: str, event_type: str, description: str,
                     actor_id: str, metadata: dict | None = None) -> dict:
    doc = {
        "id": new_id(), "lead_id": lead_id, "event_type": event_type,
        "description": description, "actor_id": actor_id,
        "metadata": metadata or {}, "created_at": now_iso(),
    }
    await db.crm_lead_events.insert_one(doc)
    return doc


async def _auto_transition(db, lead_id: str, from_status: str, to_status: str,
                           actor_id: str, description: str):
    result = await db.crm_leads.update_one(
        {"id": lead_id, "status": from_status, "voided": {"$ne": True}},
        {"$set": {"status": to_status, "updated_at": now_iso()}}
    )
    if result.modified_count > 0:
        await _log_event(db, lead_id, "auto_transition", description, actor_id,
                         {"from": from_status, "to": to_status})


# ─── AUTO-TRIGGER SERVICE ─────────────────────────────────────────────────────
# Dipanggil dari modul lain (assessment, projects) untuk trigger transisi

async def trigger_lead_on_assessment_assigned(lead_email: str):
    """Ketika assessment di-assign ke lead/client, auto → qualified."""
    db = get_db()
    lead = await db.crm_leads.find_one(
        {"email": lead_email, "voided": {"$ne": True}, "status": {"$in": ["new", "contacted"]}}
    )
    if lead:
        await _auto_transition(db, lead["id"], lead["status"], "qualified",
                               "system", "Auto: assessment dikirim → status qualified")


async def trigger_lead_on_project_created(lead_email: str):
    """Ketika project dibuat untuk client dari lead, auto → proposal."""
    db = get_db()
    lead = await db.crm_leads.find_one(
        {"email": lead_email, "voided": {"$ne": True}, "status": {"$in": ["new", "contacted", "qualified"]}}
    )
    if lead:
        await _auto_transition(db, lead["id"], lead["status"], "proposal",
                               "system", "Auto: project dibuat → status proposal")


# ─── CLIENT MANAGEMENT ────────────────────────────────────────────────────────

@router.get("/clients")
async def list_clients(
    search: str | None = None,
    status: str | None = None,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    flt: dict = {"role": "client", "voided": {"$ne": True}}
    if status:
        flt["status"] = status
    if search:
        flt["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"email": {"$regex": re.escape(search), "$options": "i"}},
            {"company": {"$regex": re.escape(search), "$options": "i"}},
        ]
    clients = serialize_list(await db.system_users.find(flt).sort("created_at", -1).to_list(200))

    # Enrich each client with aggregated info
    for c in clients:
        uid = c["id"]
        c["project_count"] = await db.pm_projects.count_documents({"client_id": uid, "voided": {"$ne": True}})
        c["assessment_count"] = await db.assessment_sessions.count_documents({"client_user_id": uid, "voided": {"$ne": True}})
        c["assessment_submitted"] = await db.assessment_sessions.count_documents({"client_user_id": uid, "status": "submitted", "voided": {"$ne": True}})
        c.pop("password_hash", None)
    return success_response(clients)


@router.get("/clients/{client_id}")
async def get_client(
    client_id: str,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    client = await db.system_users.find_one({"id": client_id, "role": "client", "voided": {"$ne": True}})
    if not client:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Client tidak ditemukan"})
    row = serialize_doc(client)
    row.pop("password_hash", None)
    # Linked projects
    projects = serialize_list(await db.pm_projects.find({"client_id": client_id, "voided": {"$ne": True}}).sort("created_at", -1).to_list(20))
    # Linked assessments
    assessments = serialize_list(await db.assessment_sessions.find({"client_user_id": client_id, "voided": {"$ne": True}}).sort("created_at", -1).to_list(20))
    # Enrich assessments with template name
    tpl_ids = [a.get("template_id") for a in assessments if a.get("template_id")]
    templates = {t["id"]: t for t in await db.assessment_templates.find({"id": {"$in": tpl_ids}}).to_list(50)} if tpl_ids else {}
    for a in assessments:
        tpl = templates.get(a.get("template_id"))
        a["template_name"] = tpl.get("name") if tpl else None
        a["share_url"] = f"/assessment/{a.get('token')}"
    # Linked lead
    lead = None
    if row.get("lead_id"):
        lead_doc = await db.crm_leads.find_one({"id": row["lead_id"]})
        if lead_doc:
            lead = serialize_doc(lead_doc)
    elif row.get("email"):
        lead_doc = await db.crm_leads.find_one({"email": row["email"], "voided": {"$ne": True}})
        if lead_doc:
            lead = serialize_doc(lead_doc)
    row["projects"] = projects
    row["assessments"] = assessments
    row["lead"] = lead
    return success_response(row)


@router.patch("/clients/{client_id}")
async def update_client(
    client_id: str,
    payload: dict,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    client = await db.system_users.find_one({"id": client_id, "role": "client", "voided": {"$ne": True}})
    if not client:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Client tidak ditemukan"})
    allowed = {"name", "company", "phone", "status", "notes"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    updates["updated_at"] = now_iso()
    await db.system_users.update_one({"id": client_id}, {"$set": updates})
    updated = await db.system_users.find_one({"id": client_id})
    row = serialize_doc(updated)
    row.pop("password_hash", None)
    return success_response(row)
