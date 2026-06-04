import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

load_dotenv()

from core_utils import success_response  # noqa: E402
from db import get_db  # noqa: E402
from routers import admin as admin_router  # noqa: E402
from routers import admin_users as admin_users_router  # noqa: E402
from routers import ai as ai_router  # noqa: E402
from routers import assessment as assessment_router  # noqa: E402
from routers import auth as auth_router  # noqa: E402
from routers import cms as cms_router  # noqa: E402
from routers import content as content_router  # noqa: E402
from routers import leads as leads_router  # noqa: E402
from routers import media as media_router  # noqa: E402
from seed_assessment import seed_assessment  # noqa: E402
from seed_data import seed_all  # noqa: E402
from seed_users import seed_users  # noqa: E402
from seed_pm import seed_pm  # noqa: E402
from seed_home_blocks import seed_home_blocks_db  # noqa: E402
from seed_kn3_template import seed_kn3_template  # noqa: E402
from routers import projects as projects_router  # noqa: E402
from routers import billing as billing_router  # noqa: E402
from routers import chat as chat_router  # noqa: E402
from routers import analytics as analytics_router  # noqa: E402
from routers import seo as seo_router  # noqa: E402
from routers import seo_ai as seo_ai_router  # noqa: E402
from routers import integrations as integrations_router  # noqa: E402
from routers import search as search_router  # noqa: E402
from routers import notifications as notifications_router  # noqa: E402
from routers import demo as demo_router  # noqa: E402
from routers import analytics_events as analytics_events_router  # noqa: E402
# Phase 19: Content Completion routers
from routers import testimonials as testimonials_router  # noqa: E402
from routers import legal as legal_router  # noqa: E402
from routers import faq as faq_router  # noqa: E402
from routers import packages as packages_router  # noqa: E402
from routers import resources as resources_router  # noqa: E402
# New features
from routers import consultation as consultation_router  # noqa: E402
from routers import demo_analytics as demo_analytics_router  # noqa: E402
from routers import assessment_pdf_config as assessment_pdf_config_router  # noqa: E402
from routers import garment_demo as garment_demo_router  # noqa: E402
from routers import system_recovery as system_recovery_router  # noqa: E402
from demo_context import set_kn3_demo_db, reset_kn3_demo_db  # noqa: E402
from db import get_client as mongo_client  # noqa: E402
import re as _re  # noqa: E402

# Demo KN3 routers
from demos.kn3.routers import auth as kn3_auth_router  # noqa: E402
from demos.kn3.routers import dashboard as kn3_dashboard_router  # noqa: E402
from demos.kn3.routers import products as kn3_products_router  # noqa: E402
from demos.kn3.routers import inventory as kn3_inventory_router  # noqa: E402
from demos.kn3.routers import warehouses as kn3_warehouses_router  # noqa: E402
from demos.kn3.routers import customers as kn3_customers_router  # noqa: E402
from demos.kn3.routers import sales_orders as kn3_sales_orders_router  # noqa: E402
from demos.kn3.routers import uoms as kn3_uoms_router  # noqa: E402
from demos.kn3.routers import wms as kn3_wms_router  # noqa: E402
from demos.kn3.routers import inbound_receiving as kn3_inbound_router  # noqa: E402
from demos.kn3.routers import outbound_picking as kn3_outbound_router  # noqa: E402
from demos.kn3.routers import document_templates as kn3_doc_router  # noqa: E402
from seed_email_templates import seed_email_templates  # noqa: E402
from security import require_role, require_docs_auth  # noqa: E402
from cache import cache_stats, clear_all  # noqa: E402
from fastapi import Depends  # noqa: E402
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html  # noqa: E402
from fastapi.openapi.utils import get_openapi  # noqa: E402

