# KTI_08 — DEVELOPMENT PROTOCOLS

---

## Workflow per Fase
1. Baca PRD.md + plan.md (fase aktif) + ENTITY_REGISTRY.md.
2. Gate 1 (Pre-Code) -> implement -> Gate 2 (During) -> Gate 3 (Post).
3. Akhiri tiap fase dengan testing_agent_v3 + fix semua bug.
4. Update PRD.md, SESSION_LOG.md, plan.md, ENTITY_REGISTRY.md, KTI_09.

## Decision Authority
```
AUTO-EXECUTE : bugfix+regression, data-testid, loading/error/empty state,
               perf & styling (dalam design system), unit test.
STOP & ASK   : drop/migrate collection, hapus/rename endpoint, ubah auth,
               tambah dependency, restructure besar, menu di luar Nav Map.
```

## Commit Message (jika commit)
```
feat: tambah modul services CMS (bilingual)
fix: perbaiki race condition approval milestone
refactor: split App.js < 500 baris
docs: update KTI_09 navigation map
```

## Doc Maintenance Triggers
```
PRD.md            -> fitur selesai / backlog berubah
SESSION_LOG.md    -> akhir sesi
TECH_DECISIONS.md -> keputusan arsitektur
KTI_09 Nav Map    -> halaman/menu baru
ENTITY_REGISTRY   -> collection baru
plan.md           -> status task / fase berubah
```

## Definition of Done -> lihat KTI_00.
