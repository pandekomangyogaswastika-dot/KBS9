# KTI_03 — SECURITY STANDARDS

---

## Authentication (JWT)
- Login `POST /api/auth/login` -> akses JWT (HS256), exp ~8 jam.
- Secret dari env `JWT_SECRET` (JANGAN hardcode). Tambahkan ke backend/.env.
- Password hash: `passlib[bcrypt]`. JANGAN simpan plaintext.
- Token disimpan frontend di `localStorage` key `kti_token` + dikirim `Authorization: Bearer`.
- `GET /api/auth/me` mengembalikan profil user dari token.

```python
# bcrypt via passlib
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd.hash(plain)
pwd.verify(plain, hashed)
```
> Catatan: simpan password user via passlib, JANGAN taruh hash bcrypt mentah di .env (karakter $ bisa ter-expand).

---

## Authorization (RBAC)
```
Roles: admin > staff > client > visitor
```
- Dependency `require_role(*roles)` di FastAPI untuk proteksi endpoint.
- Client HANYA boleh akses resource miliknya (filter `client_id == current_user.id`).
- Staff akses project yang di-assign / sesuai permission.
- Admin akses penuh.
- Akun client/staff dibuat HANYA oleh admin/staff (`POST /api/admin/users`). Tidak ada public register.

```python
def require_role(*allowed):
    async def dep(user=Depends(get_current_user)):
        if user["role"] not in allowed:
            raise HTTPException(403, detail={"code":"AUTH_INSUFFICIENT_PERMISSION"})
        return user
    return dep
```

---

## Secrets & Config
- Semua secret di `.env` (JWT_SECRET, EMERGENT_LLM_KEY, MONGO_URL, DB_NAME).
- JANGAN commit secret. JANGAN log/echo secret.
- Input user divalidasi di API layer (Pydantic) sebelum query DB.

---

## Testing Bypass
- Sediakan akun seed (admin/staff/client) untuk testing, catat di `/app/memory/test_credentials.md`.
- Bypass/seed boleh ada saat dev; ingatkan user untuk menonaktifkan sebelum production.

---

## Assessment Public Access
- Assessment session diakses klien via **UUID token** di URL tanpa login (lihat KTI_13).
- Token = UUID v4 yang sulit ditebak; tidak ada listing publik. Submit mengunci session.
