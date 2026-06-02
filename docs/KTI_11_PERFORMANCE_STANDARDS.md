# KTI_11 — PERFORMANCE STANDARDS

---

## Frontend / Immersive
```
- Lazy-load semua R3F scene: React.lazy + <Suspense fallback>.
- Code-split per route (React.lazy untuk halaman portal/admin).
- Starfield/particle: batasi jumlah partikel; pakai instancing (drei <Points>/<Instances>).
- Dispose geometry/material & kill ScrollTrigger/Lenis pada unmount.
- Gambar: lazy-load + ukuran responsif + format modern (webp).
- prefers-reduced-motion -> matikan animasi berat.
- Mobile / low-power -> deteksi (lebar layar / hardwareConcurrency) -> fallback statis ringan (gradient + CSS, tanpa WebGL berat).
- Target: hero interaktif < 3s pada koneksi normal; tidak nge-freeze main thread.
```

## Backend / DB
```
- Index untuk field filter & sort (KTI_04).
- WAJIB pagination (default limit 20, max 100). JANGAN to_list(None).
- Hindari N+1 (pakai $lookup / batch).
- Projection: ambil field yang perlu saja untuk list.
- AI call (Claude): timeout + error handling; stream jika memungkinkan.
```