# Phase 17: OpenAPI configuration with comprehensive metadata
app = FastAPI(
    title="Kubus Teknologi Indonesia API",
    description="""
## 🚀 Kubus Teknologi Indonesia - Platform API

Platform terintegrasi untuk manajemen proyek, CMS, assessment, dan layanan digital berbasis AI.

### 🔐 Authentication

API ini menggunakan **JWT Bearer Token** authentication untuk endpoint yang memerlukan authorization.

**Flow:**
1. Login via `POST /api/auth/login` dengan email & password
2. Dapatkan `access_token` dan `refresh_token`
3. Gunakan `access_token` di header: `Authorization: Bearer <token>`
4. Refresh token menggunakan `POST /api/auth/refresh` ketika access token expired

### 📚 Kategorisasi Endpoint

- **Auth:** Authentication & authorization
- **Content:** Public content (services, cases, blog, careers, tech)
- **CMS:** Content management system (admin only)
- **Leads/CRM:** Lead management & contact forms
- **Assessment:** IT Solution Discovery assessment module
- **AI:** AI advisor & assistant (Claude-powered)
- **Projects:** Project management (client & staff)
- **Billing:** Invoice & payment management
- **Chat:** Real-time messaging between clients & staff
- **Analytics:** Dashboard analytics (admin/staff only)
- **SEO:** SEO optimization & AI-powered meta generation
- **Integrations:** Third-party integration settings (email, payment, storage)
- **Notifications:** Real-time notifications (WebSocket + REST)
- **Search:** Global search across platform
- **Media:** Media library & asset management
- **Demo:** Demo sandbox session management

### 🛡️ RBAC (Role-Based Access Control)

**Roles:**
- `admin`: Full access ke semua fitur
- `staff`: Access ke management tools (projects, clients, analytics)
- `client`: Access ke client portal (own projects, invoices, messages)

### 📄 Response Format

Semua response mengikuti envelope standard:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```
    """,
    version="2.17.0",
    contact={
        "name": "Kubus Teknologi Indonesia",
        "url": "https://kubustek.id",
        "email": "info@kubustek.id"
    },
    license_info={
        "name": "Proprietary",
    },
    servers=[
        {
            "url": os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001"),
            "description": "Production/Development Server"
        }
    ],
    docs_url=None,  # Disable default /docs (we'll protect it manually)
    redoc_url=None,  # Disable default /redoc
    openapi_url=None,  # Disable default /openapi.json (we'll protect it manually)
)

# Phase 13: compress responses > 1KB for major bandwidth + LCP savings
app.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=6)

_origins = os.environ.get("CORS_ORIGINS", "*")
allow_origins = ["*"] if _origins.strip() == "*" else [o.strip() for o in _origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Demo Context Middleware -------------------------------------------------
# Set MongoDB database context untuk setiap request ke /api/demo/kn3/*
_DEMO_KN3_PATH_RE = _re.compile(r"^/api/demo/kn3/")

@app.middleware("http")
async def demo_kn3_context_middleware(request: Request, call_next):
    """
    Untuk setiap request ke /api/demo/kn3/*, ambil session_id dari
    Authorization header, validasi, dan set demo DB context.
    """
    if _DEMO_KN3_PATH_RE.match(str(request.url.path)):
        auth_header = request.headers.get("Authorization", "")
        session_id = None
        if auth_header.startswith("Bearer "):
            session_id = auth_header.replace("Bearer ", "").strip()

        if session_id and session_id != "demo-token":
            try:
                from datetime import datetime, timezone as _tz
                from demos.kn3.core_utils import safe_doc as _safe_doc
                db_name = os.environ.get("DB_NAME", "test_database")
                kbs3_db = mongo_client()[db_name]
                session = _safe_doc(
                    await kbs3_db.demo_sessions.find_one({"id": session_id}, {"_id": 0})
                )
                if session:
                    short_id = session_id.replace("-", "")[:16]
                    demo_db = mongo_client()[f"demo_kn3_{short_id}"]
                    token = set_kn3_demo_db(demo_db)
                    try:
                        response = await call_next(request)
                    finally:
                        reset_kn3_demo_db(token)
                    return response
            except Exception:
                pass
        # No valid session — still allow auth/login endpoint to pass through
        if "/auth/login" in str(request.url.path) or "/auth/me" in str(request.url.path):
            return await call_next(request)
        # For other demo routes without valid session, still try (will fail at db access)
        return await call_next(request)

    return await call_next(request)


# --- Consistent error envelope (KTI_05) ------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        error = {"code": detail.get("code"), "message": detail.get("message", ""), "details": detail.get("details", [])}
    else:
        error = {"code": "ERROR", "message": str(detail), "details": []}
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": error})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [{"loc": list(e.get("loc", [])), "msg": e.get("msg", ""), "type": e.get("type", "")} for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Validasi gagal", "details": details}},
    )


# --- Routers ----------------------------------------------------------------
app.include_router(auth_router.router)
app.include_router(admin_users_router.router)
app.include_router(admin_router.router)
app.include_router(cms_router.router)
app.include_router(assessment_router.router)
app.include_router(media_router.router)
app.include_router(media_router.public_router)
app.include_router(content_router.router)
app.include_router(leads_router.router)
app.include_router(ai_router.router)
app.include_router(projects_router.router)
app.include_router(billing_router.router)
app.include_router(chat_router.router)
app.include_router(analytics_router.router)
app.include_router(seo_router.router, prefix="/api/seo", tags=["SEO"])
app.include_router(seo_ai_router.router, prefix="/api/seo", tags=["SEO AI"])
app.include_router(integrations_router.router)
app.include_router(search_router.router)
app.include_router(notifications_router.router)
app.include_router(demo_router.router)
app.include_router(analytics_events_router.router)
app.include_router(analytics_events_router.admin_router)

