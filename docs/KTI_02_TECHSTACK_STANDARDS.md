# KTI_02 — TECHSTACK STANDARDS

---

## Stack Resmi
```
FRONTEND
  React 19 + react-router-dom 7
  TailwindCSS 3 + shadcn/ui (Radix) + lucide-react
  Framer Motion (UI micro-interaction)
  three (3D hero/scenes) \u2014 IMPERATIF, BUKAN React Three Fiber (lihat catatan kritis)
  gsap + ScrollTrigger (scroll-driven cinematic)
  lenis (smooth scroll)
  react-i18next + i18next (bilingual UI strings)
  axios + @tanstack/react-query (data fetching/cache)
  Build: CRACO (alias '@/' -> src/)

BACKEND
  FastAPI + Pydantic v2 + Motor (async MongoDB)
  Auth: pyjwt / python-jose + passlib[bcrypt]
  PDF: reportlab (assessment export)
  AI: emergentintegrations (Claude via EMERGENT_LLM_KEY)
  Upload: python-multipart

DB: MongoDB (UUID v4 ids, timezone-aware ISO timestamps)
```

Dependency baru = STOP & ASK. Update via `pip install ... && pip freeze > requirements.txt` (backend) atau `yarn add ...` (frontend). JANGAN pakai npm.

---

## File Size Limits
```
React component (.jsx/.js)  : <= 500 baris  (split jika mendekati)
Python router               : <= 800 baris
Utility/helper              : <= 300 baris
CSS                         : <= 400 baris
```

---

## Struktur Folder
```
backend/
  server.py                 # app + router registration + middleware
  db.py                     # Motor client + get_db()
  core_utils.py             # response helpers, serialize_doc, now_iso, uuid
  dependencies.py           # auth deps (get_current_user, require_role)
  schemas.py                # Pydantic models (shared)
  routers/                  # 1 file per domain (auth, services, cases, ...)
  services/                 # business logic (assessment_questions, ai_service, pdf, ...)

frontend/src/
  App.js                    # router root
  i18n/                     # i18next config + locales (id.json, en.json)
  lib/                      # apiClient, utils
  context/                  # AuthContext, LocaleContext
  components/               # shared + ui/ (shadcn)
  components/three/         # R3F scenes (Starfield, HexCrystal, ...)
  features/                 # per-domain feature folders (public/, portal/, admin/, assessment/)
  constants/testIds/        # data-testid registry
```

---

## Patterns Wajib

### Backend — serialize MongoDB doc (cegah _id & datetime error)
```python
def serialize_doc(doc: dict) -> dict:
    if not doc: return doc
    doc.pop("_id", None)
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc
```
Selalu simpan datetime sebagai `.isoformat()` string. Selalu UUID v4 untuk `id` (BUKAN ObjectId).

### Frontend — apiClient
```js
import axios from 'axios';
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('kti_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
```
SEMUA endpoint backend di-prefix `/api`. JANGAN hardcode URL — pakai `REACT_APP_BACKEND_URL`.

### 3D / Animation  (CATATAN KRITIS \u2014 WAJIB)
- **JANGAN pakai React Three Fiber / drei.** Babel plugin visual-edits (aktif di dev preview) menyuntik atribut `x-line-number` dll ke SEMUA elemen JSX termasuk three-element R3F (`<mesh>`, `<Float>`), lalu R3F applyProps crash (`Cannot set "x-line-number"`). Terbukti di Fase 1 POC.
- **Pakai Three.js IMPERATIF**: logika scene di `lib/spaceScene.js` (plain three, tanpa JSX three-element), di-mount ke `<canvas ref>` lewat wrapper tipis (`components/three/*.jsx`) dengan `requestAnimationFrame` loop + cleanup (`dispose()` geometry/material/renderer, `cancelAnimationFrame`).
- Wrapper di-`lazy()` + `<Suspense>` agar three keluar dari main bundle.
- GSAP ScrollTrigger + Lenis (DOM-based, aman) di-cleanup pada unmount (`ctx.revert()`, `lenis.destroy()`, kill ScrollTrigger). Lenis raf -> `lenis.raf(time*1000)` via `gsap.ticker`.
- Wajib hormati `prefers-reduced-motion` (fallback statis gradient) + low-power (kurangi partikel) \u2014 KTI_11.
