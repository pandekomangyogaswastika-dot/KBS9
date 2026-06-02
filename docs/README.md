# Kubus Teknologi Indonesia — Platform Documentation

Dokumentasi & **governance system** untuk platform **Kubus Teknologi Indonesia (KTI)** — sebuah *immersive space-themed company website* + *multi-role application portal*.

> Governance ini diadaptasi dari best-practice knowledge base (referensi KN3) untuk menjaga **SSOT**, mencegah konflik data, duplikasi, dan error selama pengembangan jangka panjang oleh AI agent.

## Daftar Dokumen (baca berurutan)

| File | Deskripsi |
|------|-----------|
| `KTI_00_AGENT_QUICK_START.md` | **Entry point wajib** — 3-Gate, STOP&ASK, pitfalls, Definition of Done |
| `KTI_01_SYSTEM_OVERVIEW.md` | Domain bisnis, 2 dunia (Public + Portal), roles, modul |
| `KTI_02_TECHSTACK_STANDARDS.md` | Stack + coding patterns (R3F/GSAP/Lenis/i18n + FastAPI) |
| `KTI_03_SECURITY_STANDARDS.md` | JWT, RBAC, password, secrets |
| `KTI_04_DATABASE_STANDARDS.md` | SSOT, naming, schema template, bilingual storage |
| `KTI_05_API_STANDARDS.md` | Response envelope, status code, pagination, error code |
| `KTI_06_UIUX_STANDARDS.md` | **Space design system**, tokens, motion, bilingual UI |
| `KTI_07_QUALITY_LENSES.md` | 10 quality lenses (audit framework) |
| `KTI_08_DEV_PROTOCOLS.md` | Workflow, decision authority, doc maintenance |
| `KTI_09_NAVIGATION_MAP.md` | **Master nav SSOT** — routes per role |
| `KTI_10_TESTING_STANDARDS.md` | Testing approach + data-testid policy |
| `KTI_11_PERFORMANCE_STANDARDS.md` | 3D/WebGL perf, lazy load, pagination |
| `KTI_12_AI_INTEGRATION.md` | Claude (Emergent LLM) integration + grounding |
| `KTI_13_ASSESSMENT_MODULE.md` | Assessment (Discovery) module spec — template-driven |

## Memory Layer (`/app/memory/`)
- `PRD.md` — feature history + backlog (SSOT produk)
- `TECH_DECISIONS.md` — architectural decisions log
- `SESSION_LOG.md` — per-session work log
- `SESSION_HANDOFF.md` — state for next session/agent
- `test_credentials.md` — credentials for testing

## SSOT Registry
- `/app/ENTITY_REGISTRY.md` — daftar otoritatif SEMUA MongoDB collection

## Automation Scripts (`/app/scripts/`)
- `load_context.sh` — snapshot kondisi sistem (jalankan di awal sesi)
- `validate_compliance.py` — cek compliance (jalankan sebelum mark DONE)
- `check_nav_map.py` — validasi navigasi vs KTI_09

## Arsitektur Singkat
```
[ Browser ]
   |  (immersive React: R3F + GSAP + Lenis + i18n)
[ React 19 + Tailwind + shadcn/ui ]
   |  REST /api/*  (JWT + RBAC)
[ FastAPI + Pydantic + Motor ]
   |
[ MongoDB ]  +  [ Claude via Emergent LLM ]
```
