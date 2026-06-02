"""
Phase 19C: FAQ
CRUD endpoints for frequently asked questions (admin-only write, public read).

Response contract:
  - All endpoints return {"success": true, "data": ...} (consistent with apiClient.useFetch).
"""
# NOTE: Admin-write operations on this resource are handled by the generic
# /api/admin/cms/{resource} endpoint (routers/cms.py). The CRUD endpoints below
# remain valid for direct API / external client access.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

from db import get_db
from core_utils import success_response, serialize_doc
from security import require_role

router = APIRouter(prefix="/api/faq", tags=["Content"])


class BilingualField(BaseModel):
    id: str
    en: str


class FaqCreate(BaseModel):
    category: str = Field(..., min_length=1)  # general/pricing/technical/process
    question: BilingualField
    answer: BilingualField
    related_service_id: Optional[str] = None
    order: int = 0
    status: str = "published"


class FaqUpdate(BaseModel):
    category: Optional[str] = None
    question: Optional[BilingualField] = None
    answer: Optional[BilingualField] = None
    related_service_id: Optional[str] = None
    order: Optional[int] = None
    status: Optional[str] = None


def _shape(doc: dict) -> dict:
    if not doc:
        return doc
    d = serialize_doc(dict(doc))
    d.setdefault("related_service_id", None)
    d.setdefault("order", 0)
    d.setdefault("status", "published")
    d.setdefault("updated_at", None)
    return d


@router.get("")
async def get_faqs(category: Optional[str] = None, db=Depends(get_db)):
    """Get all FAQs (public endpoint). Filter by category if provided."""
    filter_query = {"status": "published"}
    if category:
        filter_query["category"] = category

    cursor = db.cms_faq.find(filter_query).sort([("category", 1), ("order", 1)])
    items = await cursor.to_list(length=200)
    return success_response([_shape(f) for f in items])


@router.get("/{faq_id}")
async def get_faq(faq_id: str, db=Depends(get_db)):
    """Get single FAQ by ID."""
    doc = await db.cms_faq.find_one({"id": faq_id})
    if not doc:
        raise HTTPException(404, "FAQ not found")
    return success_response(_shape(doc))


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_faq(
    payload: FaqCreate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Create new FAQ (admin only)."""
    doc = {
        "id": str(uuid.uuid4()),
        **payload.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
    }
    await db.cms_faq.insert_one(doc)
    return success_response(_shape(doc))


@router.patch("/{faq_id}", dependencies=[Depends(require_role("admin"))])
async def update_faq(
    faq_id: str,
    payload: FaqUpdate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Update FAQ (admin only)."""
    existing = await db.cms_faq.find_one({"id": faq_id})
    if not existing:
        raise HTTPException(404, "FAQ not found")

    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.cms_faq.update_one({"id": faq_id}, {"$set": update_data})

    updated_doc = await db.cms_faq.find_one({"id": faq_id})
    return success_response(_shape(updated_doc))


@router.delete("/{faq_id}", dependencies=[Depends(require_role("admin"))])
async def delete_faq(
    faq_id: str,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Delete FAQ (admin only)."""
    result = await db.cms_faq.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "FAQ not found")
    return success_response({"deleted": True})
