"""
Phase 19D: Pricing Packages
CRUD endpoints for service packages/pricing tiers (admin-only write, public read).

Response contract:
  - All endpoints return {"success": true, "data": ...} (consistent with apiClient.useFetch).
"""
# NOTE: Admin-write operations on this resource are handled by the generic
# /api/admin/cms/{resource} endpoint (routers/cms.py). The CRUD endpoints below
# remain valid for direct API / external client access.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from db import get_db
from core_utils import success_response, serialize_doc
from security import require_role

router = APIRouter(prefix="/api/packages", tags=["Content"])


class BilingualField(BaseModel):
    id: str
    en: str


class PackageCreate(BaseModel):
    name: BilingualField
    tier: str = Field(..., pattern=r'^(starter|professional|enterprise)$')
    services_included: List[str] = []
    price_from: Optional[int] = None  # in IDR
    duration: Optional[str] = None  # e.g., "per month", "per project"
    features: List[BilingualField] = []
    popular: bool = False
    cta_label: Optional[BilingualField] = None
    order: int = 0
    status: str = "published"


class PackageUpdate(BaseModel):
    name: Optional[BilingualField] = None
    tier: Optional[str] = None
    services_included: Optional[List[str]] = None
    price_from: Optional[int] = None
    duration: Optional[str] = None
    features: Optional[List[BilingualField]] = None
    popular: Optional[bool] = None
    cta_label: Optional[BilingualField] = None
    order: Optional[int] = None
    status: Optional[str] = None


def _shape(doc: dict) -> dict:
    if not doc:
        return doc
    d = serialize_doc(dict(doc))
    d.setdefault("services_included", [])
    d.setdefault("features", [])
    d.setdefault("price_from", None)
    d.setdefault("duration", None)
    d.setdefault("popular", False)
    d.setdefault("cta_label", None)
    d.setdefault("order", 0)
    d.setdefault("status", "published")
    d.setdefault("updated_at", None)
    return d


@router.get("")
async def get_packages(db=Depends(get_db)):
    """Get all packages (public endpoint)."""
    cursor = db.cms_packages.find({"status": "published"}).sort("order", 1)
    items = await cursor.to_list(length=50)
    return success_response([_shape(p) for p in items])


@router.get("/{package_id}")
async def get_package(package_id: str, db=Depends(get_db)):
    """Get single package by ID."""
    doc = await db.cms_packages.find_one({"id": package_id})
    if not doc:
        raise HTTPException(404, "Package not found")
    return success_response(_shape(doc))


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_package(
    payload: PackageCreate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Create new package (admin only)."""
    doc = {
        "id": str(uuid.uuid4()),
        **payload.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
    }
    await db.cms_packages.insert_one(doc)
    return success_response(_shape(doc))


@router.patch("/{package_id}", dependencies=[Depends(require_role("admin"))])
async def update_package(
    package_id: str,
    payload: PackageUpdate,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Update package (admin only)."""
    existing = await db.cms_packages.find_one({"id": package_id})
    if not existing:
        raise HTTPException(404, "Package not found")

    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.cms_packages.update_one({"id": package_id}, {"$set": update_data})

    updated_doc = await db.cms_packages.find_one({"id": package_id})
    return success_response(_shape(updated_doc))


@router.delete("/{package_id}", dependencies=[Depends(require_role("admin"))])
async def delete_package(
    package_id: str,
    db=Depends(get_db),
    _user=Depends(require_role("admin")),
):
    """Delete package (admin only)."""
    result = await db.cms_packages.delete_one({"id": package_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Package not found")
    return success_response({"deleted": True})
