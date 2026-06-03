# plan.md — Portfolio/Case Studies/Products (CMS Template + Block Builder) + UI/UX Overhaul 2026 + Phase 20 (CRM/Assessment/Client Mgmt) Improvements + Phase 21 (Quick Wins + Assessment V2) + Phase 21C (AI Reporting) + Hardening

## PHASE 20A/B/C + 4.7 — FULLY COMPLETE ✅ (2026-06-03)

### Repository Migration & Environment Setup ✅
> ✅ Repo KBS6 berhasil di-clone dari GitHub (pandekomangyogaswastika-dot/KBS6) ke environment baru.
> ✅ Semua backend files, routers, demo files, dan seed scripts sudah di-copy.
> ✅ Semua frontend files sudah di-copy (App.js, App.css, semua components, features, demos, i18n, lib, dll).
> ✅ Memory files (PRD.md, SESSION_HANDOFF.md, SESSION_LOG.md, TECH_DECISIONS.md) sudah di-copy.
> ✅ Docs (KTI_08..KTI_13) dan scripts sudah di-copy.
> ✅ .env files dipreservasi (MONGO_URL, REACT_APP_BACKEND_URL, JWT_SECRET, EMERGENT_LLM_KEY).
> ✅ Semua seed scripts berhasil dijalankan: users, data, assessment, home_blocks, pm, email_templates, phase19, assessment_templates, partners.
> ✅ Backend health check: OK. Frontend compiled dengan 0 errors.
> ✅ Admin login berfungsi dan dashboard menampilkan semua data.

### Phase 4.7 — Garment Serial Tracking Demo ✅
> ✅ Demo stateless/hardcoded dieksekstrak dari `garmentyanathisfinal`
> ✅ Backend router `/api/demos/garment-serial/*` (serial-list, serial-trace, meta) — 12 serials, 10 products
> ✅ Frontend `/demo/garment-serial` — GarmentSerialDemoApp + SerialTrackingPanel (Daftar Serial + Trace Timeline)
> ✅ CMS case `garment-serial-tracking` terhubung: click "Mulai Demo Gratis" → direct navigate ke demo
> ✅ CaseDetailPage.jsx updated: stateless demos bypass gate form seamlessly
> ✅ Test: 17/17 passed (backend 7/7, frontend 10/10)

### Phase 20A — Assessment Template Builder ✅
> ✅ Backend: Template CRUD endpoints (create/edit/publish/delete)
> ✅ Backend: Sessions enhanced (client_user_id assign + due_date)
> ✅ Backend: GET /api/assessment/my endpoint for client portal
> ✅ Frontend Admin: TemplateBuilderModal with section/question editor
> ✅ Frontend Admin: Publish toggle, duplicate template, delete draft
> ✅ Frontend Client Portal: `/portal/assessments` page showing assigned assessments
> ✅ Test: All API endpoints functional, template creation & publish verified

### Phase 20B — Leads Pipeline Automation ✅
> ✅ Backend: 6-stage pipeline model (new/contacted/qualified/proposal/won/lost)
> ✅ Backend: Event tracking system (status_changed/call/email/meeting/note)
> ✅ Backend: Convert lead to client endpoint with password setup
> ✅ Frontend Admin: Kanban board view with 6 columns + drag-and-drop
> ✅ Frontend Admin: Lead detail drawer with timeline + quick actions
> ✅ Frontend Admin: Add event modals (Call/Email/Meeting/Note)
> ✅ Test: Lead conversion E2E flow verified

### Phase 20C — Client Management Detail View ✅
> ✅ Backend: Client aggregation endpoints (project_count, assessment_count, last_active)
> ✅ Backend: GET /api/admin/clients/:id with full context (projects/assessments/lead history)
> ✅ Frontend Admin: Client list table redesign (search+filter+sorting)
> ✅ Frontend Admin: `/portal/admin/clients/:id` detail page dengan tabs
> ✅ Frontend Admin: Assign Assessment from client detail page
> ✅ Bug fixed: db.projects → db.pm_projects in admin.py
> ✅ Test: Backend 12/12 ✅

