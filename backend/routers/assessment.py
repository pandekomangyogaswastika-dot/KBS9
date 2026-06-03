"""Assessment module — Phase 20A update.
Added: Template CRUD (create/update/publish/delete),
client_user_id assignment, GET /my for client portal.
"""
import io
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from assessment_engine import compute_progress, get_all_question_ids, get_required_question_ids, answers_list_to_map
from assessment_pdf import build_pdf
from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import require_role
from storage import get_storage
from assessment_excel import generate_excel_template, parse_excel_template

router = APIRouter(prefix="/api/assessment")

ALLOWED_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".docx"}
MAX_BYTES = 10 * 1024 * 1024
MAX_PER_QUESTION = 5


def _ext(filename: str) -> str:
    return ("." + filename.rsplit(".", 1)[1].lower()) if filename and "." in filename else ""


async def _session_by_token(token: str) -> dict:
    db = get_db()
    s = await db.assessment_sessions.find_one({"token": token, "voided": {"$ne": True}})
    if not s:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan / link tidak valid"})
    return s


async def _template_for(session: dict) -> dict:
    db = get_db()
    t = await db.assessment_templates.find_one({"id": session["template_id"]})
    if not t:
        raise HTTPException(status_code=404, detail={"code": "TEMPLATE_MISSING", "message": "Template tidak ditemukan"})
    return t


# ─── TEMPLATE MANAGEMENT ────────────────────────────────────────────────────

class QuestionIn(BaseModel):
    id: str | None = None
    text: dict  # {"id": "...", "en": "..."}  — main question text
    prompt: dict | None = None  # alias for text (KN3 format)
    type: str = "text"  # text|textarea|select|multiselect|yesno|scale|number|date
    options: list[dict] | None = None  # for select/multiselect: [{"value": "...", "label": {...}}]
    required: bool = True
    weight: float = 1.0
    hint: dict | None = None            # {"id": "...", "en": "..."}
    show_if: dict | None = None         # {"question_id": "...", "operator": "equals", "value": "..."}
    scale_labels: dict | None = None    # {"1": "...", "2": "...", "5": "..."} or {"min": "...", "max": "..."}

class SectionIn(BaseModel):
    id: str | None = None
    title: dict  # {"id": "...", "en": "..."}
    description: dict | None = None
    color: str | None = None            # hex color for domain visual
    icon: str | None = None             # lucide icon name
    questions: list[QuestionIn] = []

class TemplateIn(BaseModel):
    name: dict  # {"id": "...", "en": "..."}
    description: str | dict | None = None  # accepts string (TemplateEditorV2 sends str) or dict
    category: str = "general"  # general|it_maturity|security|digital_ops|custom
    sections: list[SectionIn] = []
    locale_default: str = "id"

class TemplateUpdate(BaseModel):
    name: dict | None = None
    description: str | dict | None = None  # accepts string (TemplateEditorV2 sends str) or dict
    category: str | None = None
    sections: list[SectionIn] | None = None
    locale_default: str | None = None
    published: bool | None = None  # explicit publish toggle (used by TemplateEditorV2 on save)


@router.get("/templates")
async def list_templates(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    docs = await db.assessment_templates.find({"voided": {"$ne": True}}).sort("created_at", -1).to_list(100)
    out = []
    for d in docs:
        row = serialize_doc(d)
        # Support both 'sections' (legacy) and 'domains' (KN3-style)
        sections = d.get("sections") or d.get("domains") or []
        total_q = sum(len(s.get("questions", [])) for s in sections)
        row["question_count"] = total_q
        row["section_count"] = len(sections)
        row["domain_count"] = len(sections)
        # Normalize published flag: support both 'published' and 'is_published'
        row["published"] = bool(d.get("published") or d.get("is_published"))
        out.append(row)
    return success_response(out)


@router.get("/templates/excel-template")
async def download_excel_template_route(_user=Depends(require_role("admin", "staff"))):
    """Download blank Excel template for assessment import. (Must be before /{template_id})"""
    xlsx_bytes = generate_excel_template()
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=assessment_template.xlsx"},
    )


