"""Seed 3 assessment templates: IT Maturity, Security Baseline, Digital Ops Assessment."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from core_utils import new_id, now_iso

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

TEMPLATES = [
    {
        "name": {"id": "IT Maturity Assessment", "en": "IT Maturity Assessment"},
        "description": {"id": "Evaluasi kematangan infrastruktur & praktik IT organisasi Anda.", "en": "Evaluate your organization's IT infrastructure maturity & practices."},
        "category": "it_maturity",
        "locale_default": "id",
        "published": True,
        "sections": [
            {
                "title": {"id": "Infrastruktur & Keamanan", "en": "Infrastructure & Security"},
                "description": {"id": "Pertanyaan seputar keamanan sistem dan jaringan.", "en": "Questions about system and network security."},
                "questions": [
                    {"text": {"id": "Bagaimana status backup data Anda saat ini?", "en": "What is your current data backup status?"}, "type": "select", "options": [{"value": "none", "label": {"id": "Tidak ada backup", "en": "No backup"}}, {"value": "manual", "label": {"id": "Manual / tidak rutin", "en": "Manual / irregular"}}, {"value": "auto_local", "label": {"id": "Otomatis - lokal", "en": "Automated - local"}}, {"value": "auto_cloud", "label": {"id": "Otomatis - cloud", "en": "Automated - cloud"}}], "required": True, "weight": 2.0},
                    {"text": {"id": "Apakah Anda memiliki kebijakan keamanan IT tertulis?", "en": "Do you have a written IT security policy?"}, "type": "yesno", "required": True, "weight": 1.5},
                    {"text": {"id": "Seberapa sering tim IT Anda melakukan security audit?", "en": "How often does your IT team conduct security audits?"}, "type": "select", "options": [{"value": "never", "label": {"id": "Tidak pernah", "en": "Never"}}, {"value": "yearly", "label": {"id": "Tahunan", "en": "Yearly"}}, {"value": "quarterly", "label": {"id": "Per kuartal", "en": "Quarterly"}}, {"value": "monthly", "label": {"id": "Bulanan atau lebih", "en": "Monthly or more"}}], "required": True, "weight": 1.5},
                    {"text": {"id": "Jelaskan tantangan utama infrastruktur IT Anda saat ini.", "en": "Describe your main IT infrastructure challenges today."}, "type": "textarea", "required": False, "weight": 1.0},
                ],
            },
            {
                "title": {"id": "Proses & Otomasi", "en": "Process & Automation"},
                "description": {"id": "Sejauh mana proses bisnis Anda telah terotomasi.", "en": "How automated your business processes are."},
                "questions": [
                    {"text": {"id": "Berapa % proses bisnis Anda yang sudah terotomasi?", "en": "What % of your business processes are automated?"}, "type": "select", "options": [{"value": "0", "label": {"id": "0% - semua manual", "en": "0% - all manual"}}, {"value": "25", "label": {"id": "< 25%", "en": "< 25%"}}, {"value": "50", "label": {"id": "25-50%", "en": "25-50%"}}, {"value": "75", "label": {"id": "> 50%", "en": "> 50%"}}], "required": True, "weight": 2.0},
                    {"text": {"id": "Apakah Anda menggunakan sistem ERP atau WMS?", "en": "Do you use an ERP or WMS system?"}, "type": "yesno", "required": True, "weight": 1.5},
                    {"text": {"id": "Tools apa yang saat ini digunakan tim Anda? (boleh lebih dari satu)", "en": "What tools does your team currently use?"}, "type": "multiselect", "options": [{"value": "spreadsheet", "label": {"id": "Spreadsheet (Excel/Sheet)", "en": "Spreadsheet"}}, {"value": "erp", "label": {"id": "ERP", "en": "ERP"}}, {"value": "crm", "label": {"id": "CRM", "en": "CRM"}}, {"value": "custom", "label": {"id": "Aplikasi custom", "en": "Custom app"}}, {"value": "none", "label": {"id": "Tidak ada", "en": "None"}}], "required": True, "weight": 1.0},
                ],
            },
        ],
    },
    {
        "name": {"id": "Digital Readiness Assessment", "en": "Digital Readiness Assessment"},
        "description": {"id": "Ukur sejauh mana kesiapan digital bisnis Anda untuk transformasi.", "en": "Measure your business digital readiness for transformation."},
        "category": "digital_ops",
        "locale_default": "id",
        "published": True,
        "sections": [
            {
                "title": {"id": "Kesiapan SDM & Budaya", "en": "People & Culture Readiness"},
                "questions": [
                    {"text": {"id": "Seberapa terbuka tim Anda terhadap perubahan teknologi? (1=sangat resistif, 5=sangat terbuka)", "en": "How open is your team to technology change? (1=very resistant, 5=very open)"}, "type": "scale", "required": True, "weight": 2.0},
                    {"text": {"id": "Apakah ada program pelatihan digital untuk karyawan?", "en": "Is there a digital training program for employees?"}, "type": "yesno", "required": True, "weight": 1.5},
                    {"text": {"id": "Berapa jumlah karyawan yang saat ini menggunakan tools digital secara aktif?", "en": "How many employees actively use digital tools?"}, "type": "select", "options": [{"value": "<10", "label": {"id": "< 10 orang", "en": "< 10 people"}}, {"value": "10-50", "label": {"id": "10-50 orang", "en": "10-50 people"}}, {"value": "50-200", "label": {"id": "50-200 orang", "en": "50-200 people"}}, {"value": ">200", "label": {"id": "> 200 orang", "en": "> 200 people"}}], "required": True, "weight": 1.0},
                ],
            },
            {
                "title": {"id": "Data & Infrastruktur Digital", "en": "Data & Digital Infrastructure"},
                "questions": [
                    {"text": {"id": "Apakah data bisnis Anda sudah terpusat di satu sistem?", "en": "Is your business data centralized in one system?"}, "type": "yesno", "required": True, "weight": 2.0},
                    {"text": {"id": "Seberapa mudah tim Anda mengakses data untuk pengambilan keputusan? (1=sangat sulit, 5=sangat mudah)", "en": "How easy is data access for decision-making? (1=very hard, 5=very easy)"}, "type": "scale", "required": True, "weight": 1.5},
                    {"text": {"id": "Apa kendala terbesar dalam transformasi digital bisnis Anda?", "en": "What is your biggest challenge in digital transformation?"}, "type": "textarea", "required": False, "weight": 1.0},
                ],
            },
        ],
    },
    {
        "name": {"id": "Kebutuhan Sistem Informasi", "en": "Information System Needs"},
        "description": {"id": "Identifikasi kebutuhan sistem informasi yang paling relevan untuk bisnis Anda.", "en": "Identify the most relevant information system needs for your business."},
        "category": "custom",
        "locale_default": "id",
        "published": True,
        "sections": [
            {
                "title": {"id": "Profil Bisnis", "en": "Business Profile"},
                "questions": [
                    {"text": {"id": "Industri atau sektor bisnis Anda?", "en": "Your industry or business sector?"}, "type": "select", "options": [{"value": "manufacturing", "label": {"id": "Manufaktur", "en": "Manufacturing"}}, {"value": "retail", "label": {"id": "Retail / E-commerce", "en": "Retail / E-commerce"}}, {"value": "logistics", "label": {"id": "Logistik & Distribusi", "en": "Logistics & Distribution"}}, {"value": "finance", "label": {"id": "Keuangan & Fintech", "en": "Finance & Fintech"}}, {"value": "services", "label": {"id": "Jasa / Konsultansi", "en": "Services / Consulting"}}, {"value": "other", "label": {"id": "Lainnya", "en": "Other"}}], "required": True, "weight": 1.0},
                    {"text": {"id": "Berapa skala perusahaan Anda?", "en": "What is your company scale?"}, "type": "select", "options": [{"value": "micro", "label": {"id": "Mikro (< 10 karyawan)", "en": "Micro (< 10 employees)"}}, {"value": "small", "label": {"id": "Kecil (10-50)", "en": "Small (10-50)"}}, {"value": "medium", "label": {"id": "Menengah (50-500)", "en": "Medium (50-500)"}}, {"value": "large", "label": {"id": "Besar (> 500)", "en": "Large (> 500)"}}], "required": True, "weight": 1.0},
                    {"text": {"id": "Apa tujuan utama investasi IT Anda dalam 12 bulan ke depan?", "en": "What is your main IT investment goal in the next 12 months?"}, "type": "textarea", "required": True, "weight": 2.0},
                ],
            },
            {
                "title": {"id": "Prioritas Solusi", "en": "Solution Priorities"},
                "questions": [
                    {"text": {"id": "Solusi apa yang paling Anda butuhkan saat ini? (pilih semua yang relevan)", "en": "What solutions do you need most? (select all relevant)"}, "type": "multiselect", "options": [{"value": "erp", "label": {"id": "ERP / sistem terintegrasi", "en": "ERP / integrated system"}}, {"value": "wms", "label": {"id": "WMS / manajemen gudang", "en": "WMS / warehouse management"}}, {"value": "mobile_app", "label": {"id": "Mobile app", "en": "Mobile app"}}, {"value": "ai_automation", "label": {"id": "AI & Otomasi", "en": "AI & Automation"}}, {"value": "cloud", "label": {"id": "Cloud / DevOps", "en": "Cloud / DevOps"}}, {"value": "analytics", "label": {"id": "Analytics / BI", "en": "Analytics / BI"}}], "required": True, "weight": 2.0},
                    {"text": {"id": "Berapa estimasi budget IT Anda per tahun?", "en": "What is your estimated annual IT budget?"}, "type": "select", "options": [{"value": "<50jt", "label": {"id": "< Rp 50 juta", "en": "< IDR 50M"}}, {"value": "50-200jt", "label": {"id": "Rp 50-200 juta", "en": "IDR 50-200M"}}, {"value": "200-500jt", "label": {"id": "Rp 200-500 juta", "en": "IDR 200-500M"}}, {"value": ">500jt", "label": {"id": "> Rp 500 juta", "en": "> IDR 500M"}}], "required": True, "weight": 1.5},
                ],
            },
        ],
    },
]

async def run():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    inserted = 0
    for t in TEMPLATES:
        existing = await db.assessment_templates.find_one({"name.id": t["name"]["id"], "voided": {"$ne": True}})
        if existing:
            print(f"  skip  [{t['name']['id']}] already exists")
            continue
        now = now_iso()
        doc = {
            "id": new_id(), "created_at": now, "updated_at": now, "created_by": "seed",
            "voided": False, **t,
        }
        # Add IDs to sections/questions
        for sec in doc["sections"]:
            sec["id"] = new_id()
            for q in sec.get("questions", []):
                q["id"] = new_id()
                if "options" not in q:
                    q["options"] = None
                if "hint" not in q:
                    q["hint"] = None
        await db.assessment_templates.insert_one(doc)
        print(f"  seed  [{t['name']['id']}] inserted")
        inserted += 1
    print(f"Done: {inserted} templates inserted.")
    client.close()

if __name__ == "__main__":
    asyncio.run(run())
