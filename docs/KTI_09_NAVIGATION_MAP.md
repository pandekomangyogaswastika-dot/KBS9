# KTI_09 — NAVIGATION MAP (Master SSOT)

> Sebelum menambah halaman/menu APAPUN, update dokumen ini dulu (Navigation First Policy). Validasi dengan `python3 /app/scripts/check_nav_map.py`.

---

## PUBLIC (tanpa login) — bilingual, immersive
```
/                 Home (single-page immersive scroll):
                    #launch (Hero)  #origin (About)  #constellations (Services)
                    #engine (Tech Stack)  #worlds (Cases teaser)  #crew (Team)
                    #starmap (Clients)  #mission (Contact CTA)
/services         List services (Constellations)        testid: nav-services
/services/:slug   Service detail
/cases            Cases list (Explored Worlds)          testid: nav-cases
/cases/:slug      Case study detail (dive-in)
                  └─ Tombol "Coba Demo" jika demo_enabled=true pada case
/tech             Tech Stack (The Engine)               testid: nav-tech
/team             Team (The Crew)                       testid: nav-team
/blog             Blog list                             testid: nav-blog
/blog/:slug       Blog post
/career           Career list                           testid: nav-career
/career/:slug     Job detail
/contact          Contact (Mission Control)             testid: nav-contact
/assessment       Assessment intro / start
/assessment/:token  Assessment fill (klien, no login)
/faq              FAQ halaman publik (bilingual, accordion per kategori)  [Fase 19C]
/pricing          Paket & harga layanan (tier cards)                      [Fase 19D]
/about            Tentang Kubus (story/mission/values)                    [Fase 19E]
/resources        Pusat sumber daya / unduhan                             [Fase 19F]
/resources/:slug  Detail sumber daya
/privacy-policy   Kebijakan Privasi                                       [Fase 19B]
/terms-of-service Syarat & Ketentuan                                      [Fase 19B]
+ AI Solution Advisor : floating widget (semua halaman publik)
+ Header: logo, nav links, language toggle (ID/EN), "Client Login" button
```

## DEMO SANDBOX (tanpa login, akses via session token) — [IMPLEMENTED Fase 16]
```
/demo/kn3?session=:id    WMS Demo Sandbox (KN3 — Smart Warehouse)
                          └─ DemoPage → validasi session → KN3DemoApp
                          └─ DemoBanner: MODE DEMO label + sisa waktu + exit + CTA konsultasi
                          └─ Full KN3 WMS interface: Sales POS, Orders, WMS, Admin
                          └─ Guided Tour auto-start
                          └─ Session TTL: 90 menit, data isolated per MongoDB database
Note: /demo/* adalah lazy-loaded route (tidak memuat JS extra kecuali diakses)
```

## PORTAL (login) — /portal
```
/portal/login                     Login (semua role)

CLIENT (role: client)
/portal/dashboard                 Ringkasan project
/portal/projects                  List project klien
/portal/projects/:id              Detail + timeline + milestone + dokumen + approval
/portal/cases                     Cases terkait klien
/portal/invoices                  Invoice & status bayar
/portal/messages                  Chat dengan tim
/portal/assistant                 AI assistant (grounded)

STAFF (role: staff)
/portal/staff/projects            Project yang dikelola
/portal/staff/projects/:id        Kelola milestone/dokumen/approval
/portal/staff/clients             Daftar klien
/portal/staff/assessments         Kelola assessment session
/portal/staff/messages            Chat dengan klien

ADMIN (role: admin & staff) — Advanced CMS + Media Library  [IMPLEMENTED Fase 3+]
/portal/admin                     Admin dashboard (stats)              testid: admin-nav-dashboard
/portal/admin/leads               Leads/CRM (admin+staff)              testid: admin-nav-leads
/portal/admin/demo-sessions       Demo session monitoring              testid: admin-nav-demo-sessions  [Fase 16]
/portal/admin/media               Media Library (upload/folders)       testid: admin-nav-media
/portal/admin/cms/services        CRUD services (bilingual)            testid: admin-nav-cms-services
/portal/admin/cms/cases           CRUD cases (+ demo config fields)    testid: admin-nav-cms-cases
/portal/admin/cms/tech            CRUD tech stack                      testid: admin-nav-cms-tech
/portal/admin/cms/team            CRUD team                            testid: admin-nav-cms-team
/portal/admin/cms/clients         CRUD clients                         testid: admin-nav-cms-clients
/portal/admin/cms/blog            CRUD blog                            testid: admin-nav-cms-blog
/portal/admin/cms/careers         CRUD careers                         testid: admin-nav-cms-careers
/portal/admin/cms/home-blocks     Home sections (process/tiers/...)    testid: admin-nav-cms-home
/portal/admin/settings            Site settings (hero/about/contact)   testid: admin-nav-settings
/portal/admin/assessments         Assessment (Discovery) sessions       testid: admin-nav-assessments  [Fase 4]
/portal/admin/analytics           Analytics dashboard                  testid: admin-nav-analytics   [Fase 10]
/portal/admin/seo                 SEO dashboard + AI generator         testid: admin-nav-seo         [Fase 11]
/portal/admin/notifications       Notifikasi realtime (bell + history) testid: admin-nav-notif       [Fase 15]
/portal/admin/users               User management (admin only)         testid: admin-nav-users
```

## CMS Cases — Demo Config Fields (Fase 16)
```
cms_cases schema tambahan:
  demo_enabled          boolean  — toggle aktifkan/matikan tombol demo
  demo_slug             string   — identifier app demo (contoh: "kn3")
  demo_label_id         string   — label tombol bahasa Indonesia (contoh: "Coba Demo WMS")
  demo_timeout_minutes  number   — durasi sesi demo (default: 90)
```

## Anti-Pattern Navigasi
- Maksimum kedalaman 4 level. Tidak ada label menu duplikat. Tiap nav item punya data-testid `nav-*`.
- Route `/demo/*` adalah public route tanpa auth — gunakan session token dari URL param.
- Konten user-facing single-language (WAJIB {id, en})