# Phase 19: Content Completion routers
app.include_router(testimonials_router.router)
app.include_router(legal_router.router)
app.include_router(faq_router.router)
app.include_router(packages_router.router)
app.include_router(resources_router.router)

# New features
app.include_router(consultation_router.router)
app.include_router(demo_analytics_router.router)
app.include_router(assessment_pdf_config_router.router)
app.include_router(demo_analytics_router.admin_router)

# Garment Serial Tracking demo (stateless, hardcoded fixtures)
app.include_router(garment_demo_router.router)

# System Recovery (export/import/dedup)
app.include_router(system_recovery_router.router)

# --- Demo KN3 Routers -------------------------------------------------------
app.include_router(kn3_auth_router.router)
app.include_router(kn3_dashboard_router.router)
app.include_router(kn3_products_router.router)
app.include_router(kn3_inventory_router.router)
app.include_router(kn3_warehouses_router.router)
app.include_router(kn3_customers_router.router)
app.include_router(kn3_sales_orders_router.router)
app.include_router(kn3_uoms_router.router)
app.include_router(kn3_wms_router.router)
app.include_router(kn3_inbound_router.router)
app.include_router(kn3_outbound_router.router)
app.include_router(kn3_doc_router.router)


@app.get("/api/")
async def root():
    return success_response({"service": "kti-api", "status": "ok"})


@app.get("/api/health")
async def health():
    return success_response({"status": "healthy"})


@app.get("/api/admin/cache/stats")
async def admin_cache_stats(_user=Depends(require_role("admin"))):
    """Admin-only: lightweight observability for the in-process cache (Phase 13)."""
    return success_response(cache_stats())


@app.post("/api/admin/cache/flush")
async def admin_cache_flush(_user=Depends(require_role("admin"))):
    """Admin-only: manual flush of the public content cache."""
    clear_all()
    return success_response({"flushed": True})


# --- Phase 17: Protected API Documentation Endpoints ------------------------
@app.get("/api/docs", include_in_schema=False)
async def get_swagger_documentation(_auth: bool = Depends(require_docs_auth)):
    """Swagger UI documentation (protected dengan HTTP Basic Auth)."""
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=f"{app.title} - Swagger UI",
        swagger_ui_parameters={
            "persistAuthorization": True,
            "displayRequestDuration": True,
            "filter": True,
            "tryItOutEnabled": True,
        }
    )


@app.get("/api/redoc", include_in_schema=False)
async def get_redoc_documentation(_auth: bool = Depends(require_docs_auth)):
    """ReDoc documentation (protected dengan HTTP Basic Auth)."""
    return get_redoc_html(
        openapi_url="/api/openapi.json",
        title=f"{app.title} - ReDoc"
    )


@app.get("/api/openapi.json", include_in_schema=False)
async def get_open_api_endpoint(_auth: bool = Depends(require_docs_auth)):
    """OpenAPI schema JSON (protected dengan HTTP Basic Auth)."""
    return custom_openapi()


