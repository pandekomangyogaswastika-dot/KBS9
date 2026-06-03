"""Seed konten placeholder profesional (bilingual {id, en}) untuk Public Website.
Idempotent: hanya insert jika collection kosong. Konten diganti user via CMS (Fase 3).
"""
from core_utils import new_id, now_iso


def _b(idv, en):
    return {"id": idv, "en": en}


SERVICES = [
    {"slug": "custom-software-erp", "icon": "Boxes", "category": "engineering", "order": 1, "featured": True,
     "title": _b("Custom Software, ERP & WMS", "Custom Software, ERP & WMS"),
     "summary": _b("Sistem bisnis end-to-end yang dirancang sesuai alur kerja unik perusahaan Anda.",
                   "End-to-end business systems engineered around your unique workflows."),
     "description": _b("Kami membangun ERP, WMS, dan platform internal yang menyatukan operasi, inventori, keuangan, dan produksi dalam satu sumber kebenaran. Arsitektur modular, skalabel, dan siap berkembang bersama bisnis Anda.",
                       "We build ERP, WMS, and internal platforms that unify operations, inventory, finance, and production into a single source of truth. Modular, scalable architecture that grows with your business.")},
    {"slug": "web-mobile-app", "icon": "Smartphone", "category": "engineering", "order": 2, "featured": True,
     "title": _b("Web & Mobile App Development", "Web & Mobile App Development"),
     "summary": _b("Aplikasi web dan mobile yang cepat, indah, dan berorientasi konversi.",
                   "Fast, beautiful, conversion-focused web and mobile applications."),
     "description": _b("Dari MVP hingga produk skala besar - React, React Native, dan Flutter dengan performa kelas dunia, desain immersive, dan pengalaman pengguna yang mulus di setiap perangkat.",
                       "From MVP to large-scale products - React, React Native, and Flutter with world-class performance, immersive design, and seamless UX across every device.")},
    {"slug": "cloud-devops", "icon": "Cloud", "category": "platform", "order": 3, "featured": True,
     "title": _b("Cloud, DevOps & Infrastructure", "Cloud, DevOps & Infrastructure"),
     "summary": _b("Infrastruktur yang andal, aman, dan otomatis di AWS, GCP, atau Azure.",
                   "Reliable, secure, automated infrastructure on AWS, GCP, or Azure."),
     "description": _b("CI/CD, containerization, observability, dan arsitektur cloud-native yang menekan biaya sekaligus meningkatkan uptime. Kami merancang fondasi yang tahan skala.",
                       "CI/CD, containerization, observability, and cloud-native architecture that lowers cost while improving uptime. We engineer foundations that scale.")},
    {"slug": "ai-data-automation", "icon": "BrainCircuit", "category": "intelligence", "order": 4, "featured": True,
     "title": _b("AI, Data & Automation", "AI, Data & Automation"),
     "summary": _b("Ubah data menjadi keputusan dengan AI, analitik, dan otomasi cerdas.",
                   "Turn data into decisions with AI, analytics, and intelligent automation."),
     "description": _b("Integrasi LLM, computer vision, predictive analytics, dan RPA untuk mengotomasi proses dan membuka wawasan baru dari data Anda.",
                       "LLM integration, computer vision, predictive analytics, and RPA to automate processes and unlock new insight from your data.")},
    {"slug": "iot-rfid", "icon": "Radio", "category": "platform", "order": 5, "featured": False,
     "title": _b("IoT & RFID Solutions", "IoT & RFID Solutions"),
     "summary": _b("Hubungkan dunia fisik dan digital dengan sensor, RFID, dan telemetri real-time.",
                   "Bridge physical and digital with sensors, RFID, and real-time telemetry."),
     "description": _b("Pelacakan aset, smart warehouse, dan monitoring real-time dengan jaringan IoT dan RFID yang terintegrasi penuh ke sistem bisnis Anda.",
                       "Asset tracking, smart warehouse, and real-time monitoring with IoT and RFID networks fully integrated into your business systems.")},
    {"slug": "ux-product-design", "icon": "PenTool", "category": "design", "order": 6, "featured": False,
     "title": _b("UI/UX & Product Design", "UI/UX & Product Design"),
     "summary": _b("Desain yang tidak hanya indah, tetapi terbukti meningkatkan hasil bisnis.",
                   "Design that is not only beautiful, but proven to move business outcomes."),
     "description": _b("Riset pengguna, design system, prototyping, dan desain interaksi immersive yang menciptakan pengalaman tak terlupakan dan konsisten lintas produk.",
                       "User research, design systems, prototyping, and immersive interaction design that create memorable, consistent experiences across products.")},
    {"slug": "it-consulting", "icon": "Network", "category": "advisory", "order": 7, "featured": False,
     "title": _b("IT Consulting & System Integration", "IT Consulting & System Integration"),
     "summary": _b("Strategi teknologi dan integrasi sistem yang menyatukan ekosistem digital Anda.",
                   "Technology strategy and system integration that unifies your digital ecosystem."),
     "description": _b("Arsitektur enterprise, integrasi API, migrasi sistem legacy, dan roadmap transformasi digital yang selaras dengan tujuan bisnis.",
                       "Enterprise architecture, API integration, legacy migration, and digital transformation roadmaps aligned to business goals.")},
]

