# KTI_01 — SYSTEM OVERVIEW
## Kubus Teknologi Indonesia — Business Domain & Scope

---

## Tentang Perusahaan
**Kubus Teknologi Indonesia** = perusahaan **IT Solutions**. Website ini bukan sekadar company profile, tapi **immersive experience** (tema **Space / Antariksa**) + **platform aplikasi multi-peran**.

Referensi UX: oryzo.ai (scroll-driven cinematic, award-grade). Konsep visual: perjalanan menjelajahi "Kubus Universe".

**Brand colors** (dari logo, gradient diagonal):
- Primary deep: `#4F3E97` (ungu) | Secondary: `#7C68E1` (indigo) | Accent: `#73D1AD` (teal)
- Base ruang angkasa: `#05060A` (near-black)

**Layanan (service categories):** Custom Software/ERP/WMS, Web & Mobile App, Cloud/DevOps/Infra, AI/Data/Automation, IoT/RFID, UI/UX & Product Design, IT Consulting & System Integration.

---

## DUA DUNIA

### Dunia 1 — Public Immersive Website (tanpa login)
Space-journey, bilingual (ID/EN). Section: Hero (Launch), About (Origin/visi-misi), Services (Constellations), Tech Stack (The Engine), Cases (Explored Worlds — studi kasus mendalam), Team (The Crew), Clients (Star Map), Blog, Career, Contact (Mission Control), Assessment (intake), AI Solution Advisor.

### Dunia 2 — Application Portal (di balik login)
- **Client Portal:** dashboard, timeline project, dokumen/deliverables, cases, approval/feedback, invoice/billing, chat dengan tim, AI assistant.
- **Staff Portal:** kelola project & milestone, dokumen, klien, assessment, chat.
- **Admin / Advanced CMS:** kelola semua konten (bilingual), user management (buat akun staff & client), project management, leads, assessment templates, blog, career, settings.

---

## ROLES (RBAC)
```
visitor   : publik, assessment via token, AI advisor publik
client    : akses portal klien (HANYA dibuat oleh staff/admin)
staff     : kelola project, milestone, klien, assessment
admin     : full akses + CMS + user management
```
TIDAK ada self-registration untuk client. Akun dibuat staff/admin.

---

## MODUL & DOMAIN PREFIX (untuk collection & API)
```
system_*      auth, users, settings
cms_*         services, cases, team, clients, tech, blog, careers, pages
crm_*         leads (kontak + assessment-derived)
assessment_*  templates, sessions, answers, attachments
pm_*          projects, milestones, documents, approvals
billing_*     invoices
chat_*        threads, messages
ai_*          conversations (advisor publik + portal)
audit_*       audit logs
```

---

## ROADMAP FASE (SSOT operasional = /app/plan.md)
```
Fase 0  Foundation (governance + skeleton)                          <- selesai (review)
Fase 1  Core POC (Claude integration + immersive 3D/scroll viability)
Fase 2  Public Immersive Website (semua section, bilingual, placeholder)
Fase 3  Auth & RBAC + Advanced CMS Admin
Fase 4  Assessment Module (template-driven) + Leads
Fase 5  Client Portal (timeline, dokumen, cases, approval, invoice, chat)
Fase 6  Staff Portal & Project Management
Fase 7  AI Discussion (Claude) publik + portal
Blog & Career: list publik dibangun di Fase 2, editor CMS di Fase 3.
```
Tiap fase diakhiri testing end-to-end (testing_agent_v3) sebelum lanjut.
Detail user stories & exit criteria tiap fase ada di /app/plan.md.
