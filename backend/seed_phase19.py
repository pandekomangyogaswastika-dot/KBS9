"""
Phase 19: Seed Data Script
Seeds testimonials, FAQ, packages, legal pages, and resources.
Run: python seed_phase19.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def seed_all():
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "test_database")]
    
    print("🌱 Starting Phase 19 seed data...\n")
    
    # 1. Testimonials
    testimonials = [
        {
            "id": str(uuid.uuid4()),
            "person_name": "Budi Santoso",
            "company": "PT Manufacturing Indonesia",
            "person_role": {"id": "Chief Technology Officer", "en": "Chief Technology Officer"},
            "quote": {
                "id": "KTI mengubah operasi kami sepenuhnya. Sistem WMS yang mereka bangun meningkatkan efisiensi warehouse kami hingga 80%. Tim yang sangat profesional dan responsif. Highly recommended!",
                "en": "KTI completely transformed our operations. The WMS system they built increased our warehouse efficiency by 80%. Very professional and responsive team. Highly recommended!"
            },
            "rating": 5,
            "featured": True,
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "person_name": "Sarah Wijaya",
            "company": "PT Retail Solutions",
            "person_role": {"id": "CEO & Founder", "en": "CEO & Founder"},
            "quote": {
                "id": "Platform e-commerce yang dibangun KTI sangat robust dan scalable. Dalam 6 bulan, revenue kami naik 150%. Investment yang sangat worthwhile.",
                "en": "The e-commerce platform built by KTI is very robust and scalable. In 6 months, our revenue increased by 150%. A very worthwhile investment."
            },
            "rating": 5,
            "featured": True,
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "person_name": "Dr. Ahmad Rahman",
            "company": "RS Prima Healthcare",
            "person_role": {"id": "Direktur IT", "en": "IT Director"},
            "quote": {
                "id": "Sistem manajemen rumah sakit yang dibuat KTI memudahkan operasional kami. Data pasien terintegrasi dengan baik dan keamanan data terjamin. Terima kasih KTI!",
                "en": "The hospital management system created by KTI streamlined our operations. Patient data is well integrated and data security is guaranteed. Thank you KTI!"
            },
            "rating": 5,
            "featured": True,
            "order": 2,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "person_name": "Michael Chen",
            "company": "Fintech Ventures Ltd",
            "person_role": {"id": "Head of Product", "en": "Head of Product"},
            "quote": {
                "id": "KTI adalah partner yang sangat reliable. Mereka memahami kebutuhan fintech dengan baik, dan hasil development-nya selalu melebihi ekspektasi. Strongly recommended!",
                "en": "KTI is a very reliable partner. They understand fintech needs well, and their development results always exceed expectations. Strongly recommended!"
            },
            "rating": 5,
            "featured": True,
            "order": 3,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
    ]
    
    await db.cms_testimonials.delete_many({})  # Clear existing
    await db.cms_testimonials.insert_many(testimonials)
    print(f"✅ Seeded {len(testimonials)} testimonials")
    
    # 2. FAQ
    faqs = [
        # General
        {
            "id": str(uuid.uuid4()),
            "category": "general",
            "question": {"id": "Apa itu Kubus Teknologi Indonesia?", "en": "What is Kubus Teknologi Indonesia?"},
            "answer": {
                "id": "Kubus Teknologi Indonesia (KTI) adalah perusahaan software development yang fokus pada solusi enterprise. Kami membangun custom software, sistem ERP, WMS, e-commerce, dan berbagai aplikasi bisnis lainnya untuk membantu perusahaan bertransformasi digital.",
                "en": "Kubus Teknologi Indonesia (KTI) is a software development company focused on enterprise solutions. We build custom software, ERP systems, WMS, e-commerce, and various other business applications to help companies transform digitally."
            },
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "general",
            "question": {"id": "Industri apa saja yang Anda layani?", "en": "What industries do you serve?"},
            "answer": {
                "id": "Kami melayani berbagai industri termasuk Manufacturing, Retail, Healthcare, Finance, Education, dan Government. Setiap industri memiliki kebutuhan unik, dan kami siap menyesuaikan solusi kami sesuai kebutuhan Anda.",
                "en": "We serve various industries including Manufacturing, Retail, Healthcare, Finance, Education, and Government. Each industry has unique needs, and we are ready to customize our solutions to your requirements."
            },
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        # Pricing
        {
            "id": str(uuid.uuid4()),
            "category": "pricing",
            "question": {"id": "Berapa biaya untuk membuat custom software?", "en": "How much does it cost to build custom software?"},
            "answer": {
                "id": "Biaya bervariasi tergantung kompleksitas dan scope project. Paket Starter dimulai dari Rp 50 juta, Professional dari Rp 150 juta, dan Enterprise dengan harga custom. Kami menawarkan konsultasi gratis untuk estimasi yang lebih akurat.",
                "en": "Costs vary depending on complexity and project scope. Starter packages start from Rp 50 million, Professional from Rp 150 million, and Enterprise with custom pricing. We offer free consultation for more accurate estimates."
            },
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "pricing",
            "question": {"id": "Apakah ada biaya maintenance setelah project selesai?", "en": "Are there maintenance costs after project completion?"},
            "answer": {
                "id": "Ya, kami menawarkan paket maintenance & support dengan biaya terpisah. Biasanya sekitar 10-15% dari project cost per tahun. Paket ini mencakup bug fixes, minor updates, dan technical support.",
                "en": "Yes, we offer maintenance & support packages at a separate cost. Usually around 10-15% of project cost per year. This package includes bug fixes, minor updates, and technical support."
            },
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        # Technical
        {
            "id": str(uuid.uuid4()),
            "category": "technical",
            "question": {"id": "Teknologi apa yang Anda gunakan?", "en": "What technologies do you use?"},
            "answer": {
                "id": "Kami menggunakan modern tech stack termasuk Python (FastAPI), React, Node.js, MongoDB, PostgreSQL, AWS, Docker, dan Kubernetes. Kami selalu update dengan teknologi terbaru untuk memberikan solusi terbaik.",
                "en": "We use modern tech stack including Python (FastAPI), React, Node.js, MongoDB, PostgreSQL, AWS, Docker, and Kubernetes. We always stay updated with the latest technologies to provide the best solutions."
            },
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "technical",
            "question": {"id": "Apakah source code diberikan kepada client?", "en": "Is source code provided to clients?"},
            "answer": {
                "id": "Ya, untuk project custom development, source code menjadi milik penuh client setelah pembayaran lunas. Kami juga menyediakan dokumentasi teknis lengkap.",
                "en": "Yes, for custom development projects, source code becomes the client's full property after full payment. We also provide complete technical documentation."
            },
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        # Process
        {
            "id": str(uuid.uuid4()),
            "category": "process",
            "question": {"id": "Berapa lama waktu development?", "en": "How long does development take?"},
            "answer": {
                "id": "Timeline bervariasi: project kecil 1-3 bulan, medium 3-6 bulan, dan enterprise 6-12 bulan. Kami menggunakan agile methodology dengan iterasi 2 minggu sehingga Anda bisa melihat progress secara berkala.",
                "en": "Timeline varies: small projects 1-3 months, medium 3-6 months, and enterprise 6-12 months. We use agile methodology with 2-week iterations so you can see progress regularly."
            },
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "process",
            "question": {"id": "Bagaimana proses komunikasi selama project?", "en": "How is communication during the project?"},
            "answer": {
                "id": "Kami menggunakan Slack/Teams untuk daily communication, mingguan sprint review meeting, dan bi-weekly demo. Project manager dedicated akan menjadi single point of contact Anda.",
                "en": "We use Slack/Teams for daily communication, weekly sprint review meetings, and bi-weekly demos. A dedicated project manager will be your single point of contact."
            },
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
    ]
    
    await db.cms_faq.delete_many({})
    await db.cms_faq.insert_many(faqs)
    print(f"✅ Seeded {len(faqs)} FAQs")
    
    # 3. Packages
    packages = [
        {
            "id": str(uuid.uuid4()),
            "name": {"id": "Starter", "en": "Starter"},
            "tier": "starter",
            "price_from": 50000000,
            "duration": "per project",
            "features": [
                {"id": "Web application dasar", "en": "Basic web application"},
                {"id": "Admin dashboard sederhana", "en": "Simple admin dashboard"},
                {"id": "Database & API setup", "en": "Database & API setup"},
                {"id": "Responsive mobile design", "en": "Responsive mobile design"},
                {"id": "3 bulan support & maintenance", "en": "3 months support & maintenance"},
                {"id": "Source code ownership", "en": "Source code ownership"},
            ],
            "services_included": [],
            "popular": False,
            "cta_label": {"id": "Mulai Sekarang", "en": "Get Started"},
            "order": 0,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"id": "Professional", "en": "Professional"},
            "tier": "professional",
            "price_from": 150000000,
            "duration": "per project",
            "features": [
                {"id": "Semua fitur Starter", "en": "All Starter features"},
                {"id": "Advanced features & integrations", "en": "Advanced features & integrations"},
                {"id": "Third-party API integrations", "en": "Third-party API integrations"},
                {"id": "Payment gateway setup", "en": "Payment gateway setup"},
                {"id": "Real-time notifications", "en": "Real-time notifications"},
                {"id": "Advanced analytics dashboard", "en": "Advanced analytics dashboard"},
                {"id": "6 bulan support & maintenance", "en": "6 months support & maintenance"},
                {"id": "Training untuk tim Anda", "en": "Training for your team"},
            ],
            "services_included": [],
            "popular": True,
            "cta_label": {"id": "Paling Populer", "en": "Most Popular"},
            "order": 1,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"id": "Enterprise", "en": "Enterprise"},
            "tier": "enterprise",
            "price_from": None,
            "duration": "custom",
            "features": [
                {"id": "Semua fitur Professional", "en": "All Professional features"},
                {"id": "Custom enterprise solutions", "en": "Custom enterprise solutions"},
                {"id": "Multi-tenant architecture", "en": "Multi-tenant architecture"},
                {"id": "High availability & scalability", "en": "High availability & scalability"},
                {"id": "Dedicated project team", "en": "Dedicated project team"},
                {"id": "24/7 priority support", "en": "24/7 priority support"},
                {"id": "On-premise deployment option", "en": "On-premise deployment option"},
                {"id": "SLA guarantee", "en": "SLA guarantee"},
            ],
            "services_included": [],
            "popular": False,
            "cta_label": {"id": "Hubungi Sales", "en": "Contact Sales"},
            "order": 2,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
    ]
    
    await db.cms_packages.delete_many({})
    await db.cms_packages.insert_many(packages)
    print(f"✅ Seeded {len(packages)} packages")
    
    # 4. Legal Pages
    legal_pages = [
        {
            "id": str(uuid.uuid4()),
            "slug": "privacy-policy",
            "title": {"id": "Kebijakan Privasi", "en": "Privacy Policy"},
            "content": {
                "id": """
