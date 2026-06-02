"""Demo stub for document-templates endpoint."""
from typing import List, Dict, Any
from fastapi import APIRouter, Request
from demos.kn3.dependencies import require_permission

router = APIRouter(prefix="/api/demo/kn3")


@router.get("/document-templates")
async def list_document_templates(request: Request) -> List[Dict[str, Any]]:
    """Return empty list — document templates not needed for demo."""
    return []


@router.get("/admin/audit-logs")
async def list_audit_logs(request: Request) -> List[Dict[str, Any]]:
    """Return empty audit logs for demo."""
    return []


@router.get("/admin/permissions")
async def get_permissions(request: Request) -> Dict[str, Any]:
    """Return default permissions for demo."""
    actions = ["view", "create", "update", "delete", "approve"]
    modules = ["product", "order", "wms", "customer", "report", "admin"]
    return {"matrix": {"admin": {m: actions for m in modules}}, "actions": actions}


@router.put("/admin/permissions")
async def update_permissions(request: Request) -> Dict[str, Any]:
    return {"matrix": {}}
