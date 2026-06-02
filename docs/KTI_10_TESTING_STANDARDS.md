# KTI_10 — TESTING STANDARDS

---

## Prinsip
- WAJIB panggil `testing_agent_v3` di akhir tiap fase / setelah fitur besar.
- Backend: test endpoint (curl/pytest) untuk CRUD, auth, RBAC, edge case.
- Frontend: testing agent (browser automation). Sediakan `data-testid` lengkap.
- SKIP test untuk: drag-and-drop, voice, kamera, dan animasi 3D murni (testing agent tidak bisa). Untuk 3D, cukup pastikan tidak crash & ada fallback.

## data-testid Policy
- Semua elemen interaktif (button, link, input, tab, card aksi) WAJIB `data-testid`.
- Terdaftar di `frontend/src/constants/testIds/`.

## Test Credentials
- Seed akun admin/staff/client; tulis di `/app/memory/test_credentials.md` agar testing agent bisa login.

## Definition of Tested
- Test report `/app/test_reports/iteration_X.json` dibaca; SEMUA bug (high->low) difix sebelum fase dianggap selesai.

## User Stories
- Tiap fase punya user stories di plan.md; testing agent memverifikasi tiap story, bukan hanya API.
