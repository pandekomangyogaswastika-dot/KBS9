"""Notification dispatchers used by routers (Phase 12).

This module centralises *recipient discovery* + payload construction for
event-driven emails so that individual routers (leads, projects, billing)
stay focused on business logic.

All functions are best-effort (fire-and-forget). Failures are logged only
and never break the calling request.
"""
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from db import get_db
from email_service import notify_async


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _admin_staff_emails(db) -> List[Dict[str, str]]:
    cursor = db.system_users.find(
        {"role": {"$in": ["admin", "staff"]}, "status": "active", "voided": {"$ne": True}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1},
    )
    return await cursor.to_list(200)


async def _user_by_id(db, user_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not user_id:
        return None
    return await db.system_users.find_one(
        {"id": user_id, "voided": {"$ne": True}}, {"_id": 0}
    )


def _safe_iter(items: Optional[Iterable[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    return list(items or [])


# ---------------------------------------------------------------------------
# Public notification functions
# ---------------------------------------------------------------------------


async def notify_lead_created(lead: Dict[str, Any]) -> None:
    db = get_db()
    recipients = await _admin_staff_emails(db)
    variables = {
        "name": lead.get("name", ""),
        "email": lead.get("email", ""),
        "company": lead.get("company") or "—",
        "phone": lead.get("phone") or "—",
        "message": (lead.get("message") or "")[:1000],
    }
    metadata = {"event": "lead_created", "lead_id": lead.get("id")}
    for r in recipients:
        if not r.get("email"):
            continue
        notify_async(
            r["email"],
            "lead_created",
            {**variables, "recipient_name": r.get("name", "Admin")},
            locale="id",
            metadata=metadata,
        )


async def notify_project_created(project: Dict[str, Any]) -> None:
    db = get_db()
    targets: List[Dict[str, Any]] = []
    client = await _user_by_id(db, project.get("client_id"))
    if client:
        targets.append(client)
    for sid in _safe_iter(project.get("staff_ids")):
        u = await _user_by_id(db, sid)
        if u:
            targets.append(u)
    base_vars = {
        "project_name": project.get("name", ""),
        "project_code": project.get("code", ""),
        "status": project.get("status", "active"),
        "project_id": project.get("id", ""),
    }
    metadata = {"event": "project_created", "project_id": project.get("id")}
    for t in targets:
        if not t.get("email"):
            continue
        notify_async(
            t["email"],
            "project_created",
            {**base_vars, "recipient_name": t.get("name", "")},
            locale="id",
            metadata=metadata,
        )


async def notify_approval_requested(project: Dict[str, Any], approval: Dict[str, Any], requested_by: Dict[str, Any]) -> None:
    db = get_db()
    recipients = await _admin_staff_emails(db)
    base_vars = {
        "approval_title": approval.get("title") or "Approval Request",
        "project_name": project.get("name", ""),
        "requested_by": requested_by.get("name", "—"),
    }
    metadata = {
        "event": "approval_requested",
        "project_id": project.get("id"),
        "approval_id": approval.get("id"),
    }
    for r in recipients:
        if not r.get("email"):
            continue
        notify_async(
            r["email"],
            "approval_requested",
            {**base_vars, "recipient_name": r.get("name", "Admin")},
            locale="id",
            metadata=metadata,
        )


async def notify_approval_signed(project: Dict[str, Any], approval: Dict[str, Any], signature: Dict[str, Any]) -> None:
    db = get_db()
    # Notify everyone involved: client + admin/staff in project staff_ids
    targets: List[Dict[str, Any]] = []
    client = await _user_by_id(db, project.get("client_id"))
    if client:
        targets.append(client)
    for sid in _safe_iter(project.get("staff_ids")):
        u = await _user_by_id(db, sid)
        if u:
            targets.append(u)
    admins = await db.system_users.find(
        {"role": "admin", "status": "active", "voided": {"$ne": True}}, {"_id": 0}
    ).to_list(50)
    targets.extend(admins)
    # Dedupe by id
    seen = set()
    deduped: List[Dict[str, Any]] = []
    for t in targets:
        if t.get("id") and t["id"] not in seen:
            seen.add(t["id"])
            deduped.append(t)

    base_vars = {
        "signer_name": signature.get("signer_name", "—"),
        "approval_title": approval.get("title", "—"),
        "project_name": project.get("name", ""),
        "certificate_no": signature.get("certificate_no", "—"),
    }
    metadata = {
        "event": "approval_signed",
        "project_id": project.get("id"),
        "approval_id": approval.get("id"),
        "signature_id": signature.get("id"),
    }
    for t in deduped:
        if not t.get("email"):
            continue
        # Don't notify the signer themselves
        if t.get("id") == signature.get("signer_id"):
            continue
        notify_async(
            t["email"],
            "approval_signed",
            {**base_vars, "recipient_name": t.get("name", "")},
            locale="id",
            metadata=metadata,
        )


async def notify_invoice_created(invoice: Dict[str, Any]) -> None:
    db = get_db()
    client = await _user_by_id(db, invoice.get("client_id"))
    if not client or not client.get("email"):
        return
    base_vars = {
        "recipient_name": client.get("name", ""),
        "invoice_number": invoice.get("number", invoice.get("id", "")),
        "currency": invoice.get("currency", "IDR"),
        "amount": f"{invoice.get('amount', 0):,.0f}",
        "due_at": invoice.get("due_at") or "—",
    }
    metadata = {"event": "invoice_created", "invoice_id": invoice.get("id")}
    notify_async(client["email"], "invoice_created", base_vars, locale="id", metadata=metadata)


async def notify_invoice_overdue(invoice: Dict[str, Any]) -> None:
    db = get_db()
    client = await _user_by_id(db, invoice.get("client_id"))
    if not client or not client.get("email"):
        return
    base_vars = {
        "recipient_name": client.get("name", ""),
        "invoice_number": invoice.get("number", invoice.get("id", "")),
        "currency": invoice.get("currency", "IDR"),
        "amount": f"{invoice.get('amount', 0):,.0f}",
        "due_at": invoice.get("due_at") or "—",
    }
    metadata = {"event": "invoice_overdue", "invoice_id": invoice.get("id")}
    notify_async(client["email"], "invoice_overdue", base_vars, locale="id", metadata=metadata)