<h2>1. Pengumpulan Data</h2>
<p>Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk nama, email, nomor telepon, dan informasi perusahaan ketika Anda mengisi formulir kontak atau assessment.</p>

<h2>2. Penggunaan Data</h2>
<p>Data yang kami kumpulkan digunakan untuk:</p>
<ul>
<li>Merespons pertanyaan dan permintaan Anda</li>
<li>Memberikan layanan dan dukungan</li>
<li>Mengirim update dan informasi tentang layanan kami</li>
<li>Meningkatkan website dan layanan kami</li>
</ul>

<h2>3. Keamanan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data Anda dari akses, penggunaan, atau pengungkapan yang tidak sah.</p>

<h2>4. Berbagi Data</h2>
<p>Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran mereka tanpa persetujuan eksplisit Anda.</p>

<h2>5. Hak Anda</h2>
<p>Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus data pribadi Anda. Silakan hubungi kami di info@kubustek.id untuk permintaan tersebut.</p>

<h2>6. Cookies</h2>
<p>Website kami menggunakan cookies untuk meningkatkan pengalaman Anda. Anda dapat mengatur browser Anda untuk menolak cookies, namun beberapa fitur website mungkin tidak berfungsi dengan baik.</p>

<h2>7. Perubahan Kebijakan</h2>
<p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Versi terbaru akan selalu tersedia di halaman ini.</p>

