# KTI_07 — QUALITY LENSES (Audit Framework)

Gunakan untuk self-review sebelum mark DONE. Minimum grade **B** untuk dianggap selesai.

```
LENS 1  Readability     : nama jelas, fungsi pendek, komentar jelaskan WHY
LENS 2  Architecture    : SSOT, separation of concerns, no circular import, DRY
LENS 3  Data Integrity  : operasi atomik, validasi di API, no orphan, soft-delete
LENS 4  Error Handling  : try-except, pesan user-friendly, error/empty/loading state
LENS 5  Performance     : index, no N+1, pagination, lazy-load 3D & image
LENS 6  Security        : no hardcoded secret, RBAC, validasi input, JWT
LENS 7  Testability     : data-testid lengkap, side-effect terisolasi
LENS 8  UX              : loading/empty/error/success state, konfirmasi destruktif, mobile, bilingual
LENS 9  Maintainability : no magic number, config externalized, dokumentasi update
LENS 10 Business Value  : sesuai PRD, solve real problem, tidak duplikat
```

Scoring per lens: Pass / Partial / Fail.
Grade: A+ (10 Pass) · A (8-9 Pass) · B (6-7 Pass, no Fail) · C (5 Pass, max 2 Fail) · D/F (kurang).

BLOCKER (wajib fix sebelum DONE): Fail di LENS 3 (Data Integrity), LENS 5 (Performance kritis), atau LENS 6 (Security).