TECH = [
    {"name": "React", "category": "Frontend", "order": 1},
    {"name": "Next.js", "category": "Frontend", "order": 2},
    {"name": "React Native", "category": "Mobile", "order": 3},
    {"name": "Flutter", "category": "Mobile", "order": 4},
    {"name": "Node.js", "category": "Backend", "order": 5},
    {"name": "FastAPI", "category": "Backend", "order": 6},
    {"name": "Go", "category": "Backend", "order": 7},
    {"name": "PostgreSQL", "category": "Data", "order": 8},
    {"name": "MongoDB", "category": "Data", "order": 9},
    {"name": "Redis", "category": "Data", "order": 10},
    {"name": "Kubernetes", "category": "Cloud", "order": 11},
    {"name": "Docker", "category": "Cloud", "order": 12},
    {"name": "AWS", "category": "Cloud", "order": 13},
    {"name": "TensorFlow", "category": "AI", "order": 14},
    {"name": "OpenAI / Claude", "category": "AI", "order": 15},
    {"name": "Kafka", "category": "Data", "order": 16},
]

CASES = [
    {"slug": "nusantara-textile-wms", "client_name": "PT Nusantara Tekstil", "order": 1,
     "industry": _b("Manufaktur Tekstil", "Textile Manufacturing"), "cover": "planet-indigo",
     "title": _b("Smart Warehouse & WMS Real-time", "Real-time Smart Warehouse & WMS"),
     "summary": _b("Transformasi gudang manual menjadi smart warehouse dengan RFID dan WMS real-time.",
                   "Transforming a manual warehouse into a smart warehouse with RFID and real-time WMS."),
     "challenge": _b("Pelacakan stok manual menyebabkan selisih inventori 12% dan keterlambatan pengiriman.",
                     "Manual stock tracking caused 12% inventory variance and shipping delays."),
     "approach": _b("Implementasi RFID gateway, WMS custom, dan dashboard real-time terintegrasi ERP.",
                    "Implemented RFID gateways, a custom WMS, and a real-time dashboard integrated with their ERP."),
     "solution": _b("Platform WMS cloud-native dengan pelacakan level item dan alur picking teroptimasi.",
                    "A cloud-native WMS platform with item-level tracking and optimized picking flows."),
     "impact": _b("Akurasi inventori naik ke 99,6% dan waktu fulfillment turun 38%.",
                  "Inventory accuracy rose to 99.6% and fulfillment time dropped 38%."),
     "results": [{"label": _b("Akurasi Inventori", "Inventory Accuracy"), "value": "99.6%"},
                 {"label": _b("Waktu Fulfillment", "Fulfillment Time"), "value": "-38%"},
                 {"label": _b("ROI", "ROI"), "value": "7 bln"}],
     "tech": ["FastAPI", "React", "MongoDB", "RFID", "Kubernetes"],
     "demo_enabled": True,
     "demo_slug": "kn3",
     "demo_label_id": "Coba Demo WMS Interaktif",
     "demo_label_en": "Try Interactive WMS Demo"},
    {"slug": "bank-digital-onboarding", "client_name": "Bank Sinar Digital", "order": 2,
     "industry": _b("Perbankan & Fintech", "Banking & Fintech"), "cover": "planet-teal",
     "title": _b("Onboarding Nasabah Digital dengan AI", "AI-powered Digital Customer Onboarding"),
     "summary": _b("Onboarding nasabah dari 3 hari menjadi 5 menit dengan eKYC dan AI.",
                   "Customer onboarding from 3 days to 5 minutes with eKYC and AI."),
     "challenge": _b("Proses onboarding manual lambat dan rawan fraud.", "Manual onboarding was slow and fraud-prone."),
     "approach": _b("eKYC berbasis computer vision, liveness detection, dan skoring risiko otomatis.",
                    "Computer-vision eKYC, liveness detection, and automated risk scoring."),
     "solution": _b("Aplikasi mobile dengan verifikasi identitas instan dan integrasi core banking.",
                    "A mobile app with instant identity verification and core-banking integration."),
     "impact": _b("Konversi naik 3,1x dan fraud turun 64%.", "Conversion up 3.1x and fraud down 64%."),
     "results": [{"label": _b("Waktu Onboarding", "Onboarding Time"), "value": "5 min"},
                 {"label": _b("Konversi", "Conversion"), "value": "3.1x"},
                 {"label": _b("Fraud", "Fraud"), "value": "-64%"}],
     "tech": ["React Native", "FastAPI", "TensorFlow", "AWS"],
     "demo_enabled": False},
    {"slug": "logistik-control-tower", "client_name": "TransLogistik Indonesia", "order": 3,
     "industry": _b("Logistik & Supply Chain", "Logistics & Supply Chain"), "cover": "planet-violet",
     "title": _b("Control Tower Logistik Real-time", "Real-time Logistics Control Tower"),
     "summary": _b("Visibilitas armada dan pengiriman nasional dalam satu control tower.",
                   "Nationwide fleet and shipment visibility in a single control tower."),
     "challenge": _b("Tidak ada visibilitas real-time atas 1.200+ armada.", "No real-time visibility over 1,200+ vehicles."),
     "approach": _b("Telemetri IoT, peta live, dan analitik prediktif ETA.", "IoT telemetry, live maps, and predictive ETA analytics."),
     "solution": _b("Dashboard control tower dengan alerting dan optimasi rute.", "A control-tower dashboard with alerting and route optimization."),
     "impact": _b("Biaya BBM turun 19% dan ketepatan ETA naik ke 94%.", "Fuel cost down 19% and ETA accuracy up to 94%."),
     "results": [{"label": _b("Biaya BBM", "Fuel Cost"), "value": "-19%"},
                 {"label": _b("Ketepatan ETA", "ETA Accuracy"), "value": "94%"},
                 {"label": _b("Armada", "Fleet"), "value": "1,200+"}],
     "tech": ["React", "Go", "Kafka", "PostgreSQL", "IoT"],
     "demo_enabled": False},
    {"slug": "retail-omnichannel", "client_name": "Galeri Ritel Nusantara", "order": 4,
     "industry": _b("Retail & E-commerce", "Retail & E-commerce"), "cover": "planet-aurora",
     "title": _b("Platform Omnichannel Retail", "Omnichannel Retail Platform"),
     "summary": _b("Menyatukan toko fisik dan online dalam satu pengalaman belanja.",
                   "Unifying physical stores and online into one shopping experience."),
     "challenge": _b("Inventori dan pelanggan terpisah antar kanal.", "Inventory and customers were siloed across channels."),
     "approach": _b("Unified commerce, CDP, dan loyalty terintegrasi.", "Unified commerce, a CDP, and integrated loyalty."),
     "solution": _b("Platform omnichannel dengan inventori tunggal dan personalisasi.", "An omnichannel platform with single inventory and personalization."),
     "impact": _b("Pendapatan online naik 2,4x dan repeat order naik 41%.", "Online revenue up 2.4x and repeat orders up 41%."),
     "results": [{"label": _b("Pendapatan Online", "Online Revenue"), "value": "2.4x"},
                 {"label": _b("Repeat Order", "Repeat Orders"), "value": "+41%"},
                 {"label": _b("Kanal", "Channels"), "value": "5"}],
     "tech": ["Next.js", "Node.js", "MongoDB", "Redis"],
     "demo_enabled": False},
    {"slug": "garment-serial-tracking", "client_name": "Garment ERP Showcase", "order": 5,
     "industry": _b("Manufaktur Garmen", "Garment Manufacturing"), "cover": "planet-violet",
     "title": _b("Serial Tracking End-to-End untuk Industri Garmen",
                 "End-to-end Serial Tracking for Garment Manufacturing"),
     "summary": _b("Lacak setiap nomor serial dari Production Order hingga Buyer Dispatch dalam satu timeline.",
                   "Track every serial from Production Order to Buyer Dispatch in a single timeline."),
     "challenge": _b("Visibilitas lemah pada level item membuat penelusuran defect dan keterlambatan lambat.",
                     "Weak item-level visibility slowed defect tracing and delivery delays."),
     "approach": _b("Modul Serial Tracking lintas modul ERP: PO, Vendor Shipment, Material Inspection, Production, dan Buyer Dispatch.",
                    "Cross-module serial tracking spanning PO, Vendor Shipment, Material Inspection, Production, and Buyer Dispatch."),
     "solution": _b("Timeline real-time per nomor serial dengan dashboard ongoing/selesai/pending dan trace per PO.",
                    "A real-time timeline per serial with ongoing/completed/pending dashboard and trace per PO."),
     "impact": _b("Penelusuran isu produksi dari hitungan jam menjadi hitungan detik.",
                  "Production issue tracing cut from hours to seconds."),
     "results": [{"label": _b("Waktu Trace", "Trace Time"), "value": "-95%"},
                 {"label": _b("Visibilitas Item", "Item Visibility"), "value": "100%"},
                 {"label": _b("Modul Terintegrasi", "Modules Integrated"), "value": "6"}],
     "tech": ["FastAPI", "React", "MongoDB", "Tailwind"],
     "demo_enabled": True,
     "demo_slug": "garment-serial",
     "demo_label_id": "Coba Demo Serial Tracking",
     "demo_label_en": "Try Serial Tracking Demo"},
]