<h2>8. Kontak</h2>
<p>Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di info@kubustek.id</p>
""",
                "en": """
<h2>1. Data Collection</h2>
<p>We collect information you provide directly to us, including name, email, phone number, and company information when you fill out contact forms or assessments.</p>

<h2>2. Use of Data</h2>
<p>The data we collect is used to:</p>
<ul>
<li>Respond to your inquiries and requests</li>
<li>Provide services and support</li>
<li>Send updates and information about our services</li>
<li>Improve our website and services</li>
</ul>

<h2>3. Data Security</h2>
<p>We implement appropriate technical and organizational security measures to protect your data from unauthorized access, use, or disclosure.</p>

<h2>4. Data Sharing</h2>
<p>We do not sell, rent, or share your personal data with third parties for their marketing purposes without your explicit consent.</p>

<h2>5. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data. Please contact us at info@kubustek.id for such requests.</p>

<h2>6. Cookies</h2>
<p>Our website uses cookies to improve your experience. You can set your browser to refuse cookies, but some website features may not function properly.</p>

<h2>7. Policy Changes</h2>
<p>We may update this privacy policy from time to time. The latest version will always be available on this page.</p>

<h2>8. Contact</h2>
<p>If you have questions about this privacy policy, please contact us at info@kubustek.id</p>
"""
            },
            "version": "1.0",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "terms-of-service",
            "title": {"id": "Syarat & Ketentuan", "en": "Terms of Service"},
            "content": {
                "id": """
