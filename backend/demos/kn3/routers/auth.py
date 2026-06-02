"""Demo Auth router — bypass login, return virtual admin user."""
from typing import Any, Dict
from fastapi import APIRouter, Request
from demos.kn3.dependencies import DEMO_ADMIN_USER
from demos.kn3.core_utils import now_iso

router = APIRouter(prefix="/api/demo/kn3")


@router.post("/auth/login")
async def login(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Demo login: selalu berhasil, return virtual admin."""
    return {
        "token": "demo-token",
        "user": DEMO_ADMIN_USER,
        "onboarding": None,
    }


@router.get("/auth/me")
async def me(request: Request) -> Dict[str, Any]:
    """Demo me: selalu return virtual admin."""
    return DEMO_ADMIN_USER


@router.post("/auth/logout")
async def logout() -> Dict[str, str]:
    return {"message": "Sesi demo berakhir."}