TEAM = [
    {"name": "Andika Pratama", "order": 1, "seed": "ap", "socials": {"linkedin": "#"},
     "role": _b("CEO & Co-Founder", "CEO & Co-Founder"),
     "bio": _b("Visioner produk dengan 14+ tahun membangun platform skala enterprise.",
               "Product visionary with 14+ years building enterprise-scale platforms.")},
    {"name": "Bunga Lestari", "order": 2, "seed": "bl", "socials": {"linkedin": "#"},
     "role": _b("CTO & Co-Founder", "CTO & Co-Founder"),
     "bio": _b("Arsitek sistem terdistribusi dan AI yang menskalakan jutaan transaksi.",
               "Distributed-systems and AI architect scaling millions of transactions.")},
    {"name": "Candra Wijaya", "order": 3, "seed": "cw", "socials": {"linkedin": "#"},
     "role": _b("Head of Design", "Head of Design"),
     "bio": _b("Memimpin desain immersive dan design system lintas produk.",
               "Leads immersive design and cross-product design systems.")},
    {"name": "Dewi Anggraini", "order": 4, "seed": "da", "socials": {"linkedin": "#"},
     "role": _b("Head of Delivery", "Head of Delivery"),
     "bio": _b("Memastikan setiap misi terkirim tepat waktu dengan kualitas tinggi.",
               "Ensures every mission ships on time with high quality.")},
]

