"""Seed akun default untuk testing/dev (KTI_03 testing bypass).
Idempotent: hanya insert jika email belum ada. Kredensial dicatat di
/app/memory/test_credentials.md. NONAKTIFKAN/ganti sebelum production.
"""
from core_utils import new_id, now_iso
from security import hash_password

DEFAULT_USERS = [
    {"email": "admin@kubus.id", "name": "Admin Kubus", "role": "admin", "password": "Admin#2026", "company": None},
    {"email": "staff@kubus.id", "name": "Staff Kubus", "role": "staff", "password": "Staff#2026", "company": None},
    {"email": "client@kubus.id", "name": "Client Demo", "role": "client", "password": "Client#2026", "company": "PT Demo Klien"},
]


async def seed_users(db):
    created = 0
    for u in DEFAULT_USERS:
        if await db.system_users.find_one({"email": u["email"]}):
            continue
        now = now_iso()
        await db.system_users.insert_one({
            "id": new_id(), "created_at": now, "updated_at": now, "created_by": None,
            "voided": False, "voided_at": None,
            "email": u["email"], "name": u["name"], "role": u["role"],
            "password_hash": hash_password(u["password"]), "status": "active",
            "company": u["company"], "phone": None, "locale": "id", "last_login_at": None,
        })
        created += 1
    return created