### Testing Summary
> ✅ Platform state stable.
> ✅ Baseline report: `/app/test_reports/iteration_8.json` (46/46 passed)

**State sekarang (2026-06-02 / 2026-06-03)**: Platform lengkap Phase 0-20. Phase 21A, 21B, 21C, dan hardening sudah selesai. Platform **production-ready**.

---

## 1) Objectives

### A. Public website + CMS content system (existing)
- Menjaga pemisahan IA yang jelas untuk:
  - **Portfolio** = visual showcase
  - **Case Studies** = deep dive + demo
  - **Products (SaaS)** = showcase + CTA (redirect)
- Semua konten **CMS-driven**: CRUD, publish status, tag/category/filterable, dan **page template + block composition**.
- Upgrade Admin CMS untuk authoring experience premium:
  - Preview realistis dan cepat
  - Konsistensi glassmorphism & hover states
  - Side-by-side editor + preview di desktop

### B. Demo sandbox integration (existing + stable)
- Menyediakan demo sandbox yang usable dan presentable.

### C. Phase 20: CRM/Leads pipeline + Assessment templating + Client Management (complete)
- Semua fitur Phase 20 sudah selesai dan stabil.

### D. Phase 21: Quick Wins + Assessment V2 (KN3 Clone) ✅
- Phase 21A (Quick Wins) **selesai**.
- Phase 21B (Assessment V2 / KN3 Clone) **selesai** dan **teruji end-to-end**.

### E. Phase 21C: AI Reporting Enhancements ✅
- AI reporting untuk assessment yang sudah disubmit (manual trigger, structured JSON, bilingual, on-the-fly).

### F. UI Consistency Mini-Fix (P2) ✅
- Eliminasi native browser dialog (`window.confirm`, `window.prompt`) pada AdminProjects → diganti Shadcn AlertDialog/Dialog.

### G. Quality Gate: Comprehensive Testing ✅
- Assessment V2 + AdminProjects comprehensive testing: **Backend 29/29 passed**, Frontend verified.

### H. Hardening / Maintenance ✅
- Fix warning chart container size (width/height -1).
- Frontend compile clean (no errors).

### I. Deployment Readiness (NEW — P0)
**Tujuan baru berdasarkan diskusi terbaru:**
- Menyediakan **deployment guide yang final, professional, dan copy‑paste ready** untuk VPS (khususnya Hostinger) di **Ubuntu 24.04 LTS**.
- Menghilangkan seluruh ketergantungan **Emergent-only** untuk production:
  - Python: `emergentintegrations` tidak boleh menjadi dependency wajib.
  - Frontend: menghapus script tracking/badge Emergent dari `public/index.html`.
- Menyediakan jalur deployment **tanpa domain** (pakai **IP VPS**) + pilihan DB **MongoDB local**.
- Menutup gap dependency pada frontend (npm peer deps / ajv / zxing) dengan guidance yang deterministic.

### Non-functional
- Tidak mematahkan fitur existing (public pages, admin, client portal)
- Performance aman, responsif mobile, aksesibilitas
- Elemen interaktif krusial memiliki `data-testid`
- Styling mengikuti `/app/design_guidelines.md`

---

## 2) Implementation Steps

### Phase 1 — Core POC (Template + Blocks End-to-End) ✅ SELESAI

### Phase 2 — V1 App Development (Full Pages + Filters + CMS UX) ✅ SELESAI

### Phase 3 — Hardening + Templates Expansion + Migration ✅ SELESAI

### Phase 4 — UI/UX Overhaul 2026 (Immersive + Interactive) ✅ SELESAI

### Phase 4.5 — Navbar simplification + Services redesign ✅ SELESAI

### Phase 4.6 — Demo UX parity with KN3 repo + reliability ✅ SELESAI

### Phase 4.7 — Garment Serial Tracking Demo ✅ SELESAI

---

## KBS7 Migration ✅ (2026-06-02)
> ✅ Repo KBS7 berhasil di-clone dari GitHub (pandekomangyogaswastika-dot/KBS7) ke environment baru.
> ✅ Seed scripts sukses dieksekusi.
> ✅ Baseline stabil.