CLIENTS = [
    {"name": "Nusantara Tekstil", "order": 1}, {"name": "Bank Sinar", "order": 2},
    {"name": "TransLogistik", "order": 3}, {"name": "Galeri Ritel", "order": 4},
    {"name": "AgroTech", "order": 5}, {"name": "MediCare", "order": 6},
    {"name": "EduPrima", "order": 7}, {"name": "BumiEnergi", "order": 8},
]

BLOG = [
    {"slug": "membangun-erp-skalabel", "order": 1, "author": "Bunga Lestari", "cover": "planet-indigo",
     "tags": ["ERP", "Architecture"], "published_at": "2026-03-12",
     "title": _b("Membangun ERP yang Benar-benar Skalabel", "Building Truly Scalable ERP"),
     "excerpt": _b("Prinsip arsitektur modular yang membuat ERP tumbuh tanpa hutang teknis.",
                   "Modular architecture principles that let ERP grow without technical debt."),
     "body": _b("ERP yang baik dimulai dari batasan domain yang jelas. Dalam artikel ini kami membahas bagaimana pendekatan modular, SSOT, dan event-driven membantu sistem tumbuh selama bertahun-tahun tanpa menjadi monolit yang rapuh.",
                "Great ERP starts with clear domain boundaries. In this article we explore how modular, SSOT, and event-driven approaches help systems grow for years without becoming a fragile monolith.")},
    {"slug": "ai-untuk-operasional", "order": 2, "author": "Andika Pratama", "cover": "planet-teal",
     "tags": ["AI", "Automation"], "published_at": "2026-02-20",
     "title": _b("AI Praktis untuk Operasional Perusahaan", "Practical AI for Company Operations"),
     "excerpt": _b("Cara memulai otomasi AI yang memberi dampak nyata, bukan sekadar hype.",
                   "How to start AI automation that delivers real impact, not just hype."),
     "body": _b("Mulailah dari proses bernilai tinggi dan berulang. Kami berbagi kerangka memilih use case AI, mengukur ROI, dan menskalakan dari pilot ke produksi dengan aman.",
                "Start with high-value, repetitive processes. We share a framework to choose AI use cases, measure ROI, and scale safely from pilot to production.")},
    {"slug": "desain-immersive-web", "order": 3, "author": "Candra Wijaya", "cover": "planet-violet",
     "tags": ["Design", "WebGL"], "published_at": "2026-01-30",
     "title": _b("Seni Web Immersive yang Tetap Cepat", "The Art of Immersive Web That Stays Fast"),
     "excerpt": _b("Menyeimbangkan efek 3D memukau dengan performa dan aksesibilitas.",
                   "Balancing stunning 3D effects with performance and accessibility."),
     "body": _b("Web immersive bukan soal menambah efek sebanyak mungkin, melainkan koreografi gerak yang bermakna. Kami membahas teknik fallback, reduced-motion, dan optimasi WebGL.",
                "Immersive web is not about adding as many effects as possible, but meaningful motion choreography. We discuss fallback techniques, reduced-motion, and WebGL optimization.")},
]

