"""Lightweight in-process TTL cache (Phase 13).

No external dependency. Async-safe (single asyncio loop). Keys are namespaced
so individual collections can be invalidated atomically when admins write.

Usage:
    from cache import cache_get, cache_set, invalidate_ns, cached

    # Manual API
    data = cache_get("ns", "key")
    cache_set("ns", "key", value, ttl=60)
    invalidate_ns("ns")

    # Decorator API
    @cached("public_content", ttl=60, key_fn=lambda col, slug=None: f"{col}:{slug or 'list'}")
    async def list_items(col: str, slug: str | None = None): ...

Design notes:
  * Avoid pickling; we store raw Python objects. Caller MUST treat returned
    objects as immutable (or .copy() before mutating).
  * Use `asyncio.Lock` per namespace to avoid thundering-herd on cache miss.
  * Trivial size: O(N) entries; suitable for low-volume CMS read traffic.
"""
from __future__ import annotations

import asyncio
import copy
import time
from functools import wraps
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

# In-memory store: ns -> key -> (value, expires_at)
_store: Dict[str, Dict[str, Tuple[Any, float]]] = {}
_locks: Dict[str, asyncio.Lock] = {}

# Counters (lightweight observability)
_stats: Dict[str, int] = {"hits": 0, "misses": 0, "sets": 0, "invalidations": 0}


def _ns_bucket(ns: str) -> Dict[str, Tuple[Any, float]]:
    return _store.setdefault(ns, {})


def _ns_lock(ns: str) -> asyncio.Lock:
    lock = _locks.get(ns)
    if lock is None:
        lock = asyncio.Lock()
        _locks[ns] = lock
    return lock


def cache_get(ns: str, key: str) -> Optional[Any]:
    """Return cached value or None if expired/missing."""
    bucket = _ns_bucket(ns)
    item = bucket.get(key)
    if not item:
        _stats["misses"] += 1
        return None
    value, expires_at = item
    if expires_at < time.time():
        bucket.pop(key, None)
        _stats["misses"] += 1
        return None
    _stats["hits"] += 1
    return value


def cache_set(ns: str, key: str, value: Any, ttl: float = 60.0) -> None:
    """Store value (deep-copied to prevent caller mutation leakage)."""
    bucket = _ns_bucket(ns)
    try:
        stored = copy.deepcopy(value)
    except Exception:  # noqa: BLE001 - non-deepcopy-safe fallback
        stored = value
    bucket[key] = (stored, time.time() + ttl)
    _stats["sets"] += 1


def invalidate_ns(ns: str) -> None:
    """Remove all entries in a namespace (call after writes)."""
    _store.pop(ns, None)
    _stats["invalidations"] += 1


def invalidate_key(ns: str, key: str) -> None:
    bucket = _store.get(ns)
    if bucket is not None:
        bucket.pop(key, None)
        _stats["invalidations"] += 1


def cache_stats() -> Dict[str, int]:
    """Return a shallow copy of internal stats + size info."""
    size = sum(len(b) for b in _store.values())
    return {**_stats, "size": size, "namespaces": len(_store)}


def clear_all() -> None:
    """Wipe the entire cache (use only in tests / startup)."""
    _store.clear()
    _stats.update({"hits": 0, "misses": 0, "sets": 0, "invalidations": 0})


def cached(
    ns: str,
    ttl: float = 60.0,
    key_fn: Optional[Callable[..., str]] = None,
) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    """Decorator that caches the result of an async function.

    Args:
        ns: namespace (e.g. "public_content")
        ttl: time-to-live in seconds
        key_fn: callable returning the cache key from the wrapped function args.
                If omitted, args/kwargs repr is used.
    """

    def deco(fn: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(fn)
        async def wrapper(*args, **kwargs):  # noqa: ANN002
            if key_fn is None:
                key = f"{fn.__name__}:{args}:{tuple(sorted(kwargs.items()))}"
            else:
                key = key_fn(*args, **kwargs)
            existing = cache_get(ns, key)
            if existing is not None:
                return existing
            # serialize concurrent misses for same key
            lock = _ns_lock(ns)
            async with lock:
                existing = cache_get(ns, key)
                if existing is not None:
                    return existing
                result = await fn(*args, **kwargs)
                cache_set(ns, key, result, ttl=ttl)
                return result

        return wrapper

    return deco
