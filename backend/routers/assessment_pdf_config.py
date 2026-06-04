"""CMS PDF Configuration router.

Endpoints:
  GET  /api/admin/pdf-config          — ambil konfigurasi PDF
  PUT  /api/admin/pdf-config          — simpan konfigurasi PDF
  GET  /api/admin/pdf-config/preview  — generate preview PDF (return PDF bytes)
"""
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core_utils import new_id, now_iso, serialize_doc, success_response
from db import get_db
from security import require_role

router = APIRouter(prefix="/api/admin/pdf-config", tags=["PDF Config"])

_KEY = "pdf_config"

DEFAULT_CONFIG = {
    "company_name":       "KUBUS TEKNOLOGI INDONESIA",
    "company_tagline":    "IT Solutions & Digital Transformation",
    "logo_url":           "",
    "brand_color":        "#5B49C9",
    "accent_color":       "#1D7874",
    "footer_text":        "Dokumen ini bersifat rahasia dan hanya untuk penerima yang dituju",
    "show_empty_domains": False,
    "show_notes":         True,
    "show_scoring":       True,
    "show_cover":         True,
    "show_summary":       True,
    "show_attachments":   True,
}


async def _get_config_from_db(db) -> dict:
    doc = await db.cms_settings.find_one({"key": _KEY})
    if not doc:
        return dict(DEFAULT_CONFIG)
    cfg = dict(DEFAULT_CONFIG)
    cfg.update({k: v for k, v in doc.items() if k not in ("_id", "key", "id", "updated_at")})
    return cfg


@router.get("")
async def get_pdf_config(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    cfg = await _get_config_from_db(db)
    return success_response(cfg)


class PdfConfigIn(BaseModel):
    data: dict


@router.put("")
async def save_pdf_config(payload: PdfConfigIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = now_iso()
    updates = {k: v for k, v in payload.data.items() if k not in ("_id", "key")}
    updates["updated_at"] = now
    existing = await db.cms_settings.find_one({"key": _KEY})
    if existing:
        await db.cms_settings.update_one({"key": _KEY}, {"$set": updates})
    else:
        await db.cms_settings.insert_one(
            {"id": new_id(), "key": _KEY, "created_at": now,
             "created_by": user["id"], **updates}
        )
    cfg = await _get_config_from_db(db)
    return success_response(cfg)


@router.get("/preview")
async def preview_pdf(
    session_id: str = Query(None, description="ID sesi untuk preview. Jika kosong, gunakan sesi terbaru."),
    locale: str = Query("id"),
    user=Depends(require_role("admin", "staff")),
):
    """Generate preview PDF menggunakan konfigurasi CMS saat ini."""
    from assessment_pdf import build_pdf
    from assessment_engine import compute_progress, answers_list_to_map, get_all_question_ids
    from core_utils import serialize_doc, serialize_list

    db = get_db()
    pdf_config = await _get_config_from_db(db)

    # Resolve session
    if session_id:
        session_doc = await db.assessment_sessions.find_one({"id": session_id, "voided": {"$ne": True}})
    else:
        # Use most recent session
        session_doc = await db.assessment_sessions.find_one(
            {"voided": {"$ne": True}},
            sort=[("created_at", -1)],
        )

    if not session_doc:
        raise HTTPException(status_code=404, detail={"code": "NO_SESSION", "message": "Tidak ada sesi assessment tersedia untuk preview"})

    session = serialize_doc(session_doc)

    # Template
    tpl_doc = await db.assessment_templates.find_one({"id": session.get("template_id"), "voided": {"$ne": True}})
    if not tpl_doc:
        raise HTTPException(status_code=404, detail={"code": "NO_TEMPLATE", "message": "Template tidak ditemukan"})
    template = serialize_doc(tpl_doc)

    # Answers
    answers_list = serialize_list(
        await db.assessment_answers.find({"session_id": session["id"]}).to_list(2000)
    )
    answers_map = answers_list_to_map(answers_list)
    progress = compute_progress(template, answers_list)

    # Attachments
    att_list = serialize_list(
        await db.assessment_attachments.find({"session_id": session["id"]}).to_list(500)
    )
    attachments_by_q: dict = {}
    for att in att_list:
        attachments_by_q.setdefault(att["question_id"], []).append(att)

    pdf_bytes = build_pdf(
        session, template, answers_map, progress,
        attachments_by_question=attachments_by_q,
        locale=locale,
        pdf_config=pdf_config,
    )

    sid_short = session["id"][:8]
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=preview_{sid_short}.pdf",
            "X-Session-Id": session["id"],
            "X-Session-Client": session.get("client_name", ""),
        },
    )
