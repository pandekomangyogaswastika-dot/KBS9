"""Project Management routes — PM module (KTI Phase 5/6).

Scoping:
  admin  → all projects
  staff  → projects where user.id in staff_ids
  client → projects where client_id == user.id
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import get_current_user, require_role
from storage import get_storage
from notifications import notify_approval_requested, notify_approval_signed, notify_project_created
import notification_service as inapp

router = APIRouter(prefix="/api")

# ---- helpers ---------------------------------------------------------------

def _verify_project_access(project: dict, user: dict):
    """Raise 403 if user has no access to this project."""
    if not project:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Proyek tidak ditemukan"})
    role = user["role"]
    uid = user["id"]
    if role == "admin":
        return  # full access
    if role == "staff" and uid in (project.get("staff_ids") or []):
        return
    if role == "client" and project.get("client_id") == uid:
        return
    raise HTTPException(status_code=403, detail={"code": "AUTH_INSUFFICIENT_PERMISSION", "message": "Anda tidak memiliki akses ke proyek ini"})


async def _get_project(project_id: str, user: dict) -> dict:
    db = get_db()
    project = await db.pm_projects.find_one({"id": project_id, "voided": {"$ne": True}})
    _verify_project_access(project, user)
    return project


# ---- Projects ---------------------------------------------------------------

class ProjectIn(BaseModel):
    code: Optional[str] = None
    name: str
    client_id: Optional[str] = None
    staff_ids: Optional[List[str]] = []
    status: Optional[str] = "active"  # active | completed | on_hold | cancelled
    progress: Optional[int] = 0       # 0-100
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    summary: Optional[str] = ""


class ProjectPatch(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    client_id: Optional[str] = None
    staff_ids: Optional[List[str]] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    summary: Optional[str] = None


@router.get("/projects")
async def list_projects(user=Depends(get_current_user)):
    db = get_db()
    filt = {"voided": {"$ne": True}}
    if user["role"] == "client":
        filt["client_id"] = user["id"]
    elif user["role"] == "staff":
        filt["staff_ids"] = user["id"]
    projects = await db.pm_projects.find(filt).sort("created_at", -1).to_list(200)
    # enrich with client name
    result = []
    for p in projects:
        p = serialize_doc(p)
        if p.get("client_id"):
            cu = await db.system_users.find_one({"id": p["client_id"]}, {"_id": 0, "name": 1, "email": 1})
            p["client_name"] = cu["name"] if cu else "—"
            p["client_email"] = cu["email"] if cu else ""
        result.append(p)
    return success_response(result)


@router.post("/projects")
async def create_project(payload: ProjectIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = now_iso()
    doc = {
        "id": new_id(), "created_at": now, "updated_at": now, "created_by": user["id"],
        "voided": False, **payload.model_dump(),
    }
    if not doc.get("code"):
        count = await db.pm_projects.count_documents({})
        doc["code"] = f"KTI-{count + 1:04d}"
    await db.pm_projects.insert_one(doc)
    try:
        await notify_project_created(doc)
    except Exception as exc:  # noqa: BLE001
        pass  # Email notification failure shouldn't block project creation
    # Phase 15: in-app notif to client + assigned staff
    try:
        recipients = list({*(doc.get("staff_ids") or []), doc.get("client_id")})
        await inapp.create_for_users(
            recipients,
            "project.created",
            title=f"Proyek baru: {doc.get('name', '—')}",
            body=f"Kode {doc.get('code', '')} · status {doc.get('status', 'active')}",
            link=f"/portal/projects/{doc['id']}",
            actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
            metadata={"project_id": doc["id"], "code": doc.get("code")},
        )
        # Live update: notify project list watchers
        await inapp.broadcast_topic("projects", "project.created", {"id": doc["id"], "name": doc["name"]})
    except Exception as exc:  # noqa: BLE001
        pass  # In-app notification failure shouldn't block project creation
    return success_response(serialize_doc(doc))


@router.get("/projects/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user)):
    project = await _get_project(project_id, user)
    p = serialize_doc(project)
    db = get_db()
    if p.get("client_id"):
        cu = await db.system_users.find_one({"id": p["client_id"]}, {"_id": 0, "name": 1, "email": 1})
        p["client_name"] = cu["name"] if cu else "—"
    # enrich staff names
    staff_details = []
    for sid in (p.get("staff_ids") or []):
        su = await db.system_users.find_one({"id": sid}, {"_id": 0, "name": 1, "email": 1})
        if su:
            staff_details.append({"id": sid, "name": su["name"], "email": su["email"]})
    p["staff_details"] = staff_details
    return success_response(p)


@router.patch("/projects/{project_id}")
async def update_project(project_id: str, payload: ProjectPatch, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    project = await db.pm_projects.find_one({"id": project_id, "voided": {"$ne": True}})
    if not project:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Proyek tidak ditemukan"})
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    old_status = project.get("status")
    new_status = updates.get("status")
    old_staff = set(project.get("staff_ids") or [])
    new_staff = set(updates.get("staff_ids") or []) if "staff_ids" in updates else old_staff
    updates["updated_at"] = now_iso()
    await db.pm_projects.update_one({"id": project_id}, {"$set": updates})
    updated = await db.pm_projects.find_one({"id": project_id}, {"_id": 0})
    # Phase 15: status change notification + live update
    try:
        if new_status and new_status != old_status:
            recipients = list({*(updated.get("staff_ids") or []), updated.get("client_id")})
            await inapp.create_for_users(
                recipients,
                "project.status_changed",
                title=f"Status proyek diubah: {updated.get('name')}",
                body=f"{old_status} → {new_status}",
                link=f"/portal/projects/{project_id}",
                actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
                metadata={"project_id": project_id, "from": old_status, "to": new_status},
            )
            # Live updates: per-project topic + global list topic
            await inapp.broadcast_topic(f"project:{project_id}", "project.status_changed",
                                        {"id": project_id, "status": new_status, "from": old_status})
            await inapp.broadcast_topic("projects", "project.status_changed",
                                        {"id": project_id, "status": new_status})
        # Newly assigned staff get an "assigned" notification
        added_staff = new_staff - old_staff
        if added_staff:
            await inapp.create_for_users(
                list(added_staff),
                "project.assigned",
                title=f"Anda ditugaskan ke proyek: {updated.get('name')}",
                body=f"Kode {updated.get('code', '')}",
                link=f"/portal/projects/{project_id}",
                actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
                metadata={"project_id": project_id},
            )
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(updated))


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(require_role("admin"))):
    db = get_db()
    await db.pm_projects.update_one({"id": project_id}, {"$set": {"voided": True, "updated_at": now_iso()}})
    return success_response({"deleted": True})


# ---- Milestones ------------------------------------------------------------

class MilestoneIn(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"  # todo | in_progress | done
    order: Optional[int] = 0
    due_date: Optional[str] = None


class MilestonePatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    order: Optional[int] = None
    due_date: Optional[str] = None
    completed_at: Optional[str] = None


@router.get("/projects/{project_id}/milestones")
async def list_milestones(project_id: str, user=Depends(get_current_user)):
    await _get_project(project_id, user)
    db = get_db()
    docs = await db.pm_milestones.find({"project_id": project_id, "voided": {"$ne": True}}).sort("order", 1).to_list(100)
    return success_response(serialize_list(docs))


@router.post("/projects/{project_id}/milestones")
async def create_milestone(project_id: str, payload: MilestoneIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    project = await db.pm_projects.find_one({"id": project_id, "voided": {"$ne": True}})
    if not project:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Proyek tidak ditemukan"})
    now = now_iso()
    doc = {"id": new_id(), "project_id": project_id, "created_at": now, "updated_at": now,
           "created_by": user["id"], "voided": False, **payload.model_dump()}
    await db.pm_milestones.insert_one(doc)
    return success_response(serialize_doc(doc))


@router.patch("/projects/{project_id}/milestones/{milestone_id}")
async def update_milestone(project_id: str, milestone_id: str, payload: MilestonePatch, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates.get("status") == "done" and "completed_at" not in updates:
        updates["completed_at"] = now_iso()
    elif updates.get("status") in ("todo", "in_progress"):
        updates["completed_at"] = None
    updates["updated_at"] = now_iso()
    await db.pm_milestones.update_one({"id": milestone_id, "project_id": project_id}, {"$set": updates})
    updated = await db.pm_milestones.find_one({"id": milestone_id}, {"_id": 0})
    return success_response(serialize_doc(updated))


@router.delete("/projects/{project_id}/milestones/{milestone_id}")
async def delete_milestone(project_id: str, milestone_id: str, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    await db.pm_milestones.update_one({"id": milestone_id, "project_id": project_id},
                                      {"$set": {"voided": True, "updated_at": now_iso()}})
    return success_response({"deleted": True})


# ---- Documents -------------------------------------------------------------

@router.get("/projects/{project_id}/documents")
async def list_documents(project_id: str, user=Depends(get_current_user)):
    await _get_project(project_id, user)
    db = get_db()
    docs = await db.pm_documents.find({"project_id": project_id, "voided": {"$ne": True}}).sort("created_at", -1).to_list(200)
    return success_response(serialize_list(docs))


@router.post("/projects/{project_id}/documents")
async def upload_document(project_id: str, file: UploadFile = File(...), user=Depends(require_role("admin", "staff"))):
    db = get_db()
    project = await db.pm_projects.find_one({"id": project_id, "voided": {"$ne": True}})
    if not project:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Proyek tidak ditemukan"})
    # size limit 20MB
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"code": "FILE_TOO_LARGE", "message": "File maksimal 20MB"})
    allowed = {"application/pdf", "image/jpeg", "image/png", "image/webp",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
               "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
               "text/plain"}
    ct = file.content_type or ""
    if ct not in allowed:
        raise HTTPException(status_code=400, detail={"code": "INVALID_FILE_TYPE", "message": "Tipe file tidak didukung"})
    storage = get_storage()
    fname = file.filename or "file"
    import io
    result = await storage.save(io.BytesIO(content), fname, ct)
    now = now_iso()
    doc = {
        "id": new_id(), "project_id": project_id, "name": fname,
        "path": result["key"], "url": result["url"], "content_type": ct,
        "size": len(content), "uploaded_by": user["id"], "created_at": now,
        "updated_at": now, "voided": False,
    }
    await db.pm_documents.insert_one(doc)
    # Phase 15: notify client + other staff (not uploader)
    try:
        recipients = set((project.get("staff_ids") or []))
        recipients.add(project.get("client_id"))
        recipients.discard(None)
        recipients.discard(user["id"])
        await inapp.create_for_users(
            list(recipients),
            "document.uploaded",
            title=f"Dokumen baru: {fname}",
            body=f"Pada proyek {project.get('name', '—')}",
            link=f"/portal/projects/{project_id}",
            actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
            metadata={"project_id": project_id, "document_id": doc["id"], "name": fname},
        )
        await inapp.broadcast_topic(f"project:{project_id}", "document.uploaded",
                                    {"document_id": doc["id"], "name": fname})
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(doc))


@router.delete("/projects/{project_id}/documents/{doc_id}")
async def delete_document(project_id: str, doc_id: str, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    await db.pm_documents.update_one({"id": doc_id, "project_id": project_id},
                                     {"$set": {"voided": True, "updated_at": now_iso()}})
    return success_response({"deleted": True})


# ---- Approvals -------------------------------------------------------------

class ApprovalIn(BaseModel):
    milestone_id: Optional[str] = None
    title: Optional[str] = "Approval Request"
    note: Optional[str] = ""


class ApprovalDecide(BaseModel):
    status: str  # approved | changes_requested
    feedback: Optional[str] = ""


@router.get("/projects/{project_id}/approvals")
async def list_approvals(project_id: str, user=Depends(get_current_user)):
    await _get_project(project_id, user)
    db = get_db()
    docs = await db.pm_approvals.find({"project_id": project_id, "voided": {"$ne": True}}).sort("created_at", -1).to_list(100)
    return success_response(serialize_list(docs))


@router.post("/projects/{project_id}/approvals")
async def create_approval(project_id: str, payload: ApprovalIn, user=Depends(get_current_user)):
    """Client creates approval request. Staff/admin approves via PATCH."""
    project = await _get_project(project_id, user)
    if user["role"] not in ("client", "admin", "staff"):
        raise HTTPException(status_code=403, detail={"code": "AUTH_INSUFFICIENT_PERMISSION", "message": "Akses ditolak"})
    db = get_db()
    now = now_iso()
    doc = {
        "id": new_id(), "project_id": project_id, "milestone_id": payload.milestone_id,
        "title": payload.title, "note": payload.note,
        "status": "pending", "feedback": "",
        "requested_by": user["id"], "decided_by": None, "decided_at": None,
        "created_at": now, "updated_at": now, "voided": False,
    }
    await db.pm_approvals.insert_one(doc)
    # Audit log
    await _log_audit(db, doc["id"], project_id, "created",
                     user["id"], user.get("name", user["id"]), user["role"],
                     {"title": payload.title})
    # Phase 12: notify admin/staff (best-effort)
    try:
        await notify_approval_requested(project, doc, user)
    except Exception as exc:  # noqa: BLE001
        pass  # Email notification failure shouldn't block approval creation
    # Phase 15: in-app notif to all admins + project staff + the client (if requestor wasn't them)
    try:
        recipients = set((project.get("staff_ids") or []))
        recipients.add(project.get("client_id"))
        # admins too
        admins = await db.system_users.find(
            {"role": "admin", "status": "active", "voided": {"$ne": True}}, {"_id": 0, "id": 1}
        ).to_list(50)
        for a in admins:
            recipients.add(a["id"])
        recipients.discard(None)
        await inapp.create_for_users(
            list(recipients),
            "approval.requested",
            title=f"Persetujuan diminta: {doc.get('title')}",
            body=f"Pada proyek {project.get('name', '—')}",
            link=f"/portal/projects/{project_id}",
            actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
            metadata={"project_id": project_id, "approval_id": doc["id"]},
        )
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(doc))


@router.patch("/projects/{project_id}/approvals/{approval_id}")
async def decide_approval(project_id: str, approval_id: str, payload: ApprovalDecide, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    if payload.status not in ("approved", "changes_requested"):
        raise HTTPException(status_code=400, detail={"code": "INVALID_STATUS", "message": "Status tidak valid"})
    now = now_iso()
    await db.pm_approvals.update_one(
        {"id": approval_id, "project_id": project_id},
        {"$set": {"status": payload.status, "feedback": payload.feedback or "",
                  "decided_by": user["id"], "decided_at": now, "updated_at": now}}
    )
    # Audit log
    await _log_audit(db, approval_id, project_id, "decided",
                     user["id"], user.get("name", user["id"]), user["role"],
                     {"status": payload.status, "feedback": payload.feedback})
    updated = await db.pm_approvals.find_one({"id": approval_id}, {"_id": 0})
    return success_response(serialize_doc(updated))


# ---- Audit trail helper -------------------------------------------------

async def _log_audit(db, approval_id: str, project_id: str, action: str,
                     actor_id: str, actor_name: str, actor_role: str, details: dict = None):
    await db.approval_audit_logs.insert_one({
        "id": new_id(),
        "approval_id": approval_id,
        "project_id": project_id,
        "action": action,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "actor_role": actor_role,
        "details": details or {},
        "timestamp": now_iso(),
    })


# ---- E-sign & Audit endpoints ------------------------------------------

class SignatureIn(BaseModel):
    signature_type: str  # drawn | typed
    signature_data: str  # base64 PNG (drawn) or name text (typed)
    signer_name: Optional[str] = None  # override for typed


@router.post("/projects/{project_id}/approvals/{approval_id}/sign")
async def sign_approval(project_id: str, approval_id: str, payload: SignatureIn, user=Depends(get_current_user)):
    """Submit e-signature for an approved approval. Any role with project access can sign."""
    project = await _get_project(project_id, user)
    db = get_db()
    approval = await db.pm_approvals.find_one({"id": approval_id, "project_id": project_id, "voided": {"$ne": True}})
    if not approval:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Approval tidak ditemukan"})
    if approval.get("status") not in ("approved", "changes_requested", "pending"):
        raise HTTPException(status_code=400, detail={"code": "INVALID_STATE", "message": "Approval belum memiliki status"})
    if payload.signature_type not in ("drawn", "typed"):
        raise HTTPException(status_code=400, detail={"code": "INVALID_TYPE", "message": "Tipe tanda tangan tidak valid"})
    # Check if already signed by this user
    existing = await db.approval_signatures.find_one({"approval_id": approval_id, "signer_id": user["id"]})
    if existing:
        raise HTTPException(status_code=409, detail={"code": "ALREADY_SIGNED", "message": "Anda sudah menandatangani persetujuan ini"})

    import hashlib
    now = now_iso()
    sig_name = payload.signer_name or user.get("name", user["id"])
    content_for_hash = f"{approval_id}:{user['id']}:{sig_name}:{now}"
    cert_hash = hashlib.sha256(content_for_hash.encode()).hexdigest()
    count = await db.approval_signatures.count_documents({})
    cert_no = f"KTI-CERT-{count + 1:04d}"

    sig_doc = {
        "id": new_id(),
        "approval_id": approval_id,
        "project_id": project_id,
        "signer_id": user["id"],
        "signer_name": sig_name,
        "signer_email": user.get("email", ""),
        "signer_role": user["role"],
        "signature_type": payload.signature_type,
        "signature_data": payload.signature_data,
        "signed_at": now,
        "certificate_no": cert_no,
        "certificate_hash": cert_hash,
        "created_at": now,
    }
    await db.approval_signatures.insert_one(sig_doc)
    await _log_audit(db, approval_id, project_id, "signed",
                     user["id"], sig_name, user["role"],
                     {"certificate_no": cert_no, "signature_type": payload.signature_type})
    # Phase 12: notify all stakeholders (best-effort)
    try:
        await notify_approval_signed(project, approval, sig_doc)
    except Exception as exc:  # noqa: BLE001
        pass  # Email notification failure shouldn't block signature
    # Phase 15: in-app + live update for approval modal close
    try:
        recipients = set((project.get("staff_ids") or []))
        recipients.add(project.get("client_id"))
        admins = await db.system_users.find(
            {"role": "admin", "status": "active", "voided": {"$ne": True}}, {"_id": 0, "id": 1}
        ).to_list(50)
        for a in admins:
            recipients.add(a["id"])
        recipients.discard(None)
        await inapp.create_for_users(
            list(recipients),
            "approval.signed",
            title=f"Persetujuan ditandatangani: {approval.get('title', '—')}",
            body=f"oleh {sig_name} · sertifikat {cert_no}",
            link=f"/portal/projects/{project_id}",
            actor={"id": user["id"], "name": user.get("name"), "role": user["role"]},
            metadata={"project_id": project_id, "approval_id": approval_id, "certificate_no": cert_no},
        )
        # Live update: per-approval topic for modal auto-close
        await inapp.broadcast_topic(f"approval:{approval_id}", "approval.signed",
                                    {"approval_id": approval_id, "certificate_no": cert_no, "signer": sig_name})
        await inapp.broadcast_topic(f"project:{project_id}", "approval.signed",
                                    {"approval_id": approval_id, "certificate_no": cert_no})
    except Exception as exc:  # noqa: BLE001
        pass  # Notification failure should not block operation
    return success_response(serialize_doc(sig_doc))


@router.get("/projects/{project_id}/approvals/{approval_id}/signatures")
async def list_signatures(project_id: str, approval_id: str, user=Depends(get_current_user)):
    await _get_project(project_id, user)
    db = get_db()
    sigs = await db.approval_signatures.find({"approval_id": approval_id}).sort("signed_at", 1).to_list(50)
    # Don't return raw signature data (privacy)
    result = []
    for s in sigs:
        s = serialize_doc(s)
        s["signature_data"] = "[REDACTED]"
        result.append(s)
    return success_response(result)


@router.get("/projects/{project_id}/approvals/{approval_id}/history")
async def approval_history(project_id: str, approval_id: str, user=Depends(get_current_user)):
    await _get_project(project_id, user)
    db = get_db()
    logs = await db.approval_audit_logs.find({"approval_id": approval_id}).sort("timestamp", 1).to_list(100)
    return success_response(serialize_list(logs))


from fastapi.responses import Response as FastAPIResponse


@router.get("/projects/{project_id}/approvals/{approval_id}/certificate")
async def download_certificate(project_id: str, approval_id: str, user=Depends(get_current_user)):
    """Generate and return approval certificate PDF."""
    project = await _get_project(project_id, user)
    db = get_db()
    approval = await db.pm_approvals.find_one({"id": approval_id, "project_id": project_id})
    if not approval:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Approval tidak ditemukan"})
    # Get first signature for this approval
    sig = await db.approval_signatures.find_one({"approval_id": approval_id})
    if not sig:
        raise HTTPException(status_code=404, detail={"code": "NOT_SIGNED", "message": "Belum ada tanda tangan untuk approval ini"})
    # Get decider name
    decided_name = "—"
    decided_role = ""
    if approval.get("decided_by"):
        dec_user = await db.system_users.find_one({"id": approval["decided_by"]}, {"_id": 0, "name": 1, "role": 1})
        if dec_user:
            decided_name = dec_user["name"]
            decided_role = dec_user["role"]
    try:
        from approval_cert import generate_certificate_pdf
        pdf_bytes = generate_certificate_pdf(
            cert_no=sig.get("certificate_no", "KTI-CERT-0000"),
            project_name=project.get("name", ""),
            approval_title=approval.get("title", ""),
            approval_status=approval.get("status", ""),
            decided_by_name=decided_name,
            decided_by_role=decided_role,
            signer_name=sig.get("signer_name", ""),
            signer_email=sig.get("signer_email", ""),
            signer_role=sig.get("signer_role", ""),
            signed_at=sig.get("signed_at", ""),
            signature_type=sig.get("signature_type", "typed"),
            signature_data=sig.get("signature_data", ""),
            cert_hash=sig.get("certificate_hash", ""),
            notes=approval.get("feedback", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "PDF_ERROR", "message": f"Gagal generate PDF: {e}"})
    cert_no = sig.get("certificate_no", "certificate")
    return FastAPIResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cert_no}.pdf"},
    )