CAREERS = [
    {"slug": "senior-fullstack-engineer", "order": 1, "location": "Jakarta / Remote", "type": "Full-time", "level": "Senior",
     "title": _b("Senior Full-stack Engineer", "Senior Full-stack Engineer"),
     "description": _b("Membangun platform skala enterprise dengan React dan FastAPI.",
                       "Build enterprise-scale platforms with React and FastAPI."),
     "requirements": [_b("5+ tahun pengalaman full-stack", "5+ years full-stack experience"),
                      _b("Mahir React & Python", "Proficient in React & Python"),
                      _b("Paham arsitektur cloud", "Understands cloud architecture")]},
    {"slug": "product-designer", "order": 2, "location": "Jakarta", "type": "Full-time", "level": "Mid",
     "title": _b("Product Designer (UI/UX)", "Product Designer (UI/UX)"),
     "description": _b("Merancang pengalaman immersive dan design system.",
                       "Design immersive experiences and design systems."),
     "requirements": [_b("3+ tahun product design", "3+ years in product design"),
                      _b("Portfolio kuat", "Strong portfolio"),
                      _b("Mahir Figma", "Proficient in Figma")]},
    {"slug": "devops-engineer", "order": 3, "location": "Remote", "type": "Full-time", "level": "Mid-Senior",
     "title": _b("DevOps Engineer", "DevOps Engineer"),
     "description": _b("Mengelola infrastruktur cloud-native dan CI/CD.",
                       "Manage cloud-native infrastructure and CI/CD."),
     "requirements": [_b("Pengalaman Kubernetes", "Kubernetes experience"),
                      _b("Mahir AWS/GCP", "Proficient in AWS/GCP"),
                      _b("Otomasi IaC", "IaC automation")]},
]

