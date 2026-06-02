"""Auth & RBAC primitives (KTI_03). JWT HS256 + passlib bcrypt.

Stateless access + refresh tokens (no DB session collection).
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from core_utils import public_user
from db import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TTL_HOURS = 8
REFRESH_TTL_DAYS = 7

_bearer = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def _secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail={"code": "AUTH_MISCONFIGURED", "message": "JWT secret tidak dikonfigurasi"})
    return secret


def create_token(sub: str, role: str, token_type: str = "access") -> str:
    now = datetime.now(timezone.utc)
    ttl = timedelta(hours=ACCESS_TTL_HOURS) if token_type == "access" else timedelta(days=REFRESH_TTL_DAYS)
    payload = {"sub": sub, "role": role, "type": token_type, "iat": now, "exp": now + ttl}
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"code": "AUTH_TOKEN_EXPIRED", "message": "Sesi kedaluwarsa, silakan login lagi"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail={"code": "AUTH_INVALID_TOKEN", "message": "Token tidak valid"})
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail={"code": "AUTH_INVALID_TOKEN", "message": "Tipe token salah"})
    return payload


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail={"code": "AUTH_REQUIRED", "message": "Autentikasi diperlukan"})
    payload = decode_token(creds.credentials, "access")
    db = get_db()
    user = await db.system_users.find_one({"id": payload.get("sub"), "voided": {"$ne": True}})
    if not user or user.get("status") != "active":
        raise HTTPException(status_code=401, detail={"code": "AUTH_INVALID_USER", "message": "Akun tidak ditemukan atau nonaktif"})
    return public_user(user)


def require_role(*allowed):
    async def dep(user=Depends(get_current_user)):
        if user["role"] not in allowed:
            raise HTTPException(status_code=403, detail={"code": "AUTH_INSUFFICIENT_PERMISSION", "message": "Anda tidak memiliki akses ke resource ini"})
        return user

    return dep



# Phase 17: HTTP Basic Auth for API documentation
import secrets
from fastapi.security import HTTPBasic
from fastapi import status

_basic = HTTPBasic()


def verify_docs_credentials(username: str, password: str) -> bool:
    """Verify basic auth credentials for API documentation access."""
    correct_username = os.environ.get("DOCS_USERNAME", "admin")
    correct_password = os.environ.get("DOCS_PASSWORD", "kti-docs-2025")
    
    # Use secrets.compare_digest to prevent timing attacks
    username_match = secrets.compare_digest(username.encode("utf8"), correct_username.encode("utf8"))
    password_match = secrets.compare_digest(password.encode("utf8"), correct_password.encode("utf8"))
    
    return username_match and password_match


async def require_docs_auth(credentials: HTTPAuthorizationCredentials = Depends(_basic)) -> bool:
    """Dependency untuk melindungi API documentation endpoints dengan HTTP Basic Auth."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    if not verify_docs_credentials(credentials.username, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return True
