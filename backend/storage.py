"""Storage abstraction (TD-008). LOCAL-first, swappable to object storage later.

Env `STORAGE_BACKEND=local|object` (default local). Never hardcode the backend
in calling code — always go through `get_storage()`.
"""
import os
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path

BASE_UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))


class StorageBackend(ABC):
    name = "base"

    @abstractmethod
    def save(self, data: bytes, ext: str) -> str:
        """Persist bytes; return an opaque storage key."""

    @abstractmethod
    def delete(self, key: str) -> None:
        ...

    @abstractmethod
    def exists(self, key: str) -> bool:
        ...

    @abstractmethod
    def path(self, key: str) -> Path:
        ...


class LocalStorageBackend(StorageBackend):
    name = "local"

    def __init__(self, base: Path = BASE_UPLOAD_DIR):
        self.base = base
        self.base.mkdir(parents=True, exist_ok=True)

    def _full(self, key: str) -> Path:
        return self.base / key

    def save(self, data: bytes, ext: str) -> str:
        now = datetime.now(timezone.utc)
        ext = (ext or "bin").lstrip(".").lower()
        key = f"{now:%Y}/{now:%m}/{uuid.uuid4().hex}.{ext}"
        full = self._full(key)
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(data)
        return key

    def delete(self, key: str) -> None:
        try:
            self._full(key).unlink()
        except FileNotFoundError:
            pass

    def exists(self, key: str) -> bool:
        return self._full(key).exists()

    def path(self, key: str) -> Path:
        return self._full(key)


_storage = None


def get_storage() -> StorageBackend:
    global _storage
    if _storage is None:
        backend = os.environ.get("STORAGE_BACKEND", "local").lower()
        if backend == "object":
            # ObjectStorageBackend (S3-compatible) disiapkan saat migrasi (TD-008).
            raise RuntimeError("ObjectStorageBackend belum diimplementasikan; gunakan STORAGE_BACKEND=local")
        _storage = LocalStorageBackend()
    return _storage
