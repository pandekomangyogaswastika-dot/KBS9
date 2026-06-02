"""
Phase 19B: Legal Pages
CRUD endpoints for privacy policy, terms of service, etc. (admin-only write, public read).

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

router = APIRouter(prefix="/api/legal", tags=["Content"])


class BilingualField(BaseModel):
    id: str
    en: str


class LegalPageCreate(BaseModel):
    slug: str = Field(..., min_length=1, pattern=r'^[a-z0-9-]+$')
    title: BilingualField
    content: BilingualField
    version: str = "1.0"
    status: str = "published"


class LegalPageUpdate(BaseModel):
    title: Optional[BilingualField] = None
    content: Optional[BilingualField] = None
    version: Optional[str] = None
    status: Optional[str] = None


def _shape(doc: dict) -> dict:
    if not doc:
        return doc
    d = serialize_doc(dict(doc))
    d.setdefault("version", "1.0")
    d.setdefault("status", "published")
    d.setdefault("last_updated", d.get("created_at"))
    return d


@router.get("")
async def get_legal_pages(db=Depends(get_db)):
    """Get all legal pages (public endpoint)."""
    cursor = db.cms_legal_pages.find({"status": "published"})
    items = await cursor.to_list(length=50)
    return success_response([_shape(p) for p in items])


@router.get("/{slug}")
async def get_legal_page(slug: str, db=Depends(get_db)):
    """Get legal page by slug (public endpoint)."""
    doc = await db.cms_legal_pages.find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(404, "Legal page not found")
    return success_response(_shape(doc))


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_legal_page(
    payload: LegalPageCreate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Create new legal page (admin only)."""
    existing = await db.cms_legal_pages.find_one({"slug": payload.slug})
    if existing:
        raise HTTPException(400, "Slug already exists")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.dict(),
        "last_updated": now,
        "created_at": now,
    }
    await db.cms_legal_pages.insert_one(doc)
    return success_response(_shape(doc))


@router.patch("/{page_id}", dependencies=[Depends(require_role("admin"))])
async def update_legal_page(
    page_id: str,
    payload: LegalPageUpdate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Update legal page (admin only)."""
    existing = await db.cms_legal_pages.find_one({"id": page_id})
    if not existing:
        raise HTTPException(404, "Legal page not found")

    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["last_updated"] = datetime.now(timezone.utc).isoformat()
        await db.cms_legal_pages.update_one({"id": page_id}, {"$set": update_data})

    updated_doc = await db.cms_legal_pages.find_one({"id": page_id})
    return success_response(_shape(updated_doc))


@router.delete("/{page_id}", dependencies=[Depends(require_role("admin"))])
async def delete_legal_page(
    page_id: str,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Delete legal page (admin only)."""
    result = await db.cms_legal_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Legal page not found")
    return success_response({"deleted": True})
