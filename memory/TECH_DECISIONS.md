# TECH DECISIONS — Kubus Teknologi Indonesia

Log keputusan arsitektur penting (append-only).

---

### TD-001 — Stack immersive frontend
**Keputusan:** React 19 + **Three.js imperatif** (3D, BUKAN R3F — lihat TD-007) + GSAP/ScrollTrigger + Lenis (smooth scroll) + Framer Motion (micro-interaction) + react-i18next (bilingual).
**Alasan:** Reproduksi UX award-grade (oryzo.ai) dengan kontrol penuh; ekosistem matang di React.
**Konsekuensi:** Wajib lazy-load + fallback mobile/reduced-motion (KTI_11).

### TD-002 — Bilingual storage = nested locale object
**Keputusan:** Field konten user-facing disimpan `{ "id": "...", "en": "..." }` di DB; UI strings via i18next.
**Alasan:** SSOT 1 dokumen per entity, mudah CRUD di CMS, hindari duplikasi dokumen per bahasa.
**Konsekuensi:** Frontend pilih `field[locale]` fallback `field.id`.

### TD-003 — Auth JWT + RBAC, no self-register
**Keputusan:** JWT (HS256) + passlib bcrypt; role admin/staff/client; akun client/staff dibuat admin/staff.
**Alasan:** Permintaan user; kontrol akses ketat untuk portal B2B.

### TD-004 — AI = Claude via emergentintegrations
**Keputusan:** Claude (Anthropic) lewat EMERGENT_LLM_KEY; grounded ke konten CMS.
**Alasan:** Pilihan user; satu key universal untuk text gen.

### TD-007 — 3D pakai Three.js IMPERATIF, bukan React Three Fiber  (Fase 1 POC)
**Temuan:** Babel plugin visual-edits (aktif di dev preview, `@emergentbase/visual-edits`) menyuntik atribut `x-line-number`/`x-source-*` ke SEMUA elemen JSX. R3F (`<mesh>`, `<Float>`, `<Stars>`) mencoba apply atribut itu sebagai pierced-prop three → crash `R3F: Cannot set "x-line-number"` → seluruh scene gagal render (layar hitam + red overlay).
**Keputusan:** Semua scene 3D dibangun dengan **Three.js imperatif** (`lib/spaceScene.js`) lalu di-mount ke `<canvas ref>` via wrapper React tipis. Tidak memakai `@react-three/fiber`/`@react-three/drei`.
**Konsekuensi:** Robust di dev preview & production. Drei helper (Stars/Float) direplikasi manual (Points/oscillation). Library R3F/drei tetap ter-install namun tidak dipakai (boleh dibersihkan nanti).
**Verifikasi:** POC `/poc` render kristal heksagon + starfield, 0 page error; fallback reduced-motion (nebula statis) OK.

**UPDATE (2026-06-03)**: Pattern yang sama berlaku untuk dynamic JSX components. File yang menggunakan `const Component = MAP[type]; return <Component />` akan crash dengan babel plugin visual-edits.
**Solusi**: Refactor ke explicit conditional rendering dengan if-statements.
**Files Fixed**: 
- `components/content/BlocksRenderer.js` (critical)
- `components/NotificationBell.jsx` (preventive)
- `components/GlobalSearch.jsx` (preventive)
**Status**: ✅ RESOLVED. See `/app/TD-007_FIX_SUMMARY.md` for details.

### TD-005 — Assessment template-driven
**Keputusan:** Template dikelola admin (domain+pertanyaan bilingual), session per klien via UUID token tanpa login; seed template "IT Solution Discovery".
**Alasan:** Skalabel untuk berbagai jenis project; adopsi pola Discovery dari referensi.

### TD-006 — Governance KTI knowledge base
**Keputusan:** Adopsi sistem rules (KTI_00–13) + memory layer + scripts compliance.
**Alasan:** Permintaan user untuk fondasi yang mencegah error/SSOT kabur/duplikasi selama pengembangan panjang.

### TD-008 — Media storage = LOCAL-first via abstraksi (Fase 3, Sesi 005)
**Keputusan:** Media Library memakai interface `StorageBackend` dengan implementasi `LocalStorageBackend` (simpan ke `/app/backend/uploads`, serve via `GET /api/media/file/{id}` + HTTP Range untuk video). Env `STORAGE_BACKEND=local|object` (factory `get_storage()`), TIDAK hardcode. `ObjectStorageBackend` (S3-compatible via integration agent) disiapkan kemudian + `scripts/migrate_media_to_object.py`.
**Alasan:** Permintaan user — mulai lokal agar cepat, tetap mudah dipindah ke object storage tanpa ubah kode pemanggil.
**Konsekuensi/RISIKO:** Disk lokal EPHEMERAL saat deploy → WAJIB migrasi ke object storage sebelum production. Tipe didukung: image/video/pdf (limit per-tipe). Dipakai bersama oleh Media Library (CMS) & attachments Assessment (Fase 4).
