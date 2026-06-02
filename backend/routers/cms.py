"""Advanced CMS (Fase 3C). Generic schema-light CRUD for all cms_* collections.

The public site already reads these collections (routers/content.py), so admin
edits reflect on the public site once published. Bilingual fields ({id,en}) and
nested arrays are stored as-is from the client; base/system fields are enforced.
"""
import csv
import io
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import require_role
from routers.content import invalidate_public_cache

router = APIRouter(prefix="/api/admin/cms")

RESOURCES = {
    # ── Original collections ─────────────────────────────────────────────────
    "services":    "cms_services",
    "cases":       "cms_cases",
    "team":        "cms_team",
    "clients":     "cms_clients",
    "tech":        "cms_tech",
    "blog":        "cms_blog",
    "careers":     "cms_careers",
    "home-blocks": "cms_home_blocks",
    # ── Phase 19 collections (public-facing, default published) ──────────────
    "testimonials": "cms_testimonials",
    "faq":          "cms_faq",
    "packages":     "cms_packages",
    "resources":    "cms_resources",
    "legal":        "cms_legal_pages",
    # ── Phase 20 collections (content system with templates + blocks) ────────
    "portfolios":    "cms_portfolios",
    "case-studies":  "cms_case_studies",
    "products":      "cms_products",
    # ── Phase 20 P2: Partners ────────────────────────────────────────────────
    "partners":      "cms_partners",
}

# Collections where newly created items should default to "published"
# (public readers filter by status=published; content editors expect instant visibility)
PUBLISH_BY_DEFAULT = {"testimonials", "faq", "packages", "resources", "legal", "home-blocks", "portfolios", "case-studies", "products", "partners"}

PROTECTED = {"id", "created_at", "created_by", "voided", "voided_at", "_id"}


# Mapping from admin resource key → public collection name (for cache invalidation)
# Phase 19 resources have dedicated public routers with their own in-memory caches;
# we flush the shared cache by collection name.
_CACHE_ALIAS: dict[str, str] = {
    "testimonials": "cms_testimonials",
    "faq":          "cms_faq",
    "packages":     "cms_packages",
    "resources":    "cms_resources",
    "legal":        "cms_legal_pages",
}

def _invalidate(resource: str, slug: str | None = None) -> None:
    col = RESOURCES.get(resource)
    if col:
        invalidate_public_cache(col, slug)


def _col(resource: str) -> str:
    col = RESOURCES.get(resource)
    if not col:
        raise HTTPException(status_code=404, detail={"code": "RESOURCE_NOT_FOUND", "message": f"Resource '{resource}' tidak dikenal"})
    return col


def _clean(body: dict) -> dict:
    return {k: v for k, v in (body or {}).items() if k not in PROTECTED}