---

## Phase 21A — Quick Wins (Status: COMPLETE ✅)
- ✅ 21A.1 DemoAnalyticsPage runtime error fix
- ✅ 21A.2 Media Library prompt/confirm → shadcn Dialog/AlertDialog
- ✅ 21A.3 CMS side-by-side preview desktop + dialog width update

---

## Phase 21B — Assessment V2 (KN3 Clone / Assessment Module Overhaul) ✅ COMPLETE

### Status
- ✅ Frontend taking UI sudah di-port dan terintegrasi
- ✅ Comprehensive testing selesai

### 21B.0 — Prinsip Implementasi (final)
- **Clean integration**: tidak membuat router `/api/assessment-v2` baru; gunakan endpoints existing di `/api/assessment`.
- **Port UX dari KN3**: branching default-show, other sentinel `__other__`, notes, skip/clear, autosave, attachments.

### 21B.1 — Frontend Client: Assessment Taking (P0) ✅ DONE
#### Deliverable (achieved)
- ✅ Domain navigation
- ✅ Progress per domain + overall
- ✅ Branching/show_if
- ✅ Autosave debounce 3 detik (batch PATCH)
- ✅ Attachments per question
- ✅ Notes per question
- ✅ Skip/Clear
- ✅ Submit & lock state

#### Testing (FINAL — Comprehensive)
- ✅ Report: `/app/test_reports/iteration_11.json`
- ✅ Backend: **29/29 tests passed (100%)**

---

## Issue P2 — AdminProjects: Replace Native window.confirm/prompt ✅ COMPLETE

### Implementation (final)
1) (NEW) `frontend/src/features/admin/pages/components/ConfirmDialog.jsx` ✅
2) (UPDATE) `frontend/src/features/admin/pages/AdminProjects.jsx` ✅

---

## Phase 21C — AI Reporting Enhancements ✅ COMPLETE

### 21C.0 — Prinsip Implementasi (final)
- Manual trigger, structured JSON, per-domain analysis, bilingual, on-the-fly.

---

## Hardening / Maintenance ✅ COMPLETE

### H.1 — Fix Chart Warning (width/height -1) ✅ DONE
- ✅ (UPDATE) `frontend/src/features/admin/pages/AdminAnalytics.jsx`

---

## Phase 22 — Deployment Hardening & VPS Guide (NEW — P0)

### Status (as of 2026-06-03)
- ✅ Draft docs created: `DEPLOYMENT_HOSTINGER.md`, `QUICK_DEPLOY.md`, `DEPLOYMENT_COMMANDS.md`, `DEPLOYMENT_UBUNTU_24.04.md`
- ✅ Branding update (title + favicon + remove Emergent scripts) implemented in frontend.
- ⚠️ Deployment experience on VPS found issues:
  - `emergentintegrations` is not installable on generic Ubuntu → must be removed or optional.
  - Frontend build: dependency conflicts (`@zxing/*` peer deps + AJV missing module).
  - Copy/paste long command blocks caused user error; require modular scripts + checkpoints.

### 22.1 — Backend Dependencies: Remove Emergent-only library (P0)
**Goal:** Production install must succeed on Ubuntu 24.04.
- [ ] Remove `emergentintegrations==0.1.2` from `backend/requirements.txt`.
- [ ] Keep AI optional using `anthropic` SDK.
- [ ] Ensure `assessment_ai_report.py` uses production-safe code path (no emergent import required at import-time).

### 22.2 — Frontend Dependencies: Deterministic build (P0)
**Goal:** `npm install` + `npm run build` must succeed on Node LTS without manual trial-and-error.
- [ ] Resolve `@zxing/browser` ↔ `@zxing/library` mismatch (pin compatible versions or remove unused dependency).
- [ ] Fix AJV/ajv-keywords mismatch:
  - pin `ajv@8` and `ajv-keywords@5` (or compatible set) as explicit dependencies.
