"""Seed template: 'IT Solution Discovery' (bilingual id/en).

Generalized from KN3 Discovery structure to an IT-solution client-intake context.
Template-driven (stored in assessment_templates). Stable ids so answers persist.
"""
from core_utils import new_id

OTHER = "__other__"


def _b(idv, en):
    return {"id": idv, "en": en}


def _opt(value, idv, en):
    return {"value": value, "label": {"id": idv, "en": en}}


def build_it_discovery_template():
    domains = [
        {
            "id": "D01", "number": 1, "code": "company-profile", "icon": "Building2", "color": "blue",
            "recommended_pic": ["CEO / Owner", "Direktur"], "estimated_minutes": 12,
            "title": _b("Profil Perusahaan & Tujuan", "Company Profile & Goals"),
            "description": _b("Memahami konteks bisnis & sasaran agar solusi IT yang dibangun tepat sasaran.", "Understand your business context & goals so the IT solution fits."),
            "questions": [
                {"id": "D01-Q01", "type": "single_choice", "prompt": _b("Bidang usaha utama perusahaan Anda?", "Your company's primary industry?"),
                 "help": _b("Pilih yang paling mendekati; menentukan prioritas modul.", "Pick the closest; it drives module priorities."),
                 "options": [_opt("retail", "Retail / E-commerce", "Retail / E-commerce"), _opt("manufaktur", "Manufaktur", "Manufacturing"), _opt("jasa", "Jasa / Konsultan", "Services / Consulting"), _opt("distribusi", "Distribusi / Logistik", "Distribution / Logistics"), _opt("keuangan", "Keuangan / Fintech", "Finance / Fintech"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D01-Q02", "type": "single_choice", "prompt": _b("Jumlah karyawan saat ini?", "Current number of employees?"),
                 "help": _b("Menentukan jumlah pengguna & kapasitas sistem.", "Drives user count & system capacity."),
                 "options": [_opt("1-25", "1\u201325", "1\u201325"), _opt("26-100", "26\u2013100", "26\u2013100"), _opt("101-500", "101\u2013500", "101\u2013500"), _opt("500+", "> 500", "> 500")]},
                {"id": "D01-Q03", "type": "multi_choice", "max_select": 3, "prompt": _b("3 tujuan utama proyek ini? (maks 3)", "Top 3 goals of this project? (max 3)"),
                 "help": _b("Ini menjadi kriteria sukses proyek.", "These become the project success criteria."),
                 "options": [_opt("efisiensi", "Efisiensi proses", "Process efficiency"), _opt("realtime", "Visibilitas real-time", "Real-time visibility"), _opt("biaya", "Penghematan biaya", "Cost reduction"), _opt("skala", "Skalabilitas", "Scalability"), _opt("integrasi", "Integrasi sistem", "System integration"), _opt("pelanggan", "Pengalaman pelanggan", "Customer experience"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D01-Q04", "type": "yes_no", "prompt": _b("Apakah perusahaan bagian dari grup / punya cabang?", "Is the company part of a group / has branches?"),
                 "help": _b("Mempengaruhi kebutuhan multi-entity/multi-lokasi.", "Affects multi-entity/multi-location needs.")},
                {"id": "D01-Q05", "type": "text_long", "prompt": _b("Catatan visi / business case (opsional)", "Vision / business case notes (optional)"),
                 "help": _b("Arah bisnis, rencana ekspansi, dsb.", "Business direction, expansion plans, etc.")},
            ],
        },
        {
            "id": "D02", "number": 2, "code": "current-state", "icon": "AlertTriangle", "color": "amber",
            "recommended_pic": ["IT Manager", "Operations"], "estimated_minutes": 15,
            "title": _b("Kondisi Sistem & Pain Points", "Current Systems & Pain Points"),
            "description": _b("Sistem yang dipakai sekarang dan masalah utama yang ingin diselesaikan.", "Systems in use today and the key problems to solve."),
            "questions": [
                {"id": "D02-Q01", "type": "yes_no", "prompt": _b("Apakah sudah ada sistem/aplikasi yang dipakai saat ini?", "Do you already use a system/application today?"),
                 "help": _b("Jika belum, kita mulai dari awal.", "If not, we start fresh.")},
                {"id": "D02-Q02", "type": "multi_choice", "prompt": _b("Sistem apa yang dipakai sekarang?", "Which systems are used now?"),
                 "show_if": {"question_id": "D02-Q01", "operator": "equals", "value": True},
                 "help": _b("Pilih semua yang relevan.", "Select all that apply."),
                 "options": [_opt("excel", "Excel / Spreadsheet", "Excel / Spreadsheet"), _opt("akuntansi", "Software akuntansi", "Accounting software"), _opt("erp", "ERP", "ERP"), _opt("pos", "POS / Kasir", "POS / Cashier"), _opt("custom", "Aplikasi custom", "Custom app"), _opt("manual", "Manual / kertas", "Manual / paper"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D02-Q03", "type": "text_long", "prompt": _b("3 masalah terbesar dari proses/sistem saat ini?", "Top 3 problems with current process/system?"),
                 "help": _b("Ceritakan pain point yang paling mengganggu.", "Describe the most painful issues.")},
                {"id": "D02-Q04", "type": "scale_1_5", "prompt": _b("Seberapa mendesak kebutuhan solusi baru? (1 santai \u2013 5 sangat mendesak)", "How urgent is a new solution? (1 relaxed \u2013 5 very urgent)"),
                 "help": _b("Membantu kami menyusun prioritas & timeline.", "Helps us prioritize & set timeline.")},
                {"id": "D02-Q05", "type": "number", "prompt": _b("Perkiraan jam kerja/minggu yang terbuang karena proses manual?", "Estimated hours/week wasted on manual work?"),
                 "help": _b("Estimasi kasar tidak masalah.", "A rough estimate is fine.")},
            ],
        },
        {
            "id": "D03", "number": 3, "code": "core-process", "icon": "Workflow", "color": "violet",
            "recommended_pic": ["Operations", "Business Owner"], "estimated_minutes": 18,
            "title": _b("Proses Bisnis Inti", "Core Business Processes"),
            "description": _b("Alur kerja utama yang ingin didigitalkan/diotomasi.", "Key workflows you want digitized/automated."),
            "questions": [
                {"id": "D03-Q01", "type": "multi_choice", "prompt": _b("Proses mana yang ingin diotomasi?", "Which processes do you want to automate?"),
                 "help": _b("Pilih semua yang relevan.", "Select all that apply."),
                 "options": [_opt("penjualan", "Penjualan / Order", "Sales / Orders"), _opt("pembelian", "Pembelian / Procurement", "Purchasing / Procurement"), _opt("inventaris", "Inventaris / Stok", "Inventory / Stock"), _opt("keuangan", "Keuangan / Akuntansi", "Finance / Accounting"), _opt("hr", "HR / Payroll", "HR / Payroll"), _opt("crm", "CRM / Pelanggan", "CRM / Customers"), _opt("produksi", "Produksi", "Production"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D03-Q02", "type": "text_long", "prompt": _b("Jelaskan singkat alur proses inti dari awal sampai akhir.", "Briefly describe your core process end-to-end."),
                 "help": _b("Contoh: order masuk \u2192 cek stok \u2192 kirim \u2192 tagih.", "E.g. order in \u2192 check stock \u2192 ship \u2192 invoice.")},
                {"id": "D03-Q03", "type": "single_choice", "prompt": _b("Berapa banyak transaksi per hari (rata-rata)?", "Transactions per day (average)?"),
                 "help": _b("Menentukan kebutuhan performa.", "Drives performance requirements."),
                 "options": [_opt("<50", "< 50", "< 50"), _opt("50-500", "50\u2013500", "50\u2013500"), _opt("500-5000", "500\u20135.000", "500\u20135,000"), _opt("5000+", "> 5.000", "> 5,000")]},
                {"id": "D03-Q04", "type": "yes_no", "prompt": _b("Apakah butuh approval bertingkat (multi-level)?", "Do you need multi-level approvals?"),
                 "help": _b("Misal: persetujuan manajer lalu direktur.", "E.g. manager then director approval.")},
            ],
        },
        {
            "id": "D04", "number": 4, "code": "data-integration", "icon": "Network", "color": "cyan",
            "recommended_pic": ["IT Manager"], "estimated_minutes": 12,
            "title": _b("Data & Integrasi", "Data & Integration"),
            "description": _b("Kebutuhan migrasi data & integrasi dengan sistem lain.", "Data migration & integration with other systems."),
            "questions": [
                {"id": "D04-Q01", "type": "yes_no", "prompt": _b("Perlu integrasi dengan sistem/aplikasi lain?", "Need integration with other systems/apps?"),
                 "help": _b("Misal: marketplace, payment gateway, akuntansi.", "E.g. marketplace, payment gateway, accounting.")},
                {"id": "D04-Q02", "type": "multi_choice", "prompt": _b("Integrasi apa yang dibutuhkan?", "Which integrations are needed?"),
                 "show_if": {"question_id": "D04-Q01", "operator": "equals", "value": True},
                 "help": _b("Pilih semua yang relevan.", "Select all that apply."),
                 "options": [_opt("marketplace", "Marketplace (Tokopedia/Shopee)", "Marketplace"), _opt("payment", "Payment gateway", "Payment gateway"), _opt("whatsapp", "WhatsApp / Chat", "WhatsApp / Chat"), _opt("akuntansi", "Software akuntansi", "Accounting software"), _opt("pajak", "e-Faktur / Pajak", "e-Invoice / Tax"), _opt("shipping", "Ekspedisi / Shipping", "Shipping / Courier"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D04-Q03", "type": "single_choice", "prompt": _b("Volume data yang perlu dimigrasi?", "Volume of data to migrate?"),
                 "help": _b("Perkiraan jumlah record (produk, pelanggan, transaksi).", "Approx records (products, customers, transactions)."),
                 "options": [_opt("tidak", "Tidak ada migrasi", "No migration"), _opt("kecil", "Kecil (< 10rb record)", "Small (< 10k records)"), _opt("sedang", "Sedang (10rb\u2013100rb)", "Medium (10k\u2013100k)"), _opt("besar", "Besar (> 100rb)", "Large (> 100k)")]},
            ],
        },
        {
            "id": "D05", "number": 5, "code": "users-access", "icon": "Users", "color": "green",
            "recommended_pic": ["HR", "Operations"], "estimated_minutes": 8,
            "title": _b("Pengguna & Akses", "Users & Access"),
            "description": _b("Siapa yang akan memakai sistem dan peran mereka.", "Who will use the system and their roles."),
            "questions": [
                {"id": "D05-Q01", "type": "number", "prompt": _b("Perkiraan jumlah pengguna sistem?", "Estimated number of system users?"),
                 "help": _b("Total orang yang akan login.", "Total people who will log in.")},
                {"id": "D05-Q02", "type": "multi_choice", "prompt": _b("Peran/role pengguna yang dibutuhkan?", "User roles needed?"),
                 "help": _b("Pilih semua yang relevan.", "Select all that apply."),
                 "options": [_opt("admin", "Admin", "Admin"), _opt("manajer", "Manajer", "Manager"), _opt("staf", "Staf operasional", "Operational staff"), _opt("keuangan", "Keuangan", "Finance"), _opt("gudang", "Gudang", "Warehouse"), _opt("sales", "Sales", "Sales"), _opt(OTHER, "Lainnya", "Other")]},
                {"id": "D05-Q03", "type": "yes_no", "prompt": _b("Perlu akses via mobile (HP/tablet)?", "Need mobile access (phone/tablet)?"),
                 "help": _b("Misal untuk sales lapangan / gudang.", "E.g. for field sales / warehouse.")},
            ],
        },
        {
            "id": "D06", "number": 6, "code": "infra-security", "icon": "ShieldCheck", "color": "rose",
            "recommended_pic": ["IT / Compliance"], "estimated_minutes": 10,
            "title": _b("Infrastruktur & Keamanan", "Infrastructure & Security"),
            "description": _b("Preferensi hosting, keamanan, dan kepatuhan.", "Hosting, security, and compliance preferences."),
            "questions": [
                {"id": "D06-Q01", "type": "single_choice", "prompt": _b("Preferensi hosting?", "Hosting preference?"),
                 "help": _b("Cloud lebih cepat & skalabel; on-premise kontrol penuh.", "Cloud is faster & scalable; on-premise gives full control."),
                 "options": [_opt("cloud", "Cloud", "Cloud"), _opt("onprem", "On-premise (server sendiri)", "On-premise"), _opt("hybrid", "Hybrid", "Hybrid"), _opt("belum", "Belum tahu", "Not sure yet")]},
                {"id": "D06-Q02", "type": "yes_no", "prompt": _b("Ada kebutuhan kepatuhan/regulasi khusus?", "Any specific compliance/regulatory needs?"),
                 "help": _b("Misal: ISO 27001, perlindungan data pribadi.", "E.g. ISO 27001, personal data protection.")},
                {"id": "D06-Q03", "type": "text_short", "prompt": _b("Sebutkan standar kepatuhan yang relevan.", "Name the relevant compliance standards."),
                 "show_if": {"question_id": "D06-Q02", "operator": "equals", "value": True},
                 "help": _b("Contoh: ISO 27001, PCI-DSS, UU PDP.", "E.g. ISO 27001, PCI-DSS, GDPR.")},
            ],
        },
        {
            "id": "D07", "number": 7, "code": "budget-timeline", "icon": "Wallet", "color": "blue",
            "recommended_pic": ["CEO", "CFO"], "estimated_minutes": 8,
            "title": _b("Anggaran, Timeline & Vendor", "Budget, Timeline & Vendor"),
            "description": _b("Ekspektasi investasi dan jadwal proyek.", "Investment expectations and project schedule."),
            "questions": [
                {"id": "D07-Q01", "type": "single_choice", "prompt": _b("Perkiraan rentang anggaran proyek?", "Estimated project budget range?"),
                 "help": _b("Membantu menyusun ruang lingkup yang realistis.", "Helps shape a realistic scope."),
                 "options": [_opt("<50", "< Rp 50 juta", "< IDR 50M"), _opt("50-200", "Rp 50\u2013200 juta", "IDR 50\u2013200M"), _opt("200-500", "Rp 200\u2013500 juta", "IDR 200\u2013500M"), _opt("500+", "> Rp 500 juta", "> IDR 500M"), _opt("diskusi", "Perlu didiskusikan", "To be discussed")]},
                {"id": "D07-Q02", "type": "single_choice", "prompt": _b("Target mulai / timeline?", "Target start / timeline?"),
                 "help": _b("Kapan idealnya solusi siap dipakai.", "When ideally the solution should be live."),
                 "options": [_opt("asap", "Secepatnya (< 1 bulan)", "ASAP (< 1 month)"), _opt("1-3", "1\u20133 bulan", "1\u20133 months"), _opt("3-6", "3\u20136 bulan", "3\u20136 months"), _opt("fleksibel", "Fleksibel", "Flexible")]},
                {"id": "D07-Q03", "type": "text_long", "prompt": _b("Harapan terhadap vendor/partner IT?", "Expectations of the IT vendor/partner?"),
                 "help": _b("Misal: support, training, garansi, dokumentasi.", "E.g. support, training, warranty, documentation.")},
            ],
        },
        {
            "id": "D08", "number": 8, "code": "additional", "icon": "MessageSquarePlus", "color": "slate",
            "recommended_pic": ["Semua PIC"], "estimated_minutes": 5,
            "title": _b("Tambahan & Catatan Akhir", "Additional & Final Notes"),
            "description": _b("Informasi lain yang ingin Anda sampaikan.", "Anything else you'd like to share."),
            "questions": [
                {"id": "D08-Q01", "type": "yes_no", "prompt": _b("Bersediakah dijadwalkan sesi demo/diskusi lanjutan?", "Open to a demo/follow-up session?"),
                 "help": _b("Tim kami akan menghubungi untuk penjadwalan.", "Our team will reach out to schedule.")},
                {"id": "D08-Q02", "type": "text_long", "prompt": _b("Catatan akhir / pertanyaan untuk tim Kubus (opsional)", "Final notes / questions for the Kubus team (optional)"),
                 "help": _b("Apa pun yang belum tercakup di atas.", "Anything not covered above.")},
            ],
        },
    ]
    return {
        "id": new_id(),
        "code": "it-solution-discovery",
        "name": _b("IT Solution Discovery", "IT Solution Discovery"),
        "description": _b("Kuesioner penggalian kebutuhan untuk merancang solusi IT yang tepat.", "A discovery questionnaire to design the right IT solution."),
        "status": "published",
        "version": 1,
        "domains": domains,
    }
