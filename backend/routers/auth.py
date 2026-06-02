import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core_utils import now_iso, public_user, success_response
from db import get_db
from security import create_token, decode_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=200)


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=10)


def _tokens_for(user: dict) -> dict:
    return {
        "access_token": create_token(user["id"], user["role"], "access"),
        "refresh_token": create_token(user["id"], user["role"], "refresh"),
        "token_type": "bearer",
        "user": public_user(user),
    }


@router.post("/login")
async def login(payload: LoginIn):
    email = payload.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": "Email tidak valid"})
    db = get_db()
    user = await db.system_users.find_one({"email": email, "voided": {"$ne": True}})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail={"code": "AUTH_INVALID_CREDENTIALS", "message": "Email atau kata sandi salah"})
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail={"code": "AUTH_ACCOUNT_DISABLED", "message": "Akun dinonaktifkan"})
    await db.system_users.update_one({"id": user["id"]}, {"$set": {"last_login_at": now_iso()}})
    return success_response(_tokens_for(user))


@router.post("/refresh")
async def refresh(payload: RefreshIn):
    data = decode_token(payload.refresh_token, "refresh")
    db = get_db()
    user = await db.system_users.find_one({"id": data.get("sub"), "voided": {"$ne": True}})
    if not user or user.get("status") != "active":
        raise HTTPException(status_code=401, detail={"code": "AUTH_INVALID_USER", "message": "Akun tidak ditemukan atau nonaktif"})
    return success_response({
        "access_token": create_token(user["id"], user["role"], "access"),
        "token_type": "bearer",
    })


@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    # Stateless JWT: client drops tokens. Endpoint exists for symmetry/audit.
    return success_response({"message": "Logged out"})


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return success_response(user)