SETTINGS = {
    "key": "site",
    "hero_title": _b("Menjelajah Semesta Solusi Teknologi", "Explore the Universe of Technology Solutions"),
    "hero_subtitle": _b("Kubus Teknologi Indonesia membangun perangkat lunak, sistem, dan pengalaman digital yang melampaui ekspektasi.",
                        "Kubus Teknologi Indonesia builds software, systems, and digital experiences that exceed expectations."),
    "tagline": _b("Solusi IT yang melampaui batas.", "IT solutions beyond limits."),
    "about_title": _b("Lahir dari Visi, Ditenagai Keahlian", "Born from Vision, Powered by Expertise"),
    "about_body": _b("Kami adalah tim engineer, desainer, dan strategis yang percaya teknologi terbaik terasa seperti keajaiban - namun dibangun dengan disiplin rekayasa. Misi kami: menjadikan perusahaan Indonesia siap bersaing di tingkat dunia.",
                     "We are a team of engineers, designers, and strategists who believe the best technology feels like magic - yet is built with engineering discipline. Our mission: make Indonesian companies ready to compete on the world stage."),
    "about_mission": _b(
        "Memberdayakan bisnis melalui teknologi. Kami membangun solusi software custom yang meningkatkan efisiensi, mendorong pertumbuhan, dan memberikan ROI yang terukur.",
        "Empowering businesses through technology. We build custom software solutions that drive efficiency, enable growth, and deliver measurable ROI."
    ),
    "about_vision": _b(
        "Menjadi mitra teknologi paling terpercaya di Indonesia, dikenal karena menghadirkan solusi enterprise-grade yang tahan uji waktu.",
        "To be Indonesia's most trusted technology partner, known for delivering enterprise-grade solutions that stand the test of time."
    ),
    "stats": [
        {"label": _b("Proyek Selesai", "Projects Delivered"), "value": "120+"},
        {"label": _b("Klien Enterprise", "Enterprise Clients"), "value": "45+"},
        {"label": _b("Tahun Pengalaman", "Years of Experience"), "value": "10"},
        {"label": _b("Tim Ahli", "Expert Team"), "value": "60+"},
    ],
    "contact": {
        "email": "hello@kubusindonesia.com",
        "phone": "+62899 3939 617",
        "address": _b("GoWork Space Lv. 3 Jl. Gatot Subroto No. 271, Bandung", "GoWork Space Lv. 3 Jl. Gatot Subroto No. 271, Bandung City"),
        "social": {"linkedin": "", "instagram": "", "twitter": "", "github": ""},
    },
}


async def _seed_collection(db, name, docs):
    col = db[name]
    if await col.count_documents({}) > 0:
        return 0
    now = now_iso()
    payload = [{"id": new_id(), "created_at": now, "updated_at": now, "created_by": None,
                "voided": False, "status": "published", **d} for d in docs]
    if payload:
        await col.insert_many(payload)
    return len(payload)


async def seed_all(db):
    inserted = {}
    inserted["cms_services"] = await _seed_collection(db, "cms_services", SERVICES)
    inserted["cms_cases"] = await _seed_collection(db, "cms_cases", CASES)
    inserted["cms_team"] = await _seed_collection(db, "cms_team", TEAM)
    inserted["cms_clients"] = await _seed_collection(db, "cms_clients", CLIENTS)
    inserted["cms_tech"] = await _seed_collection(db, "cms_tech", TECH)
    inserted["cms_blog"] = await _seed_collection(db, "cms_blog", BLOG)
    inserted["cms_careers"] = await _seed_collection(db, "cms_careers", CAREERS)
    if await db.cms_pages.count_documents({"key": "site"}) == 0:
        now = now_iso()
        await db.cms_pages.insert_one({"id": new_id(), "created_at": now, "updated_at": now,
                                       "created_by": None, "voided": False, **SETTINGS})
        inserted["cms_pages"] = 1
    return inserted