def custom_openapi():
    """Custom OpenAPI schema dengan security schemes dan tag descriptions."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        servers=app.servers,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT access token dari endpoint `/api/auth/login`. Format: `Bearer <access_token>`"
        },
        "BasicAuth": {
            "type": "http",
            "scheme": "basic",
            "description": "HTTP Basic Authentication untuk akses dokumentasi API"
        }
    }
    
    # Add comprehensive tag descriptions
    openapi_schema["tags"] = [
        {"name": "Auth", "description": "🔐 Authentication & Authorization - Login, logout, refresh token, dan user management"},
        {"name": "Content", "description": "📄 Public Content - Services, cases, blog, careers, tech stack (read-only, no auth required)"},
        {"name": "CMS", "description": "✏️ Content Management System - CRUD operations untuk semua konten (admin/staff only)"},
        {"name": "Leads/CRM", "description": "📞 Lead Management - Contact forms, lead tracking, dan CRM (admin/staff only)"},
        {"name": "Assessment", "description": "📋 IT Solution Discovery - Assessment template management dan submission tracking"},
        {"name": "AI", "description": "🤖 AI Advisor & Assistant - Claude-powered conversational AI (public + portal)"},
        {"name": "Projects", "description": "📊 Project Management - Projects, milestones, documents, approvals, e-signature"},
        {"name": "Billing", "description": "💰 Invoice & Payment - Billing management untuk client projects"},
        {"name": "Chat", "description": "💬 Real-time Messaging - Communication between clients and staff"},
        {"name": "Analytics", "description": "📈 Dashboard Analytics - Lead funnel, revenue trends, AI usage (admin/staff only)"},
        {"name": "SEO", "description": "🔍 SEO Optimization - AI-powered meta generation, SEO scoring, sitemap/robots.txt"},
        {"name": "Integrations", "description": "🔌 Integration Settings - Email, payment gateway, object storage configuration (admin only)"},
        {"name": "Notifications", "description": "🔔 Real-time Notifications - WebSocket + REST API untuk in-app notifications"},
        {"name": "Search", "description": "🔎 Global Search - RBAC-safe search across CMS content dan portal data"},
        {"name": "Media", "description": "🖼️ Media Library - Asset management, upload, folders (admin/staff only)"},
        {"name": "Demo", "description": "🎮 Demo Sandbox - Session management untuk isolated product demos"},
    ]
    
    # Filter out demo KN3 internal endpoints dari schema
    filtered_paths = {}
    for path, path_item in openapi_schema.get("paths", {}).items():
        # Exclude /api/demo/kn3/* internal endpoints (tapi keep /api/demo/sessions)
        if path.startswith("/api/demo/kn3/"):
            continue
        filtered_paths[path] = path_item
    
    openapi_schema["paths"] = filtered_paths
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Set custom OpenAPI function
app.openapi = custom_openapi


@app.on_event("startup")
async def on_startup():
    db = get_db()
    await db.cms_services.create_index("slug", unique=True)
    await db.cms_cases.create_index("slug", unique=True)
    await db.cms_blog.create_index("slug", unique=True)
    await db.cms_careers.create_index("slug", unique=True)
    await db.crm_leads.create_index([("created_at", -1)])
    await db.ai_conversations.create_index("session_id", unique=True)
    await db.system_users.create_index("email", unique=True)
    await db.media_assets.create_index([("created_at", -1)])
    await db.media_assets.create_index("kind")
    await db.media_assets.create_index("folder_id")
    await db.media_usage.create_index("asset_id")
    await db.cms_home_blocks.create_index("key", unique=True)
    await db.assessment_sessions.create_index("token", unique=True)
    await db.assessment_sessions.create_index([("created_at", -1)])
    await db.assessment_answers.create_index([("session_id", 1), ("question_id", 1)], unique=True)
    await db.assessment_attachments.create_index("session_id")
    await db.assessment_ai_reports.create_index([("session_id", 1), ("report_type", 1)], unique=True)
    # PM indexes
    await db.pm_projects.create_index([("created_at", -1)])
    await db.pm_projects.create_index("client_id")
    await db.pm_projects.create_index("staff_ids")
    await db.pm_milestones.create_index([("project_id", 1), ("order", 1)])
    await db.pm_documents.create_index("project_id")
    await db.pm_approvals.create_index([("project_id", 1), ("created_at", -1)])
    await db.billing_invoices.create_index([("created_at", -1)])
    await db.billing_invoices.create_index("client_id")
    await db.chat_threads.create_index([("last_message_at", -1)])
    await db.chat_threads.create_index("client_id")
    await db.chat_messages.create_index([("thread_id", 1), ("created_at", 1)])
    # AI conversations indexes
    await db.ai_conversations.create_index([("updated_at", -1)])
    await db.ai_conversations.create_index("user_id")
    await db.ai_conversations.create_index("surface")
    # Phase 9 - E-sign & audit indexes
    await db.approval_signatures.create_index("approval_id")
    await db.approval_signatures.create_index("signer_id")
    await db.approval_audit_logs.create_index([("approval_id", 1), ("timestamp", 1)])
    await db.approval_audit_logs.create_index("project_id")
    # Phase 12 - Integrations + Email Notifications
    await db.integration_settings.create_index("type", unique=True)
    await db.email_outbox.create_index([("created_at", -1)])
    await db.email_outbox.create_index("status")
    await db.email_outbox.create_index("template_id")
    await db.email_events.create_index([("outbox_id", 1), ("timestamp", 1)])
    await db.email_templates.create_index([("template_id", 1), ("locale", 1)], unique=True)
    await db.notification_preferences.create_index("user_id", unique=True)
    # Phase 13 - Performance indexes
    # Speed up the most common public read patterns: status+order, status+created_at
    for col in ("cms_services", "cms_cases", "cms_tech", "cms_team", "cms_clients",
                "cms_blog", "cms_careers", "cms_home_blocks"):
        await db[col].create_index([("status", 1), ("order", 1)])
        await db[col].create_index([("status", 1), ("created_at", -1)])
    # Lead status filter + search uses regex on name/email/company; index name/email/company
    await db.crm_leads.create_index("status")
    # Prep for Phase 14 advanced search: bilingual text indexes (best-effort; ignore errors)
    text_targets = [
        ("cms_services", [("title.id", "text"), ("title.en", "text"), ("summary.id", "text"), ("summary.en", "text")]),
        ("cms_cases", [("title.id", "text"), ("title.en", "text"), ("summary.id", "text"), ("summary.en", "text")]),
        ("cms_blog", [("title.id", "text"), ("title.en", "text"), ("body.id", "text"), ("body.en", "text")]),
        ("cms_careers", [("title.id", "text"), ("title.en", "text"), ("summary.id", "text"), ("summary.en", "text")]),
    ]
    for col_name, spec in text_targets:
        try:
            await db[col_name].create_index(spec, default_language="english")
        except Exception as exc:  # noqa: BLE001
            print(f"[startup] text index skip for {col_name}: {exc}")
    # Phase 15 - Notifications (in-app real-time)
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.notifications.create_index([("user_id", 1), ("read", 1)])
    await db.notifications.create_index([("type", 1), ("created_at", -1)])
    # Phase 20 - Demo sandbox session indexes + analytics events TTL
    await db.demo_sessions.create_index("id", unique=True)
    await db.demo_sessions.create_index("expires_at")
    await db.demo_sessions.create_index("email")
    # analytics_events: TTL 90 days via expires_at field
    try:
        await db.analytics_events.create_index(
            "expires_at", expireAfterSeconds=0
        )
        await db.analytics_events.create_index([("target_type", 1), ("target_id", 1)])
        await db.analytics_events.create_index([("event_type", 1), ("created_at", -1)])
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] analytics_events index skip: {exc}")
    # Partners index
    try:
        await db.cms_partners.create_index([("status", 1), ("order", 1)])
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] cms_partners index skip: {exc}")
    await seed_all(db)
    await seed_users(db)
    await seed_assessment(db)
    await seed_pm(db)
    # Seed KN3 ERP & RFID Discovery template (idempotent)
    try:
        await seed_kn3_template(db)
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] seed_kn3_template failed: {exc}")
    # Seed home blocks (idempotent)
    try:
        await seed_home_blocks_db(db)
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] seed_home_blocks failed: {exc}")
    # Ensure seeded assessment templates are published (migration)
    try:
        from core_utils import now_iso as _now_iso
        await db.assessment_templates.update_many(
            {"code": "it-solution-discovery", "published": {"$ne": True}},
            {"$set": {"published": True, "updated_at": _now_iso()}}
        )
        await db.assessment_templates.update_many(
            {"id": "kn3-erp-discovery-v1", "published": {"$ne": True}},
            {"$set": {"published": True, "updated_at": _now_iso()}}
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] template publish migration failed: {exc}")
    # Migrate site settings contact info
    try:
        site = await db.cms_pages.find_one({"key": "site"})
        if site:
            old_contact = site.get("contact", {})
            if old_contact.get("email") in (None, "", "halo@kubusteknologi.id"):
                await db.cms_pages.update_one(
                    {"key": "site"},
                    {"$set": {
                        "contact.email": "hello@kubusindonesia.com",
                        "contact.phone": "+62899 3939 617",
                        "contact.address": {
                            "id": "GoWork Space Lv. 3 Jl. Gatot Subroto No. 271, Bandung",
                            "en": "GoWork Space Lv. 3 Jl. Gatot Subroto No. 271, Bandung City",
                        },
                    }}
                )
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] contact migration failed: {exc}")
    # Seed default email templates (idempotent)
    try:
        created = await seed_email_templates(db)
        if created:
            print(f"[startup] seeded {created} email templates")
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] seed_email_templates failed: {exc}")
    # Seed default partners (idempotent)
    try:
        from seed_partners import seed_partners
        created_partners = await seed_partners(db)
        if created_partners:
            print(f"[startup] seeded {created_partners} partners")
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] seed_partners failed: {exc}")
    # Demo sandbox cleanup scheduler (background asyncio task)
    try:
        demo_router.start_cleanup_scheduler()
        print("[startup] demo cleanup scheduler started")
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] demo cleanup scheduler failed: {exc}")


@app.on_event("shutdown")
async def on_shutdown():
    try:
        demo_router.stop_cleanup_scheduler()
    except Exception as exc:  # noqa: BLE001
        print(f"[shutdown] demo cleanup scheduler stop failed: {exc}")
