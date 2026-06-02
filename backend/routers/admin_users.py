import re

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core_utils import new_id, now_iso, paginate_response, public_user, success_response
from db import get_db
from security import hash_password, require_role

router = APIRouter(prefix="/api/admin/users")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_ROLES = {"admin", "staff", "client"}


class UserIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=6, max_length=200)
    role: str = Field(default="client")
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)


class UserPatch(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    role: str | None = None
    status: str | None = None
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)


class ResetPasswordIn(BaseModel):
    password: str = Field(min_length=6, max_length=200)


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: str | None = None,
    search: str | None = None,
    _admin=Depends(require_role("admin")),
):
    db = get_db()
    flt = {"voided": {"$ne": True}}
    if role in _ROLES:
        flt["role"] = role
    if search:
        flt["$or"] = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"email": {"$regex": re.escape(search), "$options": "i"}},
        ]
    total = await db.system_users.count_documents(flt)
    cursor = db.system_users.find(flt).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    docs = [public_user(d) for d in await cursor.to_list(limit)]
    return paginate_response(docs, total, page, limit)


@router.post("", status_code=201)
async def create_user(payload: UserIn, admin=Depends(require_role("admin"))):
    email = payload.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Email tidak valid"})
    if payload.role not in _ROLES:
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Role tidak valid"})
    db = get_db()
    if await db.system_users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail={"code": "DUPLICATE_EMAIL", "message": "Email sudah terdaftar"})
    now = now_iso()
    doc = {
        "id": new_id(), "created_at": now, "updated_at": now, "created_by": admin["id"],
        "voided": False, "voided_at": None,
        "email": email, "name": payload.name.strip(), "role": payload.role,
        "password_hash": hash_password(payload.password), "status": "active",
        "company": payload.company, "phone": payload.phone, "locale": "id", "last_login_at": None,
    }
    await db.system_users.insert_one(doc)
    return success_response(public_user(doc))


@router.patch("/{user_id}")
async def update_user(user_id: str, payload: UserPatch, admin=Depends(require_role("admin"))):
    db = get_db()
    user = await db.system_users.find_one({"id": user_id, "voided": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "User tidak ditemukan"})
    updates = {}
    if payload.name is not None:
        updates["name"] = payload.name.strip()
    if payload.role is not None:
        if payload.role not in _ROLES:
            raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Role tidak valid"})
        updates["role"] = payload.role
    if payload.status is not None:
        if payload.status not in {"active", "disabled"}:
            raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Status tidak valid"})
        if user["id"] == admin["id"] and payload.status != "active":
            raise HTTPException(status_code=400, detail={"code": "SELF_DISABLE_FORBIDDEN", "message": "Tidak bisa menonaktifkan akun sendiri"})
        updates["status"] = payload.status
    if payload.company is not None:
        updates["company"] = payload.company
    if payload.phone is not None:
        updates["phone"] = payload.phone
    if updates:
        updates["updated_at"] = now_iso()
        await db.system_users.update_one({"id": user_id}, {"$set": updates})
    fresh = await db.system_users.find_one({"id": user_id})
    return success_response(public_user(fresh))


@router.post("/{user_id}/reset-password")
async def reset_password(user_id: str, payload: ResetPasswordIn, _admin=Depends(require_role("admin"))):
    db = get_db()
    user = await db.system_users.find_one({"id": user_id, "voided": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "User tidak ditemukan"})
    await db.system_users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": hash_password(payload.password), "updated_at": now_iso()}},
    )
    return success_response({"message": "Password diperbarui"})


@router.delete("/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_role("admin"))):
    db = get_db()
    user = await db.system_users.find_one({"id": user_id, "voided": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "User tidak ditemukan"})
    if user["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail={"code": "SELF_DELETE_FORBIDDEN", "message": "Tidak bisa menghapus akun sendiri"})
    await db.system_users.update_one({"id": user_id}, {"$set": {"voided": True, "voided_at": now_iso(), "updated_at": now_iso()}})
    return success_response({"message": "User dihapus"})
