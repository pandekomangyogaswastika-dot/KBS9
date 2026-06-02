"""Billing / Invoices router (KTI Phase 5/6)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import get_current_user, require_role
from notifications import notify_invoice_created, notify_invoice_overdue
import notification_service as inapp

router = APIRouter(prefix="/api")


class InvoiceItemIn(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float


class InvoiceIn(BaseModel):
    project_id: Optional[str] = None
    client_id: str
    items: List[InvoiceItemIn] = []
    currency: Optional[str] = "IDR"
    status: Optional[str] = "unpaid"  # unpaid | paid | overdue
    issued_at: Optional[str] = None
    due_at: Optional[str] = None
    notes: Optional[str] = ""


class InvoicePatch(BaseModel):
    status: Optional[str] = None
    items: Optional[List[InvoiceItemIn]] = None
    due_at: Optional[str] = None
    paid_at: Optional[str] = None
    notes: Optional[str] = None


def _calc_amount(items):
    return sum(i.get("quantity", 1) * i.get("unit_price", 0) for i in items)


def _scoped_filter(user):
    filt = {"voided": {"$ne": True}}
    if user["role"] == "client":
        filt["client_id"] = user["id"]
    return filt


@router.get("/invoices")
async def list_invoices(user=Depends(get_current_user)):
    db = get_db()
    filt = _scoped_filter(user)
    docs = await db.billing_invoices.find(filt).sort("created_at", -1).to_list(200)
    result = []
    for d in docs:
        d = serialize_doc(d)
        if d.get("client_id"):
            cu = await db.system_users.find_one({"id": d["client_id"]}, {"_id": 0, "name": 1})
            d["client_name"] = cu["name"] if cu else "—"
        result.append(d)
    return success_response(result)


@router.post("/invoices")
async def create_invoice(payload: InvoiceIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    count = await db.billing_invoices.count_documents({})
    now = now_iso()
    items_list = [i.model_dump() for i in payload.items]
    doc = {
        "id": new_id(),
        "number": f"INV-{count + 1:04d}",
        "project_id": payload.project_id,
        "client_id": payload.client_id,
        "items": items_list,
        "amount": _calc_amount(items_list),
        "currency": payload.currency,
        "status": payload.status,
        "notes": payload.notes,
        "issued_at": payload.issued_at or now,
        "due_at": payload.due_at,
        "paid_at": None,
        "created_at": now, "updated_at": now, "created_by": user["id"], "voided": False,
    }
    await db.billing_invoices.insert_one(doc)
    try:
        await notify_invoice_created(doc)
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    # Phase 15: in-app notif to the invoice client
    try:
        if doc.get("client_id"):
            await inapp.create(
                doc["client_id"],
                "invoice.created",
                title=f"Invoice baru: {doc.get('number', doc.get('id'))}",
                body=f"{doc.get('currency', 'IDR')} {doc.get('amount', 0):,.0f} · jatuh tempo {doc.get('due_at', '—')}",
                link="/portal/invoices",
                actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
                metadata={"invoice_id": doc["id"], "amount": doc.get("amount"), "currency": doc.get("currency")},
            )
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(doc))


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, user=Depends(get_current_user)):
    db = get_db()
    filt = {"id": invoice_id, "voided": {"$ne": True}}
    if user["role"] == "client":
        filt["client_id"] = user["id"]
    doc = await db.billing_invoices.find_one(filt)
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Invoice tidak ditemukan"})
    d = serialize_doc(doc)
    if d.get("client_id"):
        cu = await db.system_users.find_one({"id": d["client_id"]}, {"_id": 0, "name": 1, "email": 1})
        d["client_name"] = cu["name"] if cu else "—"
        d["client_email"] = cu["email"] if cu else ""
    return success_response(d)


@router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, payload: InvoicePatch, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if payload.items is not None:
        items_list = [i.model_dump() for i in payload.items]
        updates["items"] = items_list
        updates["amount"] = _calc_amount(items_list)
    if payload.status == "paid" and not payload.paid_at:
        updates["paid_at"] = now_iso()
    updates["updated_at"] = now_iso()
    await db.billing_invoices.update_one({"id": invoice_id}, {"$set": updates})
    updated = await db.billing_invoices.find_one({"id": invoice_id}, {"_id": 0})
    # Phase 12: trigger overdue notification when status transitions to overdue
    if payload.status == "overdue":
        try:
            await notify_invoice_overdue(updated)
        except Exception as exc:  # noqa: BLE001
            pass  # Notification failure should not block operation
    # Phase 15: in-app notification on any status change to client
    try:
        if payload.status and updated and updated.get("client_id"):
            event_type = "invoice.overdue" if payload.status == "overdue" else "invoice.status_changed"
            await inapp.create(
                updated["client_id"],
                event_type,
                title=f"Status invoice {updated.get('number', updated.get('id'))}: {payload.status}",
                body=f"{updated.get('currency', 'IDR')} {updated.get('amount', 0):,.0f}",
                link="/portal/invoices",
                actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
                metadata={"invoice_id": invoice_id, "status": payload.status},
            )
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(updated))