@router.get("/templates/{template_id}")
async def get_template(template_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    doc = await db.assessment_templates.find_one({"id": template_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Template tidak ditemukan"})
    return success_response(serialize_doc(doc))


@router.post("/templates", status_code=201)
async def create_template(payload: TemplateIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = now_iso()
    # Build sections with auto-generated IDs
    sections = []
    for sec in payload.sections:
        sec_id = sec.id or new_id()
        questions = []
        for q in sec.questions:
            questions.append({
                "id": q.id or new_id(),
                "text": q.prompt or q.text,
                "type": q.type,
                "options": q.options,
                "required": q.required,
                "weight": q.weight,
                "hint": q.hint,
                "show_if": q.show_if,
                "scale_labels": q.scale_labels,
            })
        sections.append({"id": sec_id, "title": sec.title, "description": sec.description, "color": sec.color, "icon": sec.icon, "questions": questions})

    doc = {
        "id": new_id(), "created_at": now, "updated_at": now, "created_by": user["id"],
        "voided": False, "published": False,
        "name": payload.name,
        "description": payload.description,
        "category": payload.category,
        "sections": sections,
        "locale_default": payload.locale_default,
    }
    await db.assessment_templates.insert_one(doc)
    return success_response(serialize_doc(doc))


@router.patch("/templates/{template_id}")
@router.put("/templates/{template_id}")
async def update_template(template_id: str, payload: TemplateUpdate, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    doc = await db.assessment_templates.find_one({"id": template_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Template tidak ditemukan"})
    # If template is published and content is being changed, auto-unpublish
    was_published = bool(doc.get("published") or doc.get("is_published"))

    updates: dict[str, Any] = {"updated_at": now_iso()}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.category is not None:
        updates["category"] = payload.category
    if payload.locale_default is not None:
        updates["locale_default"] = payload.locale_default
    if payload.sections is not None:
        sections = []
        for sec in payload.sections:
            sec_id = sec.id or new_id()
            questions = []
            for q in sec.questions:
                questions.append({
                    "id": q.id or new_id(), "text": q.prompt or q.text, "type": q.type,
                    "options": q.options, "required": q.required,
                    "weight": q.weight, "hint": q.hint,
                    "show_if": q.show_if, "scale_labels": q.scale_labels,
                })
            sections.append({"id": sec_id, "title": sec.title, "description": sec.description, "color": sec.color, "icon": sec.icon, "questions": questions})
        updates["sections"] = sections
        # Content changed: if was published, unpublish so admin can review before re-publishing
        if was_published:
            updates["published"] = False
            updates["is_published"] = False
    elif payload.published is not None:
        updates["published"] = payload.published
        updates["is_published"] = payload.published

    await db.assessment_templates.update_one({"id": template_id}, {"$set": updates})
    updated = await db.assessment_templates.find_one({"id": template_id})
    return success_response(serialize_doc(updated))


@router.post("/templates/{template_id}/publish")
async def toggle_publish(template_id: str, user=Depends(require_role("admin"))):
    db = get_db()
    doc = await db.assessment_templates.find_one({"id": template_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Template tidak ditemukan"})
    # Support both 'sections' (standard) and 'domains' (KN3-style)
    all_sections = doc.get("sections") or doc.get("domains") or []
    total_q = sum(len(s.get("questions", [])) for s in all_sections)
    currently_published = bool(doc.get("published") or doc.get("is_published"))
    # Only validate question count when PUBLISHING (not when unpublishing)
    if not currently_published and total_q == 0:
        raise HTTPException(status_code=422, detail={"code": "NO_QUESTIONS", "message": "Template harus memiliki minimal 1 pertanyaan sebelum dipublish"})
    new_state = not currently_published
    await db.assessment_templates.update_one({"id": template_id}, {"$set": {"published": new_state, "is_published": new_state, "updated_at": now_iso()}})
    return success_response({"id": template_id, "published": new_state})


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, _user=Depends(require_role("admin"))):
    db = get_db()
    doc = await db.assessment_templates.find_one({"id": template_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Template tidak ditemukan"})
    # Check no active sessions
    active = await db.assessment_sessions.count_documents({"template_id": template_id, "voided": {"$ne": True}})
    if active > 0:
        raise HTTPException(status_code=409, detail={"code": "HAS_SESSIONS", "message": f"Template ini digunakan oleh {active} sesi aktif, tidak bisa dihapus."})
    await db.assessment_templates.update_one({"id": template_id}, {"$set": {"voided": True, "updated_at": now_iso()}})
    return success_response({"id": template_id, "deleted": True})


# ─── EXCEL IMPORT / EXPORT ───────────────────────────────────────────────────

@router.post("/templates/import-excel", status_code=201)
async def import_template_from_excel(
    file: UploadFile = File(...),
    name_id: str = Form(...),
    name_en: str = Form(default=""),
    description: str = Form(default=""),
    category: str = Form(default="general"),
    user=Depends(require_role("admin", "staff")),
):
    """Import assessment template from Excel file."""
    ext = (_ext(file.filename or "")).lower()
    if ext not in (".xlsx", ".xls"):
        raise HTTPException(status_code=415, detail={"code": "BAD_FORMAT", "message": "File harus berformat .xlsx atau .xls"})
    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail={"code": "TOO_LARGE", "message": "File melebihi 10 MB"})
    try:
        sections = parse_excel_template(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"code": "PARSE_ERROR", "message": f"Gagal membaca Excel: {str(e)}"})
    if not sections:
        raise HTTPException(status_code=422, detail={"code": "EMPTY", "message": "File Excel kosong atau tidak ada pertanyaan yang valid"})
    total_q = sum(len(s.get("questions", [])) for s in sections)
    now = now_iso()
    doc = {
        "id": new_id(), "created_at": now, "updated_at": now, "created_by": user["id"],
        "voided": False, "published": False,
        "name": {"id": name_id.strip(), "en": name_en.strip() or name_id.strip()},
        "description": {"id": description.strip(), "en": description.strip()} if description.strip() else None,
        "category": category,
        "sections": sections,
        "locale_default": "id",
        "imported_from": "excel",
    }
    db = get_db()
    await db.assessment_templates.insert_one(doc)
    return success_response({
        **serialize_doc(doc),
        "sections_count": len(sections),
        "questions_count": total_q,
    })


# ─── SESSION MANAGEMENT ─────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    template_id: str
    client_name: str = Field(min_length=2, max_length=200)
    client_user_id: str | None = None
    project_name: str | None = None
    contact_person: str | None = None
    contact_email: str | None = None
    due_date: str | None = None
    notes: str | None = None
    locale: str = "id"
    # Branding (22B)
    company_name: str | None = None
    brand_color: str | None = None      # hex e.g. "#5B49C9"
    company_logo_url: str | None = None


@router.post("/sessions", status_code=201)
async def create_session(payload: SessionCreate, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    template = await db.assessment_templates.find_one({"id": payload.template_id, "voided": {"$ne": True}})
    if not template:
        raise HTTPException(status_code=404, detail={"code": "TEMPLATE_NOT_FOUND", "message": "Template tidak ditemukan"})
    # Verify client_user_id if provided
    if payload.client_user_id:
        cu = await db.system_users.find_one({"id": payload.client_user_id, "role": "client", "voided": {"$ne": True}})
        if not cu:
            raise HTTPException(status_code=404, detail={"code": "CLIENT_NOT_FOUND", "message": "Client user tidak ditemukan"})

    now = now_iso()
    token = new_id()
    session = {
        "id": new_id(), "token": token, "template_id": payload.template_id,
        "client_name": payload.client_name.strip(),
        "client_user_id": payload.client_user_id,
        "project_name": (payload.project_name or "").strip() or None,
        "contact_person": (payload.contact_person or "").strip() or None,
        "contact_email": (payload.contact_email or "").strip() or None,
        "due_date": payload.due_date,
        "notes": (payload.notes or "").strip() or None,
        "locale": payload.locale if payload.locale in ("id", "en") else "id",
        # Branding
        "company_name": (payload.company_name or "").strip() or None,
        "brand_color": payload.brand_color or None,
        "company_logo_url": payload.company_logo_url or None,
        "status": "draft", "created_at": now, "updated_at": now, "created_by": user["id"],
        "submitted_at": None, "acknowledged_at": None, "voided": False, "voided_at": None,
    }
    await db.assessment_sessions.insert_one(session)
    out = serialize_doc(dict(session))
    out["share_url"] = f"/assessment/{token}"
    return success_response(out)


@router.get("/sessions")
async def list_sessions(limit: int = Query(100, ge=1, le=300), _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    sessions = await db.assessment_sessions.find({"voided": {"$ne": True}}).sort("created_at", -1).to_list(limit)
    templates = {t["id"]: t for t in await db.assessment_templates.find({}).to_list(100)}
    # Build user lookup
    user_ids = [s["client_user_id"] for s in sessions if s.get("client_user_id")]
    users_lookup = {}
    if user_ids:
        users = await db.system_users.find({"id": {"$in": user_ids}}).to_list(200)
        users_lookup = {u["id"]: u for u in users}
    out = []
    for s in sessions:
        tpl = templates.get(s.get("template_id"))
        answers = serialize_list(await db.assessment_answers.find({"session_id": s["id"]}).to_list(1000))
        progress = compute_progress(tpl, answers) if tpl else {"answered": 0, "total": 0, "percent": 0, "domains": []}
        row = serialize_doc(s)
        row["progress"] = progress
        row["share_url"] = f"/assessment/{s.get('token')}"
        row["is_new_submission"] = s.get("status") == "submitted" and not s.get("acknowledged_at")
        row["template_name"] = _localize_name(tpl.get("name")) if tpl else None
        cu = users_lookup.get(s.get("client_user_id"))
        row["client_user_name"] = cu.get("name") if cu else None
        row["client_user_email"] = cu.get("email") if cu else None
        out.append(row)
    return success_response(out)


@router.get("/stats")
async def assessment_stats(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    flt = {"voided": {"$ne": True}}
    total = await db.assessment_sessions.count_documents(flt)
    submitted = await db.assessment_sessions.count_documents({**flt, "status": "submitted"})
    new_subs = await db.assessment_sessions.count_documents({**flt, "status": "submitted", "acknowledged_at": None})
    latest = await db.assessment_sessions.find({**flt, "status": "submitted"}).sort("submitted_at", -1).limit(1).to_list(1)
    tpl_count = await db.assessment_templates.count_documents({"voided": {"$ne": True}})
    published_count = await db.assessment_templates.count_documents({
        "voided": {"$ne": True},
        "$or": [{"published": True}, {"is_published": True}]
    })
    return success_response({
        "total_sessions": total, "submitted_sessions": submitted, "draft_sessions": total - submitted,
        "new_submissions": new_subs,
        "latest_submission": serialize_doc(latest[0]) if latest else None,
        "total_templates": tpl_count, "published_templates": published_count,
    })


@router.post("/sessions/{session_id}/acknowledge")
async def acknowledge_session(session_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    res = await db.assessment_sessions.update_one(
        {"id": session_id, "voided": {"$ne": True}},
        {"$set": {"acknowledged_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan"})
    return success_response({"id": session_id, "acknowledged_at": now_iso()})


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    session = await db.assessment_sessions.find_one({"id": session_id, "voided": {"$ne": True}})
    if not session:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan"})
    await db.assessment_sessions.update_one(
        {"id": session_id},
        {"$set": {"voided": True, "voided_at": now_iso(), "updated_at": now_iso()}}
    )
    return success_response({"id": session_id, "deleted": True})


@router.post("/sessions/{session_id}/upload-logo")
async def upload_session_logo(
    session_id: str,
    file: UploadFile = File(...),
    _user=Depends(require_role("admin", "staff")),
):
    """Upload company logo for a session. Stored via StorageBackend."""
    db = get_db()
    session = await db.assessment_sessions.find_one({"id": session_id, "voided": {"$ne": True}})
    if not session:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan"})
    ext = _ext(file.filename or "")
    allowed_logo_ext = {".png", ".jpg", ".jpeg", ".svg", ".webp"}
    if ext not in allowed_logo_ext:
        raise HTTPException(status_code=415, detail={"code": "BAD_EXT", "message": "Logo harus berformat PNG, JPG, SVG, atau WebP"})
    raw = await file.read()
    if len(raw) > 2 * 1024 * 1024:  # 2 MB max for logo
        raise HTTPException(status_code=413, detail={"code": "TOO_LARGE", "message": "Logo melebihi 2 MB"})
    storage = get_storage()
    url = storage.save(raw, ext)
    await db.assessment_sessions.update_one(
        {"id": session_id},
        {"$set": {"company_logo_url": url, "updated_at": now_iso()}}
    )
    return success_response({"url": url})


# ─── CLIENT PORTAL: my assessments ──────────────────────────────────────────

@router.get("/my")
async def my_assessments(user=Depends(require_role("client"))):
    """Client portal: list assessment sessions assigned to this client user."""
    db = get_db()
    sessions = await db.assessment_sessions.find(
        {"client_user_id": user["id"], "voided": {"$ne": True}}
    ).sort("created_at", -1).to_list(50)
    templates = {t["id"]: t for t in await db.assessment_templates.find({}).to_list(100)}
    out = []
    for s in sessions:
        tpl = templates.get(s.get("template_id"))
        answers = serialize_list(await db.assessment_answers.find({"session_id": s["id"]}).to_list(1000))
        progress = compute_progress(tpl, answers) if tpl else {"answered": 0, "total": 0, "percent": 0, "domains": []}
        row = serialize_doc(s)
        row["progress"] = progress
        row["share_url"] = f"/assessment/{s.get('token')}"
        row["template_name"] = _localize_name(tpl.get("name")) if tpl else None
        row["template_description"] = _localize_name(tpl.get("description")) if tpl else None
        out.append(row)
    return success_response(out)


def _localize_name(name_field, locale="id"):
    """Safely extract string from name field (string or dict)."""
    if not name_field:
        return None
    if isinstance(name_field, str):
        return name_field
    if isinstance(name_field, dict):
        return name_field.get(locale) or name_field.get("id") or name_field.get("en") or str(name_field)
    return str(name_field)


# ─── PUBLIC TOKEN-BASED FLOW ─────────────────────────────────────────────────

@router.get("/{token}")
async def get_session_public(token: str):
    session = await _session_by_token(token)
    template = await _template_for(session)
    db = get_db()
    answers = serialize_list(await db.assessment_answers.find({"session_id": session["id"]}).to_list(1000))
    progress = compute_progress(template, answers)
    row = serialize_doc(session)
    row["template"] = serialize_doc(template)
    row["answers"] = answers
    row["progress"] = progress
    return success_response(row)


class AnswerIn(BaseModel):
    question_id: str
    value: Any


@router.post("/{token}/answers")
async def upsert_answers(token: str, payload: list[AnswerIn]):
    session = await _session_by_token(token)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    db = get_db()
    template = await _template_for(session)
    valid_ids = set(get_all_question_ids(template))
    now = now_iso()
    for ans in payload:
        if ans.question_id not in valid_ids:
            continue
        await db.assessment_answers.update_one(
            {"session_id": session["id"], "question_id": ans.question_id},
            {"$set": {"session_id": session["id"], "question_id": ans.question_id,
                      "value": ans.value, "answered_at": now}},
            upsert=True,
        )
    await db.assessment_sessions.update_one({"id": session["id"]}, {"$set": {"updated_at": now}})
    return success_response({"saved": len(payload)})


@router.post("/{token}/submit")
async def submit_session(token: str):
    session = await _session_by_token(token)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    db = get_db()
    template = await _template_for(session)
    answers = serialize_list(await db.assessment_answers.find({"session_id": session["id"]}).to_list(1000))
    required_ids = get_required_question_ids(template)
    answered_ids = {a["question_id"] for a in answers if a.get("value") not in (None, "") and not a.get("skipped")}
    missing = required_ids - answered_ids
    if missing:
        raise HTTPException(status_code=422, detail={"code": "INCOMPLETE", "message": f"{len(missing)} pertanyaan wajib belum diisi"})
    now = now_iso()
    await db.assessment_sessions.update_one(
        {"id": session["id"]},
        {"$set": {"status": "submitted", "submitted_at": now, "updated_at": now}},
    )
    # If linked to a client user, create in-app notification
    if session.get("client_user_id"):
        try:
            import notification_service as inapp
            await inapp.create_for_admin_staff(
                "assessment.submitted",
                title=f"Assessment selesai: {session.get('client_name', '—')}",
                body=f"Assessment '{session.get('project_name') or ''}' telah disubmit.",
                link=f"/portal/admin/assessments",
                metadata={"session_id": session["id"], "client_user_id": session["client_user_id"]},
            )
        except Exception:
            pass
    return success_response({"id": session["id"], "status": "submitted"})


@router.get("/{token}/export")
async def export_pdf(token: str, locale: str = "id", include_ai: bool = False):
    """Export PDF with optional AI insights (generated on-the-fly if include_ai=true)."""
    session = await _session_by_token(token)
    if session.get("status") != "submitted":
        raise HTTPException(status_code=409, detail={"code": "NOT_SUBMITTED", "message": "Sesi belum disubmit"})
    db = get_db()
    template = await _template_for(session)
    answers_list = serialize_list(await db.assessment_answers.find({"session_id": session["id"]}).to_list(1000))
    answers_map = answers_list_to_map(answers_list)
    progress = compute_progress(template, answers_list)
    # Build attachments_by_question
    att_list = serialize_list(await db.assessment_attachments.find({"session_id": session["id"]}).to_list(200))
    attachments_by_question = {}
    for att in att_list:
        attachments_by_question.setdefault(att["question_id"], []).append(att)
    
    # AI report: generate on-the-fly if include_ai=true
    ai_report = None
    if include_ai:
        try:
            from ai_report_service import ai_report_generator
            session_data = {
                "template": serialize_doc(template),
                "answers_map": answers_map,
                "client_name": session.get("client_name", "Client"),
                "project_name": session.get("project_name"),
                "submitted_at": session.get("submitted_at"),
            }
            ai_report = await ai_report_generator.generate_report(session_data, locale=locale)
        except Exception as e:
            print(f"Error generating AI report for PDF: {str(e)}")
            # Continue without AI report
    
    loc = session.get("locale", "id") if locale == "id" else locale
    pdf_bytes = build_pdf(session, template, answers_map, progress, attachments_by_question=attachments_by_question, locale=loc, ai_report=ai_report)
    buf = io.BytesIO(pdf_bytes)
    filename_suffix = "_ai" if include_ai else ""
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=assessment_{token[:8]}{filename_suffix}.pdf"},
    )


@router.post("/{token}/attachments")
async def upload_attachment(
    token: str,
    question_id: str = Form(...),
    file: UploadFile = File(...),
):
    session = await _session_by_token(token)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail={"code": "BAD_EXT", "message": "Tipe file tidak diizinkan"})
    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail={"code": "TOO_LARGE", "message": "File melebihi 10 MB"})
    db = get_db()
    existing = await db.assessment_attachments.count_documents(
        {"session_id": session["id"], "question_id": question_id}
    )
    if existing >= MAX_PER_QUESTION:
        raise HTTPException(status_code=422, detail={"code": "TOO_MANY", "message": f"Maksimal {MAX_PER_QUESTION} file per pertanyaan"})
    storage = get_storage()
    url = storage.save(raw, ext)
    doc = {
        "id": new_id(), "session_id": session["id"], "question_id": question_id,
        "filename": file.filename, "url": url, "size": len(raw),
        "uploaded_at": now_iso(),
    }
    await db.assessment_attachments.insert_one(doc)
    return success_response(serialize_doc(doc))



# ─── PHASE 21B: SESSION DETAIL + AUTH-BASED CLIENT FLOW + AI REPORT ─────────

async def _session_by_id_for_user(session_id: str, user: dict) -> dict:
    """Get session by ID, checking access rights:
    - admin/staff: can see any session
    - client: can only see their own session (client_user_id match)
    """
    db = get_db()
    s = await db.assessment_sessions.find_one({"id": session_id, "voided": {"$ne": True}})
    if not s:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan"})
    role = user.get("role")
    if role == "client" and s.get("client_user_id") != user["id"]:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Anda tidak memiliki akses ke sesi ini"})
    return s


@router.get("/sessions/{session_id}/detail")
async def get_session_detail(session_id: str, user=Depends(require_role("admin", "staff", "client"))):
    """Full session detail: template (with questions), answers, progress, attachments."""
    db = get_db()
    session = await _session_by_id_for_user(session_id, user)
    template = await _template_for(session)
    answers_list = serialize_list(await db.assessment_answers.find({"session_id": session["id"]}).to_list(1000))
    answers_map = answers_list_to_map(answers_list)
    progress = compute_progress(template, answers_list)
    att_list = serialize_list(await db.assessment_attachments.find({"session_id": session["id"]}).to_list(200))
    attachments_by_question = {}
    for att in att_list:
        attachments_by_question.setdefault(att["question_id"], []).append(att)
    row = serialize_doc(session)
    row["template"] = serialize_doc(template)
    row["answers_map"] = answers_map
    row["answers"] = answers_list
    row["progress"] = progress
    row["attachments_by_question"] = attachments_by_question
    return success_response(row)


class AnswerAuthIn(BaseModel):
    question_id: str
    value: Any
    other_text: str | None = None
    note: str | None = None
    skipped: bool = False


@router.patch("/sessions/{session_id}/answers")
async def upsert_answers_auth(session_id: str, payload: list[AnswerAuthIn], user=Depends(require_role("admin", "staff", "client"))):
    """Auth-based answer saving (client portal, by session_id)."""
    session = await _session_by_id_for_user(session_id, user)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    db = get_db()
    template = await _template_for(session)
    valid_ids = set(get_all_question_ids(template))
    now = now_iso()
    for ans in payload:
        if ans.question_id not in valid_ids:
            continue
        update_data = {
            "session_id": session["id"], "question_id": ans.question_id,
            "value": ans.value, "answered_at": now,
            "skipped": ans.skipped,
        }
        if ans.other_text is not None:
            update_data["other_text"] = ans.other_text
        if ans.note is not None:
            update_data["note"] = ans.note
        await db.assessment_answers.update_one(
            {"session_id": session["id"], "question_id": ans.question_id},
            {"$set": update_data},
            upsert=True,
        )
    await db.assessment_sessions.update_one({"id": session["id"]}, {"$set": {"updated_at": now}})
    return success_response({"saved": len(payload)})


@router.post("/sessions/{session_id}/submit")
async def submit_session_auth(session_id: str, user=Depends(require_role("admin", "staff", "client"))):
    """Auth-based submit (client portal, by session_id)."""
    session = await _session_by_id_for_user(session_id, user)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    db = get_db()
    template = await _template_for(session)
    answers = serialize_list(await db.assessment_answers.find({"session_id": session["id"]}).to_list(1000))
    required_ids = get_required_question_ids(template)
    answered_ids = {a["question_id"] for a in answers if a.get("value") not in (None, "") and not a.get("skipped")}
    missing = required_ids - answered_ids
    if missing:
        raise HTTPException(status_code=422, detail={"code": "INCOMPLETE", "message": f"{len(missing)} pertanyaan wajib belum diisi"})
    now = now_iso()
    await db.assessment_sessions.update_one(
        {"id": session["id"]},
        {"$set": {"status": "submitted", "submitted_at": now, "updated_at": now}},
    )
    if session.get("client_user_id"):
        try:
            import notification_service as inapp
            await inapp.create_for_admin_staff(
                "assessment.submitted",
                title=f"Assessment selesai: {session.get('client_name', '—')}",
                body=f"Assessment '{session.get('project_name') or ''}' telah disubmit.",
                link="/portal/admin/assessments",
                metadata={"session_id": session["id"], "client_user_id": session["client_user_id"]},
            )
        except Exception:
            pass
    return success_response({"id": session["id"], "status": "submitted"})


@router.post("/sessions/{session_id}/generate-report")
async def generate_report(session_id: str, locale: str = "id", _user=Depends(require_role("admin", "staff", "client"))):
    """Generate AI analysis report for a submitted session (on-the-fly, not cached)."""
    db = get_db()
    session = await db.assessment_sessions.find_one({"id": session_id, "voided": {"$ne": True}})
    if not session:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Sesi tidak ditemukan"})
    if session.get("status") != "submitted":
        raise HTTPException(status_code=409, detail={"code": "NOT_SUBMITTED", "message": "Sesi harus disubmit terlebih dahulu"})
    
    template = await _template_for(session)
    answers_list = serialize_list(await db.assessment_answers.find({"session_id": session_id}).to_list(1000))
    answers_map = answers_list_to_map(answers_list)
    
    # Build session data for AI service
    session_data = {
        "template": serialize_doc(template),
        "answers_map": answers_map,
        "client_name": session.get("client_name", "Client"),
        "project_name": session.get("project_name"),
        "submitted_at": session.get("submitted_at"),
    }
    
    try:
        from ai_report_service import ai_report_generator
        report = await ai_report_generator.generate_report(session_data, locale=locale)
        return success_response(report)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"code": "AI_ERROR", "message": f"Gagal generate report: {str(e)}"})


@router.delete("/{token}/attachments/{attachment_id}")
async def delete_attachment_public(token: str, attachment_id: str):
    """Delete attachment via public token (for anonymous assessment takers)."""
    db = get_db()
    session = await _session_by_token(token)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    att = await db.assessment_attachments.find_one({"id": attachment_id, "session_id": session["id"]})
    if not att:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lampiran tidak ditemukan"})
    await db.assessment_attachments.delete_one({"id": attachment_id})
    return success_response({"id": attachment_id, "deleted": True})


@router.delete("/sessions/{session_id}/attachments/{attachment_id}")
async def delete_attachment_by_session(session_id: str, attachment_id: str, user=Depends(require_role("admin", "staff", "client"))):
    """Delete attachment by session_id + attachment_id (auth-based)."""
    db = get_db()
    att = await db.assessment_attachments.find_one({"id": attachment_id, "session_id": session_id})
    if not att:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Lampiran tidak ditemukan"})
    # Check if client owns this session
    if user.get("role") == "client":
        session = await db.assessment_sessions.find_one({"id": session_id, "client_user_id": user["id"]})
        if not session:
            raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Akses ditolak"})
    await db.assessment_attachments.delete_one({"id": attachment_id})
    return success_response({"id": attachment_id, "deleted": True})


@router.post("/sessions/{session_id}/attachments")
async def upload_attachment_auth(
    session_id: str,
    question_id: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(require_role("admin", "staff", "client")),
):
    """Auth-based attachment upload (by session_id)."""
    db = get_db()
    session = await _session_by_id_for_user(session_id, user)
    if session.get("status") == "submitted":
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SUBMITTED", "message": "Sesi sudah disubmit"})
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail={"code": "BAD_EXT", "message": "Tipe file tidak diizinkan"})
    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail={"code": "TOO_LARGE", "message": "File melebihi 10 MB"})
    existing = await db.assessment_attachments.count_documents(
        {"session_id": session["id"], "question_id": question_id}
    )
    if existing >= MAX_PER_QUESTION:
        raise HTTPException(status_code=422, detail={"code": "TOO_MANY", "message": f"Maksimal {MAX_PER_QUESTION} file per pertanyaan"})
    storage = get_storage()
    url = storage.save(raw, ext)
    doc = {
        "id": new_id(), "session_id": session["id"], "question_id": question_id,
        "filename": file.filename, "url": url, "size": len(raw),
        "uploaded_at": now_iso(),
    }
    await db.assessment_attachments.insert_one(doc)
    return success_response(serialize_doc(doc))