# ---- Settings (declare before /{resource} to avoid capture) ----------------
@router.get("/settings")
async def get_settings(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    doc = await db.cms_pages.find_one({"key": "site", "voided": {"$ne": True}})
    return success_response(serialize_doc(doc) if doc else {})


class SettingsIn(BaseModel):
    data: dict


@router.put("/settings")
async def update_settings(payload: SettingsIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    updates = _clean(payload.data)
    updates.pop("key", None)
    updates["updated_at"] = now_iso()
    existing = await db.cms_pages.find_one({"key": "site"})
    if existing:
        await db.cms_pages.update_one({"key": "site"}, {"$set": updates})
    else:
        now = now_iso()
        await db.cms_pages.insert_one({"id": new_id(), "key": "site", "created_at": now,
                                       "created_by": user["id"], "voided": False, **updates})
    fresh = await db.cms_pages.find_one({"key": "site"})
    # Phase 13: settings flush
    from routers.content import invalidate_public_cache as _flush
    _flush()  # full namespace flush — settings affects whole site
    return success_response(serialize_doc(fresh))


# ---- Generic collection CRUD ----------------------------------------------
@router.get("/{resource}")
async def list_items(resource: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    docs = await db[col].find({"voided": {"$ne": True}}).sort([("order", 1), ("created_at", 1)]).to_list(500)
    return success_response(serialize_list(docs))


@router.post("/{resource}", status_code=201)
async def create_item(resource: str, body: dict, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    doc = _clean(body)
    now = now_iso()
    if "order" not in doc or not isinstance(doc.get("order"), int):
        last = await db[col].find_one({"voided": {"$ne": True}}, sort=[("order", -1)])
        doc["order"] = (last.get("order", 0) + 1) if last and isinstance(last.get("order"), int) else 1
    doc["status"] = doc.get("status") if doc.get("status") in {"draft", "published"} else (
        "published" if resource in PUBLISH_BY_DEFAULT else "draft"
    )
    doc.update({"id": new_id(), "created_at": now, "updated_at": now, "created_by": user["id"],
                "voided": False, "voided_at": None})
    try:
        await db[col].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail={"code": "DUPLICATE_SLUG", "message": "Slug sudah dipakai"})
    _invalidate(resource, doc.get("slug"))
    return success_response(serialize_doc(doc))


@router.get("/{resource}/{item_id}")
async def get_item(resource: str, item_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    doc = await db[col].find_one({"id": item_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Item tidak ditemukan"})
    return success_response(serialize_doc(doc))


@router.patch("/{resource}/{item_id}")
async def update_item(resource: str, item_id: str, body: dict, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    existing = await db[col].find_one({"id": item_id, "voided": {"$ne": True}})
    if not existing:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Item tidak ditemukan"})
    updates = _clean(body)
    if "status" in updates and updates["status"] not in {"draft", "published"}:
        updates.pop("status")
    updates["updated_at"] = now_iso()
    try:
        await db[col].update_one({"id": item_id}, {"$set": updates})
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail={"code": "DUPLICATE_SLUG", "message": "Slug sudah dipakai"})
    fresh = await db[col].find_one({"id": item_id})
    # Invalidate both old slug + new slug to be safe
    _invalidate(resource, existing.get("slug"))
    if fresh and fresh.get("slug") and fresh.get("slug") != existing.get("slug"):
        _invalidate(resource, fresh.get("slug"))
    return success_response(serialize_doc(fresh))


@router.post("/{resource}/{item_id}/publish")
async def publish_item(resource: str, item_id: str, _user=Depends(require_role("admin", "staff"))):
    return await _set_status(resource, item_id, "published")


@router.post("/{resource}/{item_id}/unpublish")
async def unpublish_item(resource: str, item_id: str, _user=Depends(require_role("admin", "staff"))):
    return await _set_status(resource, item_id, "draft")


async def _set_status(resource: str, item_id: str, status: str):
    db = get_db()
    col = _col(resource)
    existing = await db[col].find_one({"id": item_id, "voided": {"$ne": True}}, {"_id": 0, "slug": 1})
    res = await db[col].update_one({"id": item_id, "voided": {"$ne": True}}, {"$set": {"status": status, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Item tidak ditemukan"})
    _invalidate(resource, existing.get("slug") if existing else None)
    return success_response({"id": item_id, "status": status})


@router.delete("/{resource}/{item_id}")
async def delete_item(resource: str, item_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    existing = await db[col].find_one({"id": item_id, "voided": {"$ne": True}}, {"_id": 0, "slug": 1})
    res = await db[col].update_one({"id": item_id, "voided": {"$ne": True}}, {"$set": {"voided": True, "voided_at": now_iso(), "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Item tidak ditemukan"})
    _invalidate(resource, existing.get("slug") if existing else None)
    return success_response({"id": item_id})


class ReorderIn(BaseModel):
    ids: list[str]


@router.post("/{resource}/reorder")
async def reorder_items(resource: str, payload: ReorderIn, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    col = _col(resource)
    now = now_iso()
    for idx, item_id in enumerate(payload.ids):
        await db[col].update_one({"id": item_id}, {"$set": {"order": idx + 1, "updated_at": now}})
    _invalidate(resource)
    return success_response({"count": len(payload.ids)})


# ===========================================================================
# Bulk Import / Export (Phase 20 P2)
# ===========================================================================
EXPORT_PROJECT_OUT = {"_id": 0}


def _flatten_for_csv(doc: dict) -> dict:
    """Convert nested/list fields to JSON strings so CSV remains readable."""
    flat = {}
    for k, v in doc.items():
        if isinstance(v, (dict, list)):
            flat[k] = json.dumps(v, ensure_ascii=False)
        elif v is None:
            flat[k] = ""
        elif isinstance(v, bool):
            flat[k] = "true" if v else "false"
        else:
            flat[k] = v
    return flat


def _parse_csv_value(value: Any) -> Any:
    """Try to parse JSON in CSV string cells; preserve plain strings/numbers."""
    if value is None or value == "":
        return None
    if isinstance(value, (int, float, bool)):
        return value
    s = str(value).strip()
    if not s:
        return None
    # Try JSON parse for arrays/objects/numbers/booleans
    if s.lower() in ("true", "false"):
        return s.lower() == "true"
    if s.startswith(("[", "{")):
        try:
            return json.loads(s)
        except (ValueError, TypeError):
            return s
    # Number?
    try:
        if "." in s:
            return float(s)
        return int(s)
    except (ValueError, TypeError):
        return s


@router.get("/{resource}/bulk-export")
async def bulk_export(
    resource: str,
    format: str = Query("json", regex="^(json|csv)$"),
    include_voided: bool = False,
    _user=Depends(require_role("admin", "staff")),
):
    """Export all items of a resource as JSON or CSV."""
    db = get_db()
    col = _col(resource)
    query: dict[str, Any] = {} if include_voided else {"voided": {"$ne": True}}
    docs = (
        await db[col]
        .find(query, EXPORT_PROJECT_OUT)
        .sort([("order", 1), ("created_at", 1)])
        .to_list(5000)
    )
    docs = [serialize_doc(d) for d in docs]

    if format == "json":
        body = json.dumps(
            {"resource": resource, "count": len(docs), "items": docs},
            ensure_ascii=False,
            indent=2,
            default=str,
        )
        return StreamingResponse(
            iter([body]),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{resource}-export.json"'
            },
        )

    # CSV
    flat = [_flatten_for_csv(d) for d in docs]
    # Build a stable column order: id + slug + common fields first, then rest sorted
    headers_set: set[str] = set()
    for d in flat:
        headers_set.update(d.keys())
    preferred = ["id", "slug", "title", "name", "category", "status", "order", "created_at", "updated_at"]
    rest = sorted(h for h in headers_set if h not in preferred)
    columns = [h for h in preferred if h in headers_set] + rest

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in flat:
        writer.writerow({k: row.get(k, "") for k in columns})
    body = buf.getvalue()
    return StreamingResponse(
        iter([body]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{resource}-export.csv"'
        },
    )


def _coerce_record(record: dict) -> dict:
    """Sanitize an incoming record before upsert:
       - drop forbidden keys (id, created_at, voided, etc.)
       - keep slug if present (used as natural key)
       - parse CSV-stringified fields
    """
    clean = {}
    for k, v in record.items():
        if k in PROTECTED:
            continue
        if k == "_id":
            continue
        clean[k] = _parse_csv_value(v) if not isinstance(v, (dict, list)) else v
    return clean


@router.post("/{resource}/bulk-import")
async def bulk_import(
    resource: str,
    file: UploadFile = File(...),
    mode: str = Query("upsert", regex="^(upsert|replace|insert)$"),
    user=Depends(require_role("admin", "staff")),
):
    """
    Bulk import items into a resource.
    - Accepts JSON ({items:[...]} or array) or CSV file.
    - mode=upsert (default): match by slug; insert if not found, update if found.
    - mode=insert: only insert; skip records whose slug already exists.
    - mode=replace: void all existing items of the resource then insert all records.
    """
    db = get_db()
    col = _col(resource)
    raw = await file.read()
    if not raw:
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_FILE", "message": "File kosong"},
        )

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    is_csv = filename.endswith(".csv") or "csv" in content_type

    items: list[dict] = []
    try:
        if is_csv:
            text = raw.decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(text))
            for row in reader:
                items.append({k: v for k, v in row.items() if k})
        else:
            data = json.loads(raw.decode("utf-8"))
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict) and isinstance(data.get("items"), list):
                items = data["items"]
            else:
                raise HTTPException(
                    status_code=400,
                    detail={"code": "INVALID_FORMAT", "message": "JSON harus berupa array atau {items: [...]}"},
                )
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail={"code": "PARSE_ERROR", "message": f"Gagal parse file: {exc}"},
        ) from exc

    if not items:
        return success_response({"imported": 0, "updated": 0, "skipped": 0, "errors": []})

    now = now_iso()
    inserted = 0
    updated = 0
    skipped = 0
    errors: list[dict] = []

    # Replace mode: void existing items first
    if mode == "replace":
        await db[col].update_many(
            {"voided": {"$ne": True}},
            {"$set": {"voided": True, "voided_at": now, "updated_at": now}},
        )

    for idx, rec in enumerate(items):
        try:
            doc = _coerce_record(rec if isinstance(rec, dict) else {})
            slug = doc.get("slug")

            # default ordering & status
            if "status" not in doc or doc["status"] not in {"draft", "published"}:
                doc["status"] = "published" if resource in PUBLISH_BY_DEFAULT else "draft"

            existing = None
            if slug:
                existing = await db[col].find_one(
                    {"slug": slug, "voided": {"$ne": True}}
                )

            if existing and mode == "insert":
                skipped += 1
                continue

            if existing and mode == "upsert":
                doc["updated_at"] = now
                await db[col].update_one({"id": existing["id"]}, {"$set": doc})
                updated += 1
                continue

            # Insert path
            if "order" not in doc:
                last = await db[col].find_one(
                    {"voided": {"$ne": True}}, sort=[("order", -1)]
                )
                doc["order"] = (last.get("order", 0) + 1) if last and isinstance(last.get("order"), int) else inserted + 1

            doc.update(
                {
                    "id": new_id(),
                    "created_at": now,
                    "updated_at": now,
                    "created_by": user["id"] if isinstance(user, dict) else None,
                    "voided": False,
                    "voided_at": None,
                }
            )
            try:
                await db[col].insert_one(doc)
                inserted += 1
            except DuplicateKeyError:
                errors.append({"index": idx, "slug": slug, "error": "DUPLICATE_SLUG"})
        except Exception as exc:  # noqa: BLE001
            errors.append({"index": idx, "error": str(exc)})

    _invalidate(resource)
    return success_response(
        {
            "imported": inserted,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
            "total_processed": len(items),
        }
    )
