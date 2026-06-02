import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from core_utils import new_id, now_iso, success_response
from db import get_db
from notifications import notify_lead_created
import notification_service as inapp

router = APIRouter(prefix="/api")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=160)
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    message: str = Field(min_length=1, max_length=4000)
    source: str = Field(default="contact_form", max_length=60)


@router.post("/leads", status_code=201)
async def create_lead(payload: LeadIn):
    if not _EMAIL_RE.match(payload.email.strip()):
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Email tidak valid"})
    db = get_db()
    now = now_iso()
    doc = {
        "id": new_id(), "created_at": now, "updated_at": now, "created_by": None,
        "voided": False, "status": "new",
        "name": payload.name.strip(), "email": payload.email.strip(), "company": payload.company,
        "phone": payload.phone, "message": payload.message.strip(), "source": payload.source,
        "assessment_session_id": None,
    }
    await db.crm_leads.insert_one(doc)
    # Phase 12: notify admin/staff (best-effort, fire-and-forget)
    try:
        await notify_lead_created(doc)
    except Exception as exc:  # noqa: BLE001
        pass  # notify_lead_created failed silently
    # Phase 15: in-app realtime notification to admin/staff
    try:
        await inapp.create_for_admin_staff(
            "lead.created",
            title=f"Lead baru: {doc.get('name', '—')}",
            body=(doc.get("message") or "")[:160],
            link="/portal/admin/leads",
            metadata={"lead_id": doc["id"], "email": doc.get("email"), "company": doc.get("company")},
        )
    except Exception as exc:  # noqa: BLE001
        pass  # inapp lead.created failed silently
    return success_response({"id": doc["id"], "message": "Lead received"})