<h2>1. Penerimaan Syarat</h2>
<p>Dengan mengakses dan menggunakan website Kubus Teknologi Indonesia, Anda setuju untuk terikat oleh syarat dan ketentuan ini.</p>

<h2>2. Layanan</h2>
<p>Kami menyediakan layanan pengembangan software custom, konsultasi IT, dan solusi digital enterprise. Scope dan deliverables akan dijelaskan dalam kontrak terpisah.</p>

<h2>3. Pembayaran</h2>
<p>Pembayaran dilakukan sesuai dengan term yang disepakati dalam kontrak. Umumnya: 30% down payment, 40% di tengah development, dan 30% setelah deployment.</p>

<h2>4. Intellectual Property</h2>
<p>Untuk project custom development, source code dan IP menjadi milik client setelah pembayaran lunas. Kami berhak menggunakan project sebagai portfolio (dengan approval client).</p>

<h2>5. Garansi</h2>
<p>Kami memberikan garansi bug-free selama 30 hari setelah deployment. Setelah itu, maintenance & support dikenakan biaya sesuai paket yang dipilih.</p>

<h2>6. Pembatasan Tanggung Jawab</h2>
<p>Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan layanan kami.</p>

<h2>7. Perubahan Syarat</h2>
<p>Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diinformasikan melalui email atau website.</p>

<h2>8. Hukum yang Berlaku</h2>
<p>Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia.</p>
""",
                "en": """
<h2>1. Acceptance of Terms</h2>
<p>By accessing and using the Kubus Teknologi Indonesia website, you agree to be bound by these terms and conditions.</p>

<h2>2. Services</h2>
<p>We provide custom software development, IT consulting, and enterprise digital solutions. Scope and deliverables will be outlined in a separate contract.</p>

<h2>3. Payment</h2>
<p>Payment is made according to terms agreed in the contract. Typically: 30% down payment, 40% mid-development, and 30% after deployment.</p>

<h2>4. Intellectual Property</h2>
<p>For custom development projects, source code and IP become client's property after full payment. We reserve the right to use the project as portfolio (with client approval).</p>

