"""Seed demo Project Management data (idempotent). Called on server startup."""
from core_utils import new_id, now_iso


async def seed_pm(db):
    """Seed demo pm_*, billing_invoices, chat_* data linked to seeded users."""
    if await db.pm_projects.count_documents({}) > 0:
        return {}

    admin_u = await db.system_users.find_one({"email": "admin@kubus.id"})
    staff_u = await db.system_users.find_one({"email": "staff@kubus.id"})
    client_u = await db.system_users.find_one({"email": "client@kubus.id"})

    if not (admin_u and staff_u and client_u):
        return {"skipped": "users not seeded yet"}

    admin_id = admin_u["id"]
    staff_id = staff_u["id"]
    client_id = client_u["id"]
    now = now_iso()

    # ---- Projects ----
    proj1_id = new_id()
    proj2_id = new_id()

    projects = [
        {
            "id": proj1_id, "code": "KTI-0001",
            "name": "Modernisasi Sistem WMS & ERP",
            "client_id": client_id,
            "staff_ids": [staff_id, admin_id],
            "status": "active", "progress": 65,
            "start_date": "2026-01-15", "due_date": "2026-07-30",
            "summary": "Implementasi WMS cloud-native terintegrasi dengan ERP existing untuk meningkatkan akurasi inventori dan efisiensi gudang.",
            "created_at": now, "updated_at": now, "created_by": admin_id, "voided": False,
        },
        {
            "id": proj2_id, "code": "KTI-0002",
            "name": "Platform Mobile B2B Sales",
            "client_id": client_id,
            "staff_ids": [staff_id],
            "status": "active", "progress": 20,
            "start_date": "2026-03-01", "due_date": "2026-09-01",
            "summary": "Aplikasi mobile React Native untuk tim sales B2B dengan fitur katalog produk, pemesanan, dan tracking komisi.",
            "created_at": now, "updated_at": now, "created_by": admin_id, "voided": False,
        },
    ]
    await db.pm_projects.insert_many(projects)

    # ---- Milestones ----
    milestones = [
        # Project 1 milestones
        {"id": new_id(), "project_id": proj1_id, "title": "Analisis Kebutuhan & Desain Sistem",
         "description": "Wawancara stakeholder, dokumentasi alur proses, wireframe.",
         "status": "done", "order": 1, "due_date": "2026-02-15",
         "completed_at": "2026-02-14", "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj1_id, "title": "Pengembangan Backend & Database",
         "description": "API WMS, skema database, integrasi RFID middleware.",
         "status": "done", "order": 2, "due_date": "2026-04-01",
         "completed_at": "2026-03-28", "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj1_id, "title": "Pengembangan Frontend & Dashboard",
         "description": "Dashboard control tower, laporan inventori, UI picking.",
         "status": "in_progress", "order": 3, "due_date": "2026-06-01",
         "completed_at": None, "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj1_id, "title": "UAT & Go-Live",
         "description": "User acceptance testing, pelatihan pengguna, deployment produksi.",
         "status": "todo", "order": 4, "due_date": "2026-07-30",
         "completed_at": None, "created_at": now, "updated_at": now, "voided": False},
        # Project 2 milestones
        {"id": new_id(), "project_id": proj2_id, "title": "Discovery & UX Research",
         "description": "Riset pengguna, journey mapping, prototype awal.",
         "status": "done", "order": 1, "due_date": "2026-04-01",
         "completed_at": "2026-03-30", "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj2_id, "title": "Desain UI & Sistem Komponen",
         "description": "Figma design system, handoff ke developer.",
         "status": "in_progress", "order": 2, "due_date": "2026-05-15",
         "completed_at": None, "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj2_id, "title": "Pengembangan Aplikasi Mobile",
         "description": "React Native implementation, API integration.",
         "status": "todo", "order": 3, "due_date": "2026-07-30",
         "completed_at": None, "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj2_id, "title": "Testing & Deploy",
         "description": "QA, beta testing, App Store / Play Store deployment.",
         "status": "todo", "order": 4, "due_date": "2026-09-01",
         "completed_at": None, "created_at": now, "updated_at": now, "voided": False},
    ]
    await db.pm_milestones.insert_many(milestones)

    # ---- Documents (metadata only, demo) ----
    docs = [
        {"id": new_id(), "project_id": proj1_id, "name": "SRS_WMS_v2.1.pdf",
         "path": "demo/srs.pdf", "url": "", "content_type": "application/pdf",
         "size": 2048000, "uploaded_by": staff_id, "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj1_id, "name": "Wireframe_Dashboard.pdf",
         "path": "demo/wireframe.pdf", "url": "", "content_type": "application/pdf",
         "size": 1024000, "uploaded_by": staff_id, "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj2_id, "name": "UX_Research_Report.pdf",
         "path": "demo/ux_research.pdf", "url": "", "content_type": "application/pdf",
         "size": 3072000, "uploaded_by": staff_id, "created_at": now, "updated_at": now, "voided": False},
    ]
    await db.pm_documents.insert_many(docs)

    # ---- Approvals ----
    approvals = [
        {"id": new_id(), "project_id": proj1_id, "milestone_id": None,
         "title": "Persetujuan Desain Database Schema",
         "note": "Mohon review dan setujui skema database sebelum mulai development.",
         "status": "approved", "feedback": "Disetujui. Lanjutkan development.",
         "requested_by": client_id, "decided_by": staff_id, "decided_at": now,
         "created_at": now, "updated_at": now, "voided": False},
        {"id": new_id(), "project_id": proj1_id, "milestone_id": None,
         "title": "Review Wireframe Dashboard",
         "note": "Silakan review wireframe dashboard sebelum masuk fase development frontend.",
         "status": "pending", "feedback": "",
         "requested_by": staff_id, "decided_by": None, "decided_at": None,
         "created_at": now, "updated_at": now, "voided": False},
    ]
    await db.pm_approvals.insert_many(approvals)

    # ---- Invoices ----
    invoices = [
        {
            "id": new_id(), "number": "INV-0001",
            "project_id": proj1_id, "client_id": client_id,
            "items": [
                {"description": "Fase 1: Analisis & Desain Sistem", "quantity": 1, "unit_price": 25000000},
                {"description": "Fase 2: Backend Development", "quantity": 1, "unit_price": 50000000},
            ],
            "amount": 75000000, "currency": "IDR", "status": "paid",
            "notes": "Terima kasih atas kepercayaan Anda.",
            "issued_at": "2026-03-01", "due_at": "2026-03-15", "paid_at": "2026-03-12",
            "created_at": now, "updated_at": now, "created_by": admin_id, "voided": False,
        },
        {
            "id": new_id(), "number": "INV-0002",
            "project_id": proj1_id, "client_id": client_id,
            "items": [
                {"description": "Fase 3: Frontend & Dashboard Development", "quantity": 1, "unit_price": 40000000},
            ],
            "amount": 40000000, "currency": "IDR", "status": "unpaid",
            "notes": "Mohon lakukan pembayaran sebelum tanggal jatuh tempo.",
            "issued_at": "2026-05-15", "due_at": "2026-06-01", "paid_at": None,
            "created_at": now, "updated_at": now, "created_by": admin_id, "voided": False,
        },
        {
            "id": new_id(), "number": "INV-0003",
            "project_id": proj2_id, "client_id": client_id,
            "items": [
                {"description": "Discovery & UX Research Phase", "quantity": 1, "unit_price": 15000000},
            ],
            "amount": 15000000, "currency": "IDR", "status": "paid",
            "notes": "",
            "issued_at": "2026-04-05", "due_at": "2026-04-20", "paid_at": "2026-04-18",
            "created_at": now, "updated_at": now, "created_by": admin_id, "voided": False,
        },
    ]
    await db.billing_invoices.insert_many(invoices)

    # ---- Chat Threads + Messages ----
    thread1_id = new_id()
    chat_threads = [
        {
            "id": thread1_id, "project_id": proj1_id, "client_id": client_id,
            "staff_ids": [staff_id, admin_id], "subject": "Diskusi Proyek WMS & ERP",
            "last_message_at": now, "created_at": now, "updated_at": now,
            "created_by": admin_id, "voided": False,
        },
    ]
    await db.chat_threads.insert_many(chat_threads)

    chat_messages = [
        {"id": new_id(), "thread_id": thread1_id, "sender_id": staff_id,
         "body": "Halo! Milestone analisis kebutuhan sudah selesai. Dokumen SRS versi 2.1 sudah diupload. Mohon review dan berikan feedback.",
         "attachments": [], "created_at": "2026-02-14T09:00:00+00:00", "updated_at": now, "voided": False},
        {"id": new_id(), "thread_id": thread1_id, "sender_id": client_id,
         "body": "Terima kasih! Sudah saya review. Secara keseluruhan sudah bagus. Ada satu pertanyaan mengenai integrasi RFID dengan sistem ERP existing kami - apakah bisa di-customize?",
         "attachments": [], "created_at": "2026-02-14T14:30:00+00:00", "updated_at": now, "voided": False},
        {"id": new_id(), "thread_id": thread1_id, "sender_id": staff_id,
         "body": "Tentu bisa. Middleware RFID yang kami rancang menggunakan arsitektur adapter pattern, jadi integrasi dengan berbagai vendor ERP dapat dikonfigurasi tanpa ubah core system. Kami akan jelaskan lebih detail di meeting technical review minggu depan.",
         "attachments": [], "created_at": "2026-02-15T08:00:00+00:00", "updated_at": now, "voided": False},
        {"id": new_id(), "thread_id": thread1_id, "sender_id": client_id,
         "body": "Oke, siap. Kami tunggu update selanjutnya. Apakah jadwal frontend development masih on-track?",
         "attachments": [], "created_at": now, "updated_at": now, "voided": False},
    ]
    await db.chat_messages.insert_many(chat_messages)

    return {
        "pm_projects": len(projects),
        "pm_milestones": len(milestones),
        "pm_documents": len(docs),
        "pm_approvals": len(approvals),
        "billing_invoices": len(invoices),
        "chat_threads": len(chat_threads),
        "chat_messages": len(chat_messages),
    }
