"""Analytics aggregation endpoints (Phase 10)."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from core_utils import success_response, now_iso
from db import get_db
from security import require_role

router = APIRouter(prefix="/api")


def _start_of_day(dt: datetime) -> str:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


@router.get("/analytics/overview")
async def analytics_overview(user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()

    # --- Leads ---
    total_leads = await db.crm_leads.count_documents({"voided": {"$ne": True}})
    leads_this_month = await db.crm_leads.count_documents({"voided": {"$ne": True}, "created_at": {"$gte": month_ago}})
    leads_this_week = await db.crm_leads.count_documents({"voided": {"$ne": True}, "created_at": {"$gte": week_ago}})

    # --- Assessment ---
    total_assessments = await db.assessment_sessions.count_documents({"voided": {"$ne": True}})
    submitted_assessments = await db.assessment_sessions.count_documents({"voided": {"$ne": True}, "status": "submitted"})
    assessment_conv = round((submitted_assessments / total_assessments * 100), 1) if total_assessments > 0 else 0

    # --- Projects ---
    total_projects = await db.pm_projects.count_documents({"voided": {"$ne": True}})
    active_projects = await db.pm_projects.count_documents({"voided": {"$ne": True}, "status": "active"})
    completed_projects = await db.pm_projects.count_documents({"voided": {"$ne": True}, "status": "completed"})

    # Avg progress
    proj_cursor = db.pm_projects.aggregate([
        {"$match": {"voided": {"$ne": True}}},
        {"$group": {"_id": None, "avg_progress": {"$avg": "$progress"}}}
    ])
    proj_agg = await proj_cursor.to_list(1)
    avg_progress = round(proj_agg[0]["avg_progress"], 1) if proj_agg else 0

    # --- Milestones ---
    ms_done = await db.pm_milestones.count_documents({"voided": {"$ne": True}, "status": "done"})
    ms_inprogress = await db.pm_milestones.count_documents({"voided": {"$ne": True}, "status": "in_progress"})
    ms_todo = await db.pm_milestones.count_documents({"voided": {"$ne": True}, "status": "todo"})

    # --- Approvals ---
    total_approvals = await db.pm_approvals.count_documents({"voided": {"$ne": True}})
    pending_approvals = await db.pm_approvals.count_documents({"voided": {"$ne": True}, "status": "pending"})
    approved_approvals = await db.pm_approvals.count_documents({"voided": {"$ne": True}, "status": "approved"})
    signed_approvals = await db.approval_signatures.count_documents({})

    # --- Invoices / Revenue ---
    inv_cursor = db.billing_invoices.aggregate([
        {"$match": {"voided": {"$ne": True}}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total": {"$sum": "$amount"}
        }}
    ])
    inv_agg = await inv_cursor.to_list(10)
    revenue_data = {row["_id"]: {"count": row["count"], "total": row["total"]} for row in inv_agg}
    revenue_paid = revenue_data.get("paid", {}).get("total", 0)
    revenue_unpaid = revenue_data.get("unpaid", {}).get("total", 0) + revenue_data.get("overdue", {}).get("total", 0)
    invoice_count = sum(v["count"] for v in revenue_data.values())

    # --- AI Conversations ---
    total_ai = await db.ai_conversations.count_documents({})
    ai_public = await db.ai_conversations.count_documents({"surface": "public"})
    ai_portal = await db.ai_conversations.count_documents({"surface": "portal"})
    ai_this_week = await db.ai_conversations.count_documents({"updated_at": {"$gte": week_ago}})

    # --- Users ---
    total_clients = await db.system_users.count_documents({"voided": {"$ne": True}, "role": "client"})
    total_staff = await db.system_users.count_documents({"voided": {"$ne": True}, "role": {"$in": ["admin", "staff"]}})
    active_clients = await db.system_users.count_documents({"voided": {"$ne": True}, "role": "client", "status": "active"})

    return success_response({
        "leads": {"total": total_leads, "this_month": leads_this_month, "this_week": leads_this_week},
        "assessment": {"total": total_assessments, "submitted": submitted_assessments, "conversion_rate": assessment_conv},
        "projects": {"total": total_projects, "active": active_projects, "completed": completed_projects, "avg_progress": avg_progress},
        "milestones": {"done": ms_done, "in_progress": ms_inprogress, "todo": ms_todo},
        "approvals": {"total": total_approvals, "pending": pending_approvals, "approved": approved_approvals, "signed": signed_approvals},
        "revenue": {"paid": revenue_paid, "unpaid": revenue_unpaid, "invoice_count": invoice_count, "data": revenue_data},
        "ai": {"total": total_ai, "public": ai_public, "portal": ai_portal, "this_week": ai_this_week},
        "users": {"clients": total_clients, "active_clients": active_clients, "staff": total_staff},
    })


@router.get("/analytics/leads-trend")
async def leads_trend(days: int = 30, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = []
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = day.replace(hour=23, minute=59, second=59).isoformat()
        count = await db.crm_leads.count_documents({"voided": {"$ne": True}, "created_at": {"$gte": day_start, "$lte": day_end}})
        result.append({"date": day.strftime("%d/%m"), "leads": count})
    return success_response(result)


@router.get("/analytics/ai-trend")
async def ai_trend(days: int = 14, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = []
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = day.replace(hour=23, minute=59, second=59).isoformat()
        filt = {"updated_at": {"$gte": day_start, "$lte": day_end}}
        pub = await db.ai_conversations.count_documents({**filt, "surface": "public"})
        por = await db.ai_conversations.count_documents({**filt, "surface": "portal"})
        result.append({"date": day.strftime("%d/%m"), "public": pub, "portal": por})
    return success_response(result)


@router.get("/analytics/revenue-trend")
async def revenue_trend(months: int = 6, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = []
    for i in range(months - 1, -1, -1):
        mo = now.month - i
        yr = now.year
        while mo <= 0:
            mo += 12
            yr -= 1
        label = f"{mo:02d}/{yr}"
        mo_str_start = f"{yr}-{mo:02d}-01"
        if mo == 12:
            mo_str_end = f"{yr + 1}-01-01"
        else:
            mo_str_end = f"{yr}-{mo + 1:02d}-01"
        inv_cursor = db.billing_invoices.aggregate([
            {"$match": {"voided": {"$ne": True}, "issued_at": {"$gte": mo_str_start, "$lt": mo_str_end}}},
            {"$group": {"_id": "$status", "total": {"$sum": "$amount"}}}
        ])
        agg = {row["_id"]: row["total"] for row in await inv_cursor.to_list(10)}
        result.append({"month": label, "paid": agg.get("paid", 0), "unpaid": agg.get("unpaid", 0), "overdue": agg.get("overdue", 0)})
    return success_response(result)


@router.get("/analytics/funnel")
async def lead_funnel(user=Depends(require_role("admin", "staff"))):
    db = get_db()
    leads = await db.crm_leads.count_documents({"voided": {"$ne": True}})
    assessments = await db.assessment_sessions.count_documents({"voided": {"$ne": True}})
    submitted = await db.assessment_sessions.count_documents({"voided": {"$ne": True}, "status": "submitted"})
    projects = await db.pm_projects.count_documents({"voided": {"$ne": True}})
    active = await db.pm_projects.count_documents({"voided": {"$ne": True}, "status": "active"})
    signed = await db.approval_signatures.count_documents({})
    return success_response([
        {"stage": "Leads Masuk", "count": leads, "color": "#7C68E1"},
        {"stage": "Assessment", "count": assessments, "color": "#4ECBAF"},
        {"stage": "Assessment Submit", "count": submitted, "color": "#73D1AD"},
        {"stage": "Proyek Dibuat", "count": projects, "color": "#F2A83E"},
        {"stage": "Proyek Aktif", "count": active, "color": "#E8C97A"},
        {"stage": "Approval Signed", "count": signed, "color": "#4ECBAF"},
    ])