- [ ] Update docs to enforce one approach:
  - `npm ci --legacy-peer-deps` (preferred) OR pin versions in `package-lock.json` and commit.

### 22.3 — Deployment Guides: Final & Tested on Ubuntu 24.04 (P0)
**Goal:** A single document that works end-to-end.
- [ ] Consolidate into one canonical guide:
  - `DEPLOYMENT_UBUNTU_24.04_FINAL.md`
- [ ] Provide two supported modes:
  1) **No domain**: HTTP via IP VPS, no SSL.
  2) **With domain**: HTTPS via certbot.
- [ ] Provide MongoDB options:
  - MongoDB local (recommended for quick start)
  - MongoDB Atlas (recommended for managed)

### 22.4 — Deployment Script: Safe, modular, idempotent (P0)
**Goal:** Reduce human error.
- [ ] Create `scripts/vps/00_prereq.sh`, `01_backend.sh`, `02_frontend.sh`, `03_mongo_local.sh`, `04_supervisor.sh`, `05_nginx_ip.sh`, `06_nginx_domain_ssl.sh`, `07_verify.sh`.
- [ ] Each script:
  - prints what it will do
  - exits on error
  - checks current state (idempotent)

### 22.5 — Verification Checklist (P0)
- [ ] Provide copy-paste health checks:
  - `curl http://localhost:8001/api/health`
  - `curl -I http://localhost` (nginx)
  - `supervisorctl status`
  - MongoDB connectivity check.

---

## 3) Next Actions (Updated)

### Immediate Next (P0)
1) Finalize production dependencies:
   - Remove `emergentintegrations` from backend requirements.
   - Make AI feature optional (`ANTHROPIC_API_KEY`).
2) Fix frontend build deterministically (zxing + ajv).
3) Produce **FINAL deployment doc + modular scripts**, tested on Ubuntu 24.04 LTS.

### Optional / Future (P1)
1) TD-008: migrate object storage from local to S3/R2/Cloudflare.
2) Standardize deployment using Docker Compose (optional).

---

## 4) Success Criteria (Updated)

### Existing success criteria (met)
- Semua fitur Portfolio/CaseStudies/Products + CMS block builder berjalan. ✅
- UI/UX Overhaul 2026 tercapai. ✅
- Demo parity + Garment serial demo stable. ✅

### Phase 21B success criteria (FINAL)
- Client bisa mengisi assessment dengan UX setara KN3 + backend endpoints existing. ✅
- Comprehensive testing lulus. ✅

### Phase 22 (Deployment) success criteria
- Deployment di VPS Ubuntu 24.04 LTS berhasil dari kondisi kosong sampai aplikasi jalan.
- Backend `pip install -r requirements.txt` sukses tanpa package private.
- Frontend `npm ci`/`npm install` + `npm run build` sukses tanpa manual trial.
- Bisa jalan tanpa domain (akses via IP) menggunakan MongoDB local.
- (Opsional) Bisa enable HTTPS saat domain tersedia.

---

## Appendix — Files (Updated)

### Deployment & Ops docs
- ✅ `/app/DEPLOYMENT_HOSTINGER.md`
- ✅ `/app/QUICK_DEPLOY.md`
- ✅ `/app/DEPLOYMENT_COMMANDS.md`
- ✅ `/app/DEPLOYMENT_UBUNTU_24.04.md`
- ✅ `/app/BRANDING_UPDATE.md`

### Branding changes
- ✅ `frontend/public/index.html` (title Kubus + remove emergent scripts + manifest)
- ✅ `frontend/public/favicon.svg` + variants
- ✅ `frontend/public/manifest.json`

### Dependencies
- ⚠️ `backend/requirements.txt` still contains `emergentintegrations==0.1.2` (must be removed for VPS).
- ⚠️ `frontend/package.json` contains `@zxing/*` versions that can conflict; AJV stack needs pinning.

### Comparison reports
- `/app/memory/ASSESSMENT_COMPARISON_REPORT.md`
- `/app/memory/TEMPLATE_EDITOR_COMPARISON.md`
