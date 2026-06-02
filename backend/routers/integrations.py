"""
Admin Integrations Settings (Phase 12) — multi-integration framework.

Resources managed via this router:
  - Email integration (provider: mock/smtp/resend/sendgrid)
  - Payment Gateway integration (placeholder: mock/midtrans/xendit)
  - Object Storage integration (placeholder: local/s3/r2)

All credentials live in `integration_settings` collection (1 doc per `type`).
Responses MASK any sensitive field (api_key, secret_key, smtp_password, etc).

Additional endpoints:
  - Email templates CRUD
  - Email outbox viewer
  - Send test email

RBAC:
  - configuration GET/PUT: admin only
  - outbox/templates view: admin/staff
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import require_role
from email_service import load_email_settings, send_raw_email

router = APIRouter(prefix="/api/admin")


# ---------------------------------------------------------------------------
# Constants & helpers
# ---------------------------------------------------------------------------

SUPPORTED_TYPES = {"email", "payment", "storage"}

SENSITIVE_KEYS = {
    "smtp_password",
    "api_key",
    "secret_key",
    "private_key",
    "webhook_secret",
    "server_key",
    "client_secret",
    "access_key_secret",
}

DEFAULTS: Dict[str, Dict[str, Any]] = {
    "email": {
        "type": "email",
        "enabled": True,
        "provider": "mock",
        "from_email": "no-reply@kubus.id",
        "from_name": "Kubus Teknologi",
        "config": {"enabled": True},
    },
    "payment": {
        "type": "payment",
        "enabled": False,
        "provider": "mock",  # mock | midtrans | xendit
        "config": {"environment": "sandbox"},
    },
    "storage": {
        "type": "storage",
        "enabled": True,
        "provider": "local",  # local | s3 | r2
        "config": {"bucket": "kti-local"},
    },
}


def _mask_secrets(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of `doc` with sensitive fields replaced by `********`."""
    if not doc:
        return doc
    out = dict(doc)
    cfg = dict(out.get("config") or {})
    for k, v in list(cfg.items()):
        if k in SENSITIVE_KEYS and v:
            cfg[k] = "********"
    out["config"] = cfg
    return out


def _merge_secrets(incoming_config: Dict[str, Any], existing_config: Dict[str, Any]) -> Dict[str, Any]:
    """If incoming config sends `********` for a sensitive field, keep the existing value.
    Allows safe re-save of forms without exposing real secrets.
    """
    merged = dict(existing_config or {})
    for k, v in (incoming_config or {}).items():
        if k in SENSITIVE_KEYS and v == "********":
            continue  # keep existing
        merged[k] = v
    # If a sensitive field is explicitly removed (None or empty string), clear it
    return merged


async def _get_or_default(db, type_: str) -> Dict[str, Any]:
    doc = await db.integration_settings.find_one({"type": type_}, {"_id": 0})
    if doc:
        return doc
    return DEFAULTS.get(type_, {"type": type_, "enabled": False, "provider": "mock", "config": {}}).copy()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class IntegrationUpdate(BaseModel):
    enabled: Optional[bool] = None
    provider: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class TestEmailIn(BaseModel):
    to: EmailStr
    subject: Optional[str] = "Test Email dari Kubus Teknologi"
    body: Optional[str] = "Ini adalah test email dari admin panel Kubus."


class EmailTemplateUpsert(BaseModel):
    subject: str = Field(min_length=1, max_length=300)
    html_body: str
    text_body: Optional[str] = ""
    variables: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Generic integrations endpoints
# ---------------------------------------------------------------------------


@router.get("/integrations")
async def list_integrations(_user=Depends(require_role("admin"))):
    """Return all integration configurations (with secrets masked)."""
    db = get_db()
    items = []
    for type_ in ("email", "payment", "storage"):
        doc = await _get_or_default(db, type_)
        items.append(_mask_secrets(serialize_doc(dict(doc))))
    return success_response(items)


@router.get("/integrations/{type_}")
async def get_integration(type_: str, _user=Depends(require_role("admin"))):
    if type_ not in SUPPORTED_TYPES:
        raise HTTPException(status_code=404, detail={"code": "UNKNOWN_TYPE", "message": "Tipe integrasi tidak dikenal"})
    db = get_db()
    doc = await _get_or_default(db, type_)
    return success_response(_mask_secrets(serialize_doc(dict(doc))))


