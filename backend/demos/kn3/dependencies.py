"""Demo dependencies untuk KN3 — bypass auth, selalu kembalikan virtual admin."""
from typing import Any, Dict, List
from fastapi import HTTPException, Request
from demos.kn3.core_utils import now_iso, new_id, safe_doc
from demos.kn3.db import db

# Virtual admin user yang digunakan oleh semua demo requests
DEMO_ADMIN_USER = {
    "id": "demo_admin_01",
    "name": "Admin Demo",
    "email": "admin@demo.wms",
    "role": "admin",
    "status": "active",
}


async def current_user(request: Request) -> Dict[str, Any]:
    """Demo: selalu kembalikan virtual admin user."""
    return DEMO_ADMIN_USER


async def require_role(request: Request, allowed_roles: List[str]) -> Dict[str, Any]:
    """Demo: bypass role check, selalu return admin."""
    return DEMO_ADMIN_USER


async def require_permission(request: Request, module: str, action: str) -> Dict[str, Any]:
    """Demo: bypass permission check, selalu return admin."""
    return DEMO_ADMIN_USER


async def permission_matrix() -> Dict[str, Dict[str, List[str]]]:
    """Demo: semua permissions terbuka."""
    actions = ["view", "create", "update", "delete", "approve", "confirm", "scan", "export"]
    modules = ["product", "order", "wms", "customer", "report", "admin", "invoice", "purchase"]
    return {"admin": {m: actions for m in modules}}


async def audit(
    actor: str, action: str, entity_type: str, entity_id: str,
    after: Any, reason: str = ""
) -> None:
    """Demo: catat audit ke demo DB session."""
    try:
        clean_after = safe_doc(after) if after is not None else None
        await db.audit_logs.insert_one({
            "id": new_id("audit"),
            "actor": actor,
            "role": "admin/demo",
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "before": None,
            "after": clean_after,
            "reason": reason,
            "timestamp": now_iso(),
        })
    except Exception:
        pass  # Audit failure tidak boleh break demo flow
