# PRD — Kubus Teknologi Indonesia Platform

**Produk:** Immersive space-themed company website + multi-role application portal untuk **Kubus Teknologi Indonesia** (perusahaan IT solutions).

**Status:** Phase 0–16 SELESAI ✅. Platform lengkap: public website sinematik, multi-role portal (admin/staff/client), AI Advisor Claude, assessment module, e-sign, analytics, SEO AI, email notifications, real-time WebSocket notifications, dan Demo Sandbox Engine (pilot KN3 WMS).

---

## Visi
Website award-grade (referensi UX: oryzo.ai) dengan tema **Space**: bukan sekadar sumber informasi, tapi pengalaman menjelajahi "Kubus Universe". Sekaligus platform: CMS canggih, portal klien & staff, assessment intake, AI advisor (Claude), dan demo interaktif produk.

## Pengguna & Roles
- **Visitor** — jelajah website, isi assessment (via token), chat AI advisor, coba demo produk (gate form).
- **Client** — portal: dashboard, timeline project, dokumen, cases, approval, invoice, chat, AI assistant.
- **Staff** — kelola project/milestone/dokumen, klien, assessment.
- **Admin** — advanced CMS, user management, project management, leads, analytics, SEO, notifications, demo config.

## Keputusan Produk (dari diskusi user)
- Bahasa: **Bilingual ID/EN** (toggle, default ID).
- 3D/animasi: **Balanced** (3D di hero/section kunci + partikel ringan + CSS), wajib fallback & reduced-motion.
- Konten awal: **placeholder profesional** (diganti user nanti).
- Auth: **email+password**, RBAC; client/staff dibuat oleh admin/staff (no self-register).
- Assessment: **template-driven** dikelola CMS; seed 1 template "IT Solution Discovery".
- AI: **Claude** (Emergent LLM), **grounded** ke konten Kubus; dua permukaan (publik + portal).
- Demo Sandbox: **full sandbox** — user isi gate form → sesi terisolasi 90 menit → akses demo produk sebagai admin. Pilot: KN3 WMS.

## Roadmap (SSOT operasional = /app/plan.md)
Fase 0 Foundation → 1 Core POC (Claude + immersive 3D) → 2 Public Website → 3 Auth+CMS → 4 Assessment → 5 Client Portal → 6 Staff/PM → 7 AI → 9 E-Sign → 10 Analytics → 11 SEO AI → 12 Email/Integrations → 13 Performance → 14 Search → 15 Realtime Notif → 16 Demo Sandbox.

---

## Feature Log
| Tanggal | Fase | Fitur | Status |
|---------|------|-------|--------|
| - | 0 | Governance docs (KTI_00–13), memory layer, ENTITY_REGISTRY, scripts | done ✅ |
| - | 1 | Core POC: Claude (grounded, 3/3) + immersive Three.js + GSAP/Lenis + fallback | done ✅ |
| - | 2 | Public Immersive Website: hero 3D, semua section, bilingual ID/EN, 10 halaman, contact→crm_leads, AI Advisor | done ✅ |
| - | 2.5 | Cinematic redesign V2 (scroll-scrub hero, sticky services, gauges, cases rail) | done ✅ |
| - | 3 | Auth & RBAC (JWT), Media Library (local storage TD-008), Advanced CMS (schema-driven CRUD) | done ✅ |
| - | 4 | Assessment Module (token-based, template-driven, PDF export) | done ✅ |
| - | 5/6 | Client Portal + Staff Portal + Project Management (milestone, dokumen, approval) | done ✅ |
| - | 7 | AI Assistant Claude (publik + portal, grounded) | done ✅ |
| - | 9 | E-Sign + Audit Trail (PDF certificate, approval_signatures, approval_audit_logs) | done ✅ |
| - | 10 | Analytics Dashboard (traffic, leads, projects, revenue charts) | done ✅ |
| - | 11 | AI Smart SEO (foundation, AI generator, dashboard, visual) | done ✅ |
| - | 12 | Email Notifications + Integration Settings (SMTP/provider config) | done ✅ |
| - | 13 | Performance Optimization (cache, GZip, lazy load, compression) | done ✅ |
| - | 14 | Advanced Search Global (RBAC-safe, multi-entity) | done ✅ |
| - | 15 | Real-time Notifications WebSocket (bell, toast, multi-portal, event triggers) | done ✅ |
| - | 16 | Demo Sandbox Engine (KN3 WMS pilot: gate form, session isolation, guided tour, DemoBanner) | done ✅ |
| 2026-06 | 17 | Post-Deploy Bug Fixes & New Features (see changelog below) | done ✅ |

