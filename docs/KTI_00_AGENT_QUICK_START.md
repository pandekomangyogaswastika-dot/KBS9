# KTI_00 — AGENT QUICK START
## Kubus Teknologi Indonesia Platform — Mandatory Entry Point

**WAJIB DIBACA PERTAMA SEBELUM MELAKUKAN APAPUN**

---

## STOP — BACA INI DULU

Urutan wajib saat memulai/melanjutkan sesi:
```
1. KTI_00_AGENT_QUICK_START.md   <- File ini
2. KTI_01_SYSTEM_OVERVIEW.md     <- Domain & 2 dunia
3. /app/memory/PRD.md            <- Apa yang sudah ada
4. /app/plan.md                  <- Task & fase aktif
5. /app/ENTITY_REGISTRY.md       <- SSOT collection sebelum buat fitur
6. KTI_09_NAVIGATION_MAP.md      <- Sebelum tambah halaman/menu
```
Jalankan juga: `bash /app/scripts/load_context.sh` untuk snapshot kondisi sistem.

---

## 3-GATE DEVELOPMENT SYSTEM

### GATE 1 — PRE-CODE
```
[] Sudah baca PRD.md + plan.md (tahu fase & task aktif)?
[] Sudah cek fitur ini SUDAH ADA? (grep routers/, find components/)
[] Sudah cek collection di ENTITY_REGISTRY.md (jangan buat duplikat)?
[] Sudah tentukan posisi di Navigation Map (KTI_09)?
[] Konten translatable? siapkan struktur bilingual {id, en} (KTI_04)
[] Perlu konfirmasi user? (cek STOP & ASK)
```

### GATE 2 — DURING CODE
```
[] Ikut Tech Stack patterns (KTI_02)?
[] Ikut Security (KTI_03) + API (KTI_05) + DB (KTI_04)?
[] File size: React/JSX <= 500 baris, Python router <= 800 baris?
[] Field wajib ada (id UUID, created_at/updated_at UTC, created_by)?
[] data-testid di semua elemen interaktif?
[] Downstream impact sudah dihandle (mis. hapus project -> milestone)?
```

### GATE 3 — POST-CODE (sebelum DONE)
```
[] python3 /app/scripts/validate_compliance.py -> 0 FAIL?
[] testing_agent_v3 dipanggil & semua bug difix?
[] Linter bersih (ruff backend + eslint frontend)?
[] PRD.md + SESSION_LOG.md + plan.md diupdate?
[] Navigation Map diupdate jika ada halaman/menu baru?
[] ENTITY_REGISTRY.md diupdate jika ada collection baru?
```

---

## STOP & ASK TRIGGERS
```
CRITICAL (SELALU tanya user):
  - Drop/migrate MongoDB collection
  - Hapus/rename API endpoint (breaking change)
  - Ubah auth/authorization flow
  - Tambah dependency baru (pip/yarn)
  - Restructure folder/module besar
  - Tambah menu/section di luar Navigation Map

CONFIRMATION (tanya jika ragu):
  - Refactor file >500 baris
  - Ubah shared utility/helper
  - Tambah portal/section baru
  - Ubah schema collection yang sudah ada data

AUTO-EXECUTE (tidak perlu tanya):
  - Fix bug + regression test
  - Tambah data-testid / loading-error-empty state
  - Performance & styling improvement (dalam design system)
  - Tambah unit test
```

---

## TOP PITFALLS — JANGAN DIULANG
```
1. Buat fitur tanpa cek existing code  -> Code Discovery dulu
2. Buat collection baru untuk entity yang sudah ada -> cek ENTITY_REGISTRY
3. Field contextual tidak lengkap -> Entity Completeness (KTI_04)
4. Tambah menu tanpa Navigation Map -> Navigation First (KTI_09)
5. Monster files -> split sejak awal
6. Skip testing lalu klaim DONE -> testing_agent_v3 WAJIB
7. Lupa update PRD/plan -> dokumentasi = bagian task
8. Hardcode id/secret/URL -> selalu dari env/token
9. Konten 1 bahasa saja -> SEMUA konten translatable wajib {id, en}
10. 3D berat tanpa fallback -> wajib reduced-motion & mobile fallback (KTI_11)
```

---

## LANGUAGE RULE
```
Komunikasi dengan user        -> BAHASA INDONESIA
Kode & variabel               -> English (snake_case Py, camelCase JS)
UI labels                     -> Bilingual (ID default + EN), via i18n
Konten dinamis (CMS)          -> Bilingual {id, en} di database
Error message ke user         -> Mengikuti locale aktif
Log internal                  -> English
```

---

## DEFINITION OF DONE
```
[] Gate 1, 2, 3 passed
[] validate_compliance.py -> 0 FAIL
[] testing_agent_v3 dipanggil & semua bug difix
[] Linter clean
[] Screenshot/curl verified
[] PRD.md + SESSION_LOG.md + plan.md diupdate
[] Tidak ada TODO/FIXME/console.log/print debug tersisa
```
