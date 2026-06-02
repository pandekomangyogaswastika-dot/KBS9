"""
Demo Session Router — manajemen sesi demo sandbox dengan isolasi per session
dan governance (rate limiting + global capacity + auto cleanup scheduler).

Endpoints:
  POST   /api/demo/sessions          buat sesi baru + seed data
  GET    /api/demo/sessions/:id       validate sesi (remaining time)
  DELETE /api/demo/sessions/:id       hapus sesi (cleanup)
  GET    /api/demo/sessions           list sesi aktif (admin only)
  GET    /api/demo/capacity           public lightweight capacity probe
  POST   /api/demo/maintenance/cleanup  manual trigger cleanup (admin)
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import asyncio
import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core_utils import now_iso
from demos.kn3.core_utils import safe_doc, new_id
from db import get_client as _get_mongo_client
from demo_seed import seed_all
from security import require_role

router = APIRouter(prefix="/api/demo")
logger = logging.getLogger("demo")

# Main KBS3 database untuk menyimpan session registry
_db = _get_mongo_client()[os.environ.get("DB_NAME", "test_database")]

# --- Governance constants ----------------------------------------------------
DEMO_SESSION_TTL_MINUTES = 90            # Session hidup 90 menit
DEMO_MAX_ACTIVE_GLOBAL = 50              # Cap global active sessions
DEMO_MAX_PER_EMAIL = 1                   # 1 sesi aktif per email
DEMO_CLEANUP_INTERVAL_SECONDS = 5 * 60   # Setiap 5 menit (background loop)
DEMO_GRACE_PERIOD_SECONDS = 60           # Toleransi 1 menit setelah expired sebelum drop DB


class DemoSessionRequest(BaseModel):
    name: str
    email: str
    company: str = ""
    app_slug: str = "kn3"


def _short_id(session_id: str) -> str:
    """Ambil 16 char pertama UUID tanpa dash untuk nama DB."""
    return session_id.replace("-", "")[:16]


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _count_active_sessions() -> int:
    """Hitung sesi aktif (belum expired) untuk capacity check."""
    return await _db.demo_sessions.count_documents(
        {"expires_at": {"$gt": _now_utc_iso()}, "voided": {"$ne": True}}
    )


async def _find_active_session_by_email(email: str) -> Dict[str, Any] | None:
    """Find an active (non-expired) session by email (case-insensitive)."""
    if not email:
        return None
    doc = await _db.demo_sessions.find_one(
        {
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "expires_at": {"$gt": _now_utc_iso()},
            "voided": {"$ne": True},
        },
        {"_id": 0},
    )
    return safe_doc(doc) if doc else None


async def get_active_session(session_id: str) -> Dict[str, Any]:
    """Validate session dan return session doc. Raise 404/410 jika expired/tidak ada."""
    session = safe_doc(
        await _db.demo_sessions.find_one({"id": session_id}, {"_id": 0})
    )
    if not session:
        raise HTTPException(
            status_code=404,
            detail={"code": "SESSION_NOT_FOUND", "message": "Demo session tidak ditemukan"},
        )
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=410,
            detail={"code": "SESSION_EXPIRED", "message": "Demo session sudah expired. Silakan mulai sesi baru."},
        )
    return session


@router.post("/sessions", status_code=201)
async def create_demo_session(payload: DemoSessionRequest) -> Dict[str, Any]:
    """
    Buat demo session baru dengan governance:
    1. Validate global capacity (max DEMO_MAX_ACTIVE_GLOBAL)
    2. Validate per-email cap → re-use existing session bila ada
    3. Simpan gate form data ke crm_leads
    4. Buat session record + seed data ke isolated DB
    """
    email_norm = (payload.email or "").strip()
    if not email_norm:
        raise HTTPException(
            status_code=422,
            detail={"code": "EMAIL_REQUIRED", "message": "Email wajib diisi"},
        )

    # --- 1) Per-email check (re-use existing active session) ---------------
    existing = await _find_active_session_by_email(email_norm)
    if existing:
        expires_at = datetime.fromisoformat(existing["expires_at"])
        remaining = max(0, int((expires_at - datetime.now(timezone.utc)).total_seconds()))
        return {
            "session_id": existing["id"],
            "token": existing["id"],
            "expires_at": existing["expires_at"],
            "ttl_minutes": DEMO_SESSION_TTL_MINUTES,
            "app_slug": existing.get("app_slug", payload.app_slug),
            "demo_url": f"/demo/{existing.get('app_slug', payload.app_slug)}?session={existing['id']}",
            "seed_summary": existing.get("seed_summary", {}),
            "name": existing.get("name", payload.name),
            "reused": True,
            "remaining_seconds": remaining,
        }

    # --- 2) Global capacity check ------------------------------------------
    active_count = await _count_active_sessions()
    if active_count >= DEMO_MAX_ACTIVE_GLOBAL:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "DEMO_CAPACITY_FULL",
                "message": (
                    f"Kapasitas demo sandbox penuh ({DEMO_MAX_ACTIVE_GLOBAL} sesi aktif). "
                    "Coba lagi beberapa menit ke depan."
                ),
                "details": [{"active_count": active_count, "max": DEMO_MAX_ACTIVE_GLOBAL}],
            },
        )

    # --- 3) Create session record + seed -----------------------------------
    session_id = new_id("demo")
    now = now_iso()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=DEMO_SESSION_TTL_MINUTES)
    ).isoformat()
    short_id = _short_id(session_id)

    lead_id = new_id("lead")
    await _db.crm_leads.insert_one(
        {
            "id": lead_id,
            "name": payload.name,
            "email": email_norm,
            "company": payload.company,
            "message": f"Demo request: {payload.app_slug} — via demo gate form",
            "source": "demo_gate",
            "demo_app": payload.app_slug,
            "status": "new",
            "created_at": now,
        }
    )

    session_doc = {
        "id": session_id,
        "short_id": short_id,
        "lead_id": lead_id,
        "name": payload.name,
        "email": email_norm,
        "company": payload.company,
        "app_slug": payload.app_slug,
        "db_name": f"demo_kn3_{short_id}",
        "expires_at": expires_at,
        "created_at": now,
        "seeded": False,
        "voided": False,
    }
    await _db.demo_sessions.insert_one(session_doc)

    # Seed data ke isolated DB
    demo_db = _get_mongo_client()[f"demo_kn3_{short_id}"]
    seed_summary = await seed_all(demo_db)
    await _db.demo_sessions.update_one(
        {"id": session_id},
        {"$set": {"seeded": True, "seed_summary": seed_summary}},
    )

    return {
        "session_id": session_id,
        "token": session_id,
        "expires_at": expires_at,
        "ttl_minutes": DEMO_SESSION_TTL_MINUTES,
        "app_slug": payload.app_slug,
        "demo_url": f"/demo/kn3?session={session_id}",
        "seed_summary": seed_summary,
        "name": payload.name,
        "reused": False,
    }


@router.get("/sessions/{session_id}")
async def get_demo_session(session_id: str) -> Dict[str, Any]:
    """Validate dan return session info (frontend cek expiry)."""
    session = await get_active_session(session_id)
    expires_at = datetime.fromisoformat(session["expires_at"])
    remaining_seconds = (expires_at - datetime.now(timezone.utc)).total_seconds()
    return {
        **session,
        "remaining_minutes": max(0, int(remaining_seconds / 60)),
        "remaining_seconds": max(0, int(remaining_seconds)),
    }


@router.delete("/sessions/{session_id}")
async def delete_demo_session(session_id: str) -> Dict[str, Any]:
    """Hapus session dan drop isolated DB (manual cleanup)."""
    session = safe_doc(
        await _db.demo_sessions.find_one({"id": session_id}, {"_id": 0})
    )
    if session:
        short_id = _short_id(session_id)
        demo_db_name = f"demo_kn3_{short_id}"
        try:
            await _get_mongo_client().drop_database(demo_db_name)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[demo] drop_database failed for %s: %s", demo_db_name, exc)
        await _db.demo_sessions.delete_one({"id": session_id})
    return {"deleted": True, "session_id": session_id}


@router.get("/sessions")
async def list_demo_sessions(_user=Depends(require_role("admin", "staff"))) -> Dict[str, Any]:
    """List semua active sessions (admin/staff)."""
    now = _now_utc_iso()
    sessions = (
        await _db.demo_sessions.find({"expires_at": {"$gt": now}}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return {
        "active_count": len(sessions),
        "max": DEMO_MAX_ACTIVE_GLOBAL,
        "sessions": [safe_doc(s) for s in sessions],
    }


@router.get("/capacity")
async def demo_capacity() -> Dict[str, Any]:
    """Public lightweight probe untuk capacity sandbox."""
    active = await _count_active_sessions()
    return {
        "active": active,
        "max": DEMO_MAX_ACTIVE_GLOBAL,
        "available": max(0, DEMO_MAX_ACTIVE_GLOBAL - active),
        "ttl_minutes": DEMO_SESSION_TTL_MINUTES,
    }


@router.post("/maintenance/cleanup")
async def manual_cleanup(_user=Depends(require_role("admin"))) -> Dict[str, Any]:
    """Trigger cleanup secara manual (admin). Untuk debugging/maintenance."""
    result = await cleanup_expired_sessions()
    return {"cleaned": result}


# ---------------------------------------------------------------------------
# Background cleanup logic
# ---------------------------------------------------------------------------
async def cleanup_expired_sessions() -> Dict[str, Any]:
    """
    Drop databases & remove session docs untuk session yang sudah expired
    melewati grace period. Idempotent dan aman dipanggil concurrently.
    """
    now = datetime.now(timezone.utc)
    threshold = (now - timedelta(seconds=DEMO_GRACE_PERIOD_SECONDS)).isoformat()
    cursor = _db.demo_sessions.find(
        {"expires_at": {"$lte": threshold}}, {"_id": 0}
    )
    cleaned: list[str] = []
    failed: list[str] = []
    async for session in cursor:
        sid = session.get("id")
        if not sid:
            continue
        short_id = _short_id(sid)
        demo_db_name = f"demo_kn3_{short_id}"
        try:
            await _get_mongo_client().drop_database(demo_db_name)
            await _db.demo_sessions.delete_one({"id": sid})
            cleaned.append(sid)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[demo cleanup] failed for %s: %s", sid, exc)
            failed.append(sid)
    return {"count": len(cleaned), "failed": failed, "checked_at": now.isoformat()}


_cleanup_task: asyncio.Task | None = None


async def _cleanup_loop() -> None:
    """Background loop yang menjalankan cleanup setiap interval."""
    logger.info("[demo] cleanup scheduler started, interval=%ss", DEMO_CLEANUP_INTERVAL_SECONDS)
    while True:
        try:
            await cleanup_expired_sessions()
        except Exception as exc:  # noqa: BLE001
            logger.warning("[demo cleanup loop] %s", exc)
        await asyncio.sleep(DEMO_CLEANUP_INTERVAL_SECONDS)


def start_cleanup_scheduler() -> None:
    """Mulai background cleanup task. Idempotent — dipanggil di FastAPI startup."""
    global _cleanup_task
    if _cleanup_task and not _cleanup_task.done():
        return
    try:
        loop = asyncio.get_event_loop()
        _cleanup_task = loop.create_task(_cleanup_loop())
    except RuntimeError:
        # Fallback bila event loop belum running (edge case)
        logger.warning("[demo] start_cleanup_scheduler called without running loop; skipping")


def stop_cleanup_scheduler() -> None:
    """Stop background cleanup task. Dipanggil di shutdown."""
    global _cleanup_task
    if _cleanup_task and not _cleanup_task.done():
        _cleanup_task.cancel()
        _cleanup_task = None