<h2>5. Warranty</h2>
<p>We provide a 30-day bug-free warranty after deployment. After that, maintenance & support are charged according to the selected package.</p>

<h2>6. Limitation of Liability</h2>
<p>We are not responsible for indirect, incidental, or consequential losses arising from the use of our services.</p>

<h2>7. Terms Changes</h2>
<p>We reserve the right to change these terms at any time. Changes will be communicated via email or website.</p>

<h2>8. Governing Law</h2>
<p>These terms and conditions are governed by the laws of the Republic of Indonesia.</p>
"""
            },
            "version": "1.0",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ]
    
    await db.cms_legal_pages.delete_many({})
    await db.cms_legal_pages.insert_many(legal_pages)
    print(f"✅ Seeded {len(legal_pages)} legal pages")
    
    # 5. Resources
    resources = [
        {
            "id": str(uuid.uuid4()),
            "slug": "digital-transformation-guide-2025",
            "title": {"id": "Panduan Transformasi Digital 2025", "en": "Digital Transformation Guide 2025"},
            "type": "whitepaper",
            "description": {
                "id": "Panduan lengkap untuk perusahaan yang ingin memulai perjalanan transformasi digital. Mencakup strategi, best practices, dan case studies dari berbagai industri.",
                "en": "Complete guide for companies looking to start their digital transformation journey. Includes strategies, best practices, and case studies from various industries."
            },
            "file_url": "https://example.com/digital-transformation-guide-2025.pdf",
            "file_size": 2048000,
            "gated": True,
            "download_count": 0,
            "tags": ["digital-transformation", "enterprise", "strategy"],
            "published_at": datetime.now(timezone.utc).isoformat(),
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "erp-selection-checklist",
            "title": {"id": "Checklist Memilih Sistem ERP", "en": "ERP System Selection Checklist"},
            "type": "template",
            "description": {
                "id": "Template checklist untuk membantu Anda memilih sistem ERP yang tepat untuk bisnis Anda. Lengkap dengan kriteria evaluasi dan scoring system.",
                "en": "Checklist template to help you choose the right ERP system for your business. Complete with evaluation criteria and scoring system."
            },
            "file_url": "https://example.com/erp-checklist.xlsx",
            "file_size": 524288,
            "gated": False,
            "download_count": 0,
            "tags": ["erp", "checklist", "template"],
            "published_at": datetime.now(timezone.utc).isoformat(),
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "warehouse-management-best-practices",
            "title": {"id": "Best Practices Manajemen Gudang", "en": "Warehouse Management Best Practices"},
            "type": "guide",
            "description": {
                "id": "Panduan best practices untuk manajemen gudang modern menggunakan teknologi WMS. Cocok untuk manufacturing dan distribusi.",
                "en": "Best practices guide for modern warehouse management using WMS technology. Suitable for manufacturing and distribution."
            },
            "file_url": "https://example.com/wms-best-practices.pdf",
            "file_size": 1536000,
            "gated": True,
            "download_count": 0,
            "tags": ["wms", "warehouse", "logistics"],
            "published_at": datetime.now(timezone.utc).isoformat(),
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        },
    ]
    
    await db.cms_resources.delete_many({})
    await db.cms_resources.insert_many(resources)
    print(f"✅ Seeded {len(resources)} resources")
    
    print("\n🎉 Phase 19 seed data complete!")
    print("\nSummary:")
    print(f"  - {len(testimonials)} testimonials")
    print(f"  - {len(faqs)} FAQs")
    print(f"  - {len(packages)} pricing packages")
    print(f"  - {len(legal_pages)} legal pages")
    print(f"  - {len(resources)} resources")
    print("\nYou can now test the pages:")
    print("  - /faq")
    print("  - /pricing")
    print("  - /about")
    print("  - /resources")
    print("  - /privacy-policy")
    print("  - /terms-of-service")
    print("  - Homepage (testimonials section)")

if __name__ == "__main__":
    asyncio.run(seed_all())
