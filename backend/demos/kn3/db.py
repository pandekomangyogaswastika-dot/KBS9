"""Demo DB proxy untuk KN3 — baca ContextVar per request."""
from demo_context import get_kn3_demo_db


class _DemoDbProxy:
    """
    Proxy yang mengembalikan collection dari database demo session saat ini.
    KN3 routers mengimport `from demos.kn3.db import db` dan menggunakannya
    seperti Motor database biasa. Proxy ini mengalihkan semua akses ke
    isolated database per demo session.
    """

    def __getattr__(self, name: str):
        db = get_kn3_demo_db()
        if db is None:
            raise RuntimeError(
                f"[Demo KN3] No DB context set for this request. "
                f"Pastikan request melalui /api/demo/kn3/ route."
            )
        return getattr(db, name)

    def __getitem__(self, name: str):
        db = get_kn3_demo_db()
        if db is None:
            raise RuntimeError("[Demo KN3] No DB context")
        return db[name]


# Singleton proxy — dipakai oleh semua demo.kn3 routers & services
db = _DemoDbProxy()