@router.put("/integrations/{type_}")
async def update_integration(
    type_: str,
    payload: IntegrationUpdate = Body(...),
    user=Depends(require_role("admin")),
):
    if type_ not in SUPPORTED_TYPES:
        raise HTTPException(status_code=404, detail={"code": "UNKNOWN_TYPE", "message": "Tipe integrasi tidak dikenal"})

    db = get_db()
    existing = await db.integration_settings.find_one({"type": type_}) or DEFAULTS.get(type_, {}).copy()
    existing_config = existing.get("config") or {}

    update_dict: Dict[str, Any] = {"type": type_, "updated_at": now_iso(), "updated_by": user.get("id")}
    if payload.enabled is not None:
        update_dict["enabled"] = payload.enabled
    if payload.provider is not None:
        update_dict["provider"] = payload.provider
    if payload.from_email is not None:
        update_dict["from_email"] = payload.from_email
    if payload.from_name is not None:
        update_dict["from_name"] = payload.from_name
    if payload.config is not None:
        update_dict["config"] = _merge_secrets(payload.config, existing_config)

    await db.integration_settings.update_one({"type": type_}, {"$set": update_dict}, upsert=True)
    fresh = await db.integration_settings.find_one({"type": type_}, {"_id": 0})
    return success_response(_mask_secrets(serialize_doc(dict(fresh))))


# ---------------------------------------------------------------------------
# Email-specific endpoints
# ---------------------------------------------------------------------------


@router.post("/integrations/email/test")
async def send_test_email_endpoint(
    payload: TestEmailIn = Body(...),
    user=Depends(require_role("admin")),
):
    """Send a real test email using current provider configuration."""
    html = (
        f"<div style='font-family:Inter,system-ui,sans-serif;line-height:1.5'>"
        f"<p>{payload.body}</p>"
        f"<hr/><small style='color:#888'>Dikirim oleh: {user.get('name')} ({user.get('email')})</small>"
        f"</div>"
    )
    result = await send_raw_email(
        to=payload.to,
        subject=payload.subject,
        html_body=html,
        text_body=payload.body,
        template_id="admin_test_email",
        metadata={"triggered_by": user.get("id")},
    )
    if not result.get("success"):
        return success_response({"sent": False, "result": result})
    return success_response({"sent": True, "result": result})


@router.get("/integrations/email/outbox")
async def email_outbox(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    status: Optional[str] = None,
    template_id: Optional[str] = None,
    _user=Depends(require_role("admin", "staff")),
):
    """List recent emails (mock or real) with optional filters."""
    db = get_db()
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if template_id:
        query["template_id"] = template_id

    cursor = db.email_outbox.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    total = await db.email_outbox.count_documents(query)
    return success_response(
        {
            "items": serialize_list(items),
            "total": total,
            "limit": limit,
            "skip": skip,
        }
    )


@router.get("/integrations/email/outbox/{outbox_id}")
async def email_outbox_detail(
    outbox_id: str,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    doc = await db.email_outbox.find_one({"id": outbox_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Email tidak ditemukan"})
    events = await db.email_events.find({"outbox_id": outbox_id}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    return success_response({"email": serialize_doc(doc), "events": serialize_list(events)})


@router.get("/integrations/email/templates")
async def list_email_templates(
    locale: Optional[str] = None,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    query: Dict[str, Any] = {}
    if locale:
        query["locale"] = locale
    items = await db.email_templates.find(query, {"_id": 0}).sort("template_id", 1).to_list(500)
    return success_response(serialize_list(items))


@router.get("/integrations/email/templates/{template_id}/{locale}")
async def get_email_template(
    template_id: str,
    locale: str,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    doc = await db.email_templates.find_one({"template_id": template_id, "locale": locale}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Template tidak ditemukan"})
    return success_response(serialize_doc(doc))


@router.put("/integrations/email/templates/{template_id}/{locale}")
async def upsert_email_template(
    template_id: str,
    locale: str,
    payload: EmailTemplateUpsert = Body(...),
    user=Depends(require_role("admin")),
):
    if locale not in ("id", "en"):
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Locale harus 'id' atau 'en'"})
    db = get_db()
    update = {
        "template_id": template_id,
        "locale": locale,
        "subject": payload.subject,
        "html_body": payload.html_body,
        "text_body": payload.text_body or "",
        "variables": payload.variables or [],
        "updated_at": now_iso(),
        "updated_by": user.get("id"),
    }
    existing = await db.email_templates.find_one({"template_id": template_id, "locale": locale}, {"_id": 0, "id": 1, "created_at": 1})
    if not existing:
        update["id"] = new_id()
        update["created_at"] = now_iso()
    await db.email_templates.update_one(
        {"template_id": template_id, "locale": locale},
        {"$set": update},
        upsert=True,
    )
    fresh = await db.email_templates.find_one({"template_id": template_id, "locale": locale}, {"_id": 0})
    return success_response(serialize_doc(dict(fresh)))


# ---------------------------------------------------------------------------
# Helper exposed for diagnostics
# ---------------------------------------------------------------------------


@router.get("/integrations/email/active-provider")
async def active_email_provider(_user=Depends(require_role("admin", "staff"))):
    settings = await load_email_settings()
    return success_response(_mask_secrets(serialize_doc(dict(settings))))