---

## Changelog - Phase 20 (Juni 2026)

### New Features — PDF Profesional & CMS PDF Config
- **PDF Redesign (Bold Corporate)**: Total redesign `assessment_pdf.py` menggunakan `BaseDocTemplate`:
  - Cover page penuh (dark background #0D0F1C, logo, judul, info klien, progress bar)
  - Tabel ringkasan semua domain (completion %, skor, maturitas)
  - Per-domain sections dengan header bar berwarna + tabel Q&A berborder
  - Skor & maturitas per domain (rata-rata skala 1–5 → Awal/Berkembang/Terdefinisi/Terkelola/Optimal)
  - Footer halaman dengan nomor halaman, nama perusahaan, teks rahasia
  - Conditional sections (sembunyikan domain kosong bila dikonfigurasi)
- **CMS Admin PDF Settings** (`/portal/admin/pdf-settings`):
  - Konfigurasi branding: company name, tagline, logo URL, brand color, accent color
  - Toggle layout: show_cover, show_summary, show_empty_domains, show_notes, show_scoring, show_attachments
  - Custom footer text
  - **Live Preview** via iframe embed (generate PDF langsung di browser)
  - Session picker untuk memilih sesi preview
  - Simpan ke `cms_settings` collection (key: `pdf_config`)
- **Backend**: New router `routers/assessment_pdf_config.py` (`GET/PUT /api/admin/pdf-config`, `GET /api/admin/pdf-config/preview`)
- **Nav**: Sidebar admin ada menu "PDF Settings" di section CRM

---

## Changelog - Phase 19 (Juni 2026)

### Bug Fixes
- **P0 Demo Flow "Sesi Tidak Valid"**: DemoConfigPage ExternalLink button sekarang mengarah ke `/cases/{slug}` (bukan `/demo/kn3` langsung tanpa session). Root cause: tombol membuka demo tanpa session ID.
- **DemoConfigPage API**: Endpoint difix dari `/admin/cases` → `/admin/cms/cases`.
- **AssessmentV2Taking routing**: App.js sekarang mengarah ke `AssessmentV2Taking` (bukan `AssessmentTaking` lama) untuk route `/portal/assessments/:sessionId`.

### New Features
- **Assessment PDF Export sebelum Submit**: `GET /api/assessment/sessions/{id}/export-pdf` tidak lagi memerlukan status "submitted" — bisa diunduh kapan saja (draft/in-progress).
- **Assessment Excel Export Jawaban**: `GET /api/assessment/sessions/{id}/export-answers-excel` — export semua pertanyaan + jawaban saat ini sebagai Excel yang bisa diisi offline.
- **Assessment Excel Import Jawaban**: `POST /api/assessment/sessions/{id}/import-answers-excel` — upload Excel yang sudah diisi → auto-fill semua jawaban ke sesi.
- **UI Tombol baru di AssessmentV2Taking**: Tombol PDF, Download Excel, Import Excel selalu terlihat di top bar. Import hanya aktif sebelum submit.
- **Module baru**: `backend/assessment_excel_answers.py` — logika generate/parse Excel untuk jawaban assessment.

---

## Changelog - Phase 18 (Juni 2026)

### Bug Fixes UI
- **LiveChatWidget z-index**: Fix duplicate `style` props (zIndex tertimpa background). Sekarang `zIndex: 99999` — selalu paling depan
- **HorizontalCasesRail**: Tambah `min-h-screen flex items-center py-8` saat `pinned` — cards sekarang ter-center secara vertikal di viewport, tidak lagi menempel di atas dengan empty space besar di bawah
- **Logo tidak hardcode**: `KubusMark` sekarang menerima prop `logoUrl` — PublicLayout pass `settings.logo_url` ke Navbar dan Footer. Fallback ke KTI_LOGO jika CMS kosong
- **Footer contact info**: Update via CMS API + seed default + startup migration:
  - Email: hello@kubusindonesia.com
  - Phone: +62899 3939 617  
  - Alamat: GoWork Space Lv. 3 Jl. Gatot Subroto No. 271, Bandung

---

### Bug Fixes
- **CMS Double Data**: System Recovery page + Dedup endpoint (hapus duplikat per collection berdasarkan slug/name/key)
- **Assessment [object Object]**: Fix `TemplateEditorV2.jsx` — extract string dari `template.description` dict  
- **ShowIfBuilder blank dropdown**: Fix type normalization (single_choice→select, multi_choice→multiselect)
- **Template tidak muncul di assign dropdown**: Hapus filter `.published` di `ClientDetailPage.jsx` agar semua template tampil
- **Home Sections kosong di CMS**: `seed_home_blocks_db` ditambahkan ke startup server (9 blocks)
- **Demo App Slug free text → dropdown**: `schemas.js` type diubah ke select + `FieldInput.jsx` support select type
- **Template published flag migration**: Migrasi di startup memastikan semua seeded templates `published: True`
- **Excel route ordering**: `/templates/excel-template` dipindah sebelum `/templates/{template_id}` di FastAPI

### New Features  
- **ERP & RFID Discovery Questionnaire** (KN3): Template 14 domain, 82 pertanyaan di-seed otomatis saat startup
- **Excel Import Assessment**: `POST /api/assessment/templates/import-excel` + tombol UI "Import Excel" + download "Template Excel"
- **System Recovery Page** (`/portal/admin/recovery`):
  - 16 CMS collections exportable sebagai ZIP/JSON
  - 3 strategi restore: add_missing, replace_all, replace_collection (DESTRUCTIVE)
  - Dedup data duplikat per collection
  - Backend: `/api/admin/recovery/{collections,export,import,dedup}`

---

## Backlog / Tier 2 (belum dikerjakan)
- Dark/Light theme toggle (persistent user preference).
- Multi-tenant / whitelabel per-client subdomain.
- Advanced analytics (funnels/cohort/retention).
- Mobile PWA.
- Payment gateway aktivasi (Midtrans/Xendit) — config sudah ada.
- Object storage migration (S3/R2/Cloudflare) — abstraksi sudah ada (TD-008).
- 4 demo repo lain (menunggu GitHub URL dari user).
- Admin demo monitoring page — built Phase 16 P3.
- **Assessment auto-save optimization (debounce 700ms + pendingRef pattern)** — P1, done ✅
- **SSL/HTTPS deploy script (`deploy/05-ssl.sh`)** — P1, done ✅

## Deployment Readiness (Juni 2026)
- **Tujuan:** Self-host KBS9 ke VPS Hostinger (Ubuntu 24.04) dari GitHub.
- **Selesai & teruji:**
  - `emergentintegrations` dihapus sebagai hard dependency. Modul baru `backend/llm_client.py` auto-pilih
    Anthropic SDK (ANTHROPIC_API_KEY, production) atau emergentintegrations (EMERGENT_LLM_KEY, dev).
    4 caller AI di-refactor (routers/ai.py, routers/seo_ai.py, ai_report_service.py, services/assessment_ai_report.py).
  - `anthropic==0.105.2` ditambah ke requirements.txt. Model: `claude-sonnet-4-6`.
  - File usang dihapus: `ai_report_service_production.py` + 6 file .md deployment duplikat.
  - Frontend build dikonfirmasi sukses via **yarn** (yarn.lock) — solusi error craco/ajv (yang muncul saat pakai npm).
  - Script deployment idempotent di `deploy/` (01..04 + deploy.sh) + `deploy/config.env.example`.
  - Backend production via systemd `kubus-backend` (uvicorn :8001) + Nginx (static frontend + proxy /api).
  - Regression test: `backend/tests/test_llm_client.py` (3 passed).
- **Cara pakai:** Save to GitHub → clone ke /opt/kubus di VPS → isi deploy/config.env → jalankan script 01-04.
- **Catatan:** AI nonaktif aman tanpa ANTHROPIC_API_KEY (situs tetap jalan, endpoint AI balas 503, bukan crash).
