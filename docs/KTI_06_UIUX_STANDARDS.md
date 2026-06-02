# KTI_06 — UI/UX STANDARDS
## The Kubus Universe — Space Design System

> Detail final color/typography/motion akan diperkuat oleh design_agent (design_guidelines.md). Dokumen ini = aturan dasar yang tidak boleh dilanggar.

---

## Konsep
Immersive **space journey** (referensi UX: oryzo.ai). Pengunjung "diluncurkan" lalu menjelajahi galaksi Kubus. Tiap section = benda langit. Scroll-driven cinematic, seamless, depth & parallax.

---

## Color Tokens (CSS variables)
```css
:root {
  --space-void:    #05060A;  /* base background terdalam */
  --space-deep:    #0B0D17;  /* panel/surface gelap */
  --space-surface: #141728;  /* card surface */
  --kti-purple:    #4F3E97;  /* primary deep */
  --kti-indigo:    #7C68E1;  /* secondary / cahaya */
  --kti-teal:      #73D1AD;  /* accent / aurora / sinyal */
  --kti-text:      #E8EAF2;  /* teks utama di gelap */
  --kti-text-dim:  #9AA0B5;  /* teks sekunder */
  --kti-gradient:  linear-gradient(135deg, #4F3E97 0%, #7C68E1 55%, #73D1AD 100%);
}
```
LARANGAN: JANGAN pakai background transparan dengan teks gelap. Default tema = dark space; pastikan kontras AA.

---

## Typography
- Display/Heading: font geometric/space modern (mis. "Space Grotesk" / "Sora").
- Body: font sans bersih (mis. "Inter" / "Figtree").
- Hierarki jelas, letter-spacing rapi untuk heading besar.

---

## Motion Principles
```
- Smooth scroll (Lenis) + GSAP ScrollTrigger untuk reveal/pin.
- Easing halus (power2/expo), durasi 0.6-1.2s untuk scene besar.
- Micro-interaction (Framer Motion) untuk button/card hover (magnetic, glow).
- Parallax depth: starfield bergerak lebih lambat dari konten.
- WAJIB: hormati prefers-reduced-motion -> matikan animasi berat, sajikan statis.
- WAJIB: fallback mobile/low-power -> kurangi partikel/disable heavy 3D.
```

---

## Motif Brand
- Emblem heksagon "K" sebagai motif berulang (3D crystal di hero, ikon nav, divider).
- Aurora gradient (purple->indigo->teal) untuk highlight & CTA.
- Starfield + nebula sebagai latar konsisten.

---

## Component States (WAJIB lengkap — LENS 8)
Setiap data view: **loading** (skeleton), **empty** (ikon+pesan+aksi), **error** (pesan+retry), **success** (toast). Konfirmasi untuk aksi destruktif. Touch target >= 44px.

---

## Bilingual UI
- Toggle ID/EN di header (persist di localStorage `kti_locale`, default `id`).
- UI strings via react-i18next (`t('key')`).
- Konten dinamis pilih `field[locale]` dengan fallback `field.id`.
- Semua teks baru WAJIB ada di `i18n/locales/id.json` + `en.json`.

---

## data-testid
Setiap elemen interaktif WAJIB `data-testid` terdaftar di `constants/testIds/`. Format: `{area}-{element}-{action}` (mis. `nav-services-link`, `contact-form-submit`).
