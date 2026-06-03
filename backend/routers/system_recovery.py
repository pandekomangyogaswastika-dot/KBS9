"""System Recovery — Export & Import CMS/System data.
Allows admin to export selected collections to JSON/ZIP and restore from backup.
"""
import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core_utils import new_id, now_iso, serialize_list
from db import get_db
from security import require_role

router = APIRouter(prefix="/api/admin/recovery", tags=["System Recovery"])

# Collections available for export/import
EXPORTABLE_COLLECTIONS = {
    "cms_services": "Layanan",
    "cms_cases": "Studi Kasus",
    "cms_tech": "Tech Stack",
    "cms_team": "Tim",
    "cms_clients": "Klien",
    "cms_blog": "Blog",
    "cms_careers": "Karir",
    "cms_home_blocks": "Home Sections",
    "cms_partners": "Partners",
    "cms_pages": "Settings Halaman",
    "assessment_templates": "Assessment Templates",
    "cms_testimonials": "Testimonials",
    "cms_faq": "FAQ",
    "cms_legal": "Legal Pages",
    "cms_packages": "Paket Harga",
    "cms_resources": "Resources",
}


@router.get("/collections")
async def list_collections(_user=Depends(require_role("admin"))):
    """List all exportable collections with document counts."""
    db = get_db()
    result = []
    for col_name, label in EXPORTABLE_COLLECTIONS.items():
        try:
            count = await db[col_name].count_documents({"voided": {"$ne": True}})
        except Exception:
            count = 0
        result.append({"collection": col_name, "label": label, "count": count})
    return {"success": True, "data": result}


@router.get("/export")
async def export_data(
    collections: str = Query(default="", description="Comma-separated collection names, empty = all"),
    format: str = Query(default="json", description="json or zip"),
    _user=Depends(require_role("admin")),
):
    """Export selected collections as JSON or ZIP archive."""
    db = get_db()
    selected = [c.strip() for c in collections.split(",") if c.strip()] if collections else list(EXPORTABLE_COLLECTIONS.keys())
    # Validate
    invalid = [c for c in selected if c not in EXPORTABLE_COLLECTIONS]
    if invalid:
        raise HTTPException(status_code=400, detail={"code": "INVALID_COLLECTIONS", "message": f"Collection tidak dikenal: {invalid}"})

    export_data: dict[str, Any] = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "version": "1.0",
        "collections": {},
    }
    total_docs = 0
    for col_name in selected:
        docs = serialize_list(await db[col_name].find({"voided": {"$ne": True}}).to_list(10000))
        export_data["collections"][col_name] = docs
        total_docs += len(docs)

    export_data["total_documents"] = total_docs

    json_bytes = json.dumps(export_data, ensure_ascii=False, indent=2).encode("utf-8")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if format == "zip":
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"backup_{timestamp}.json", json_bytes)
            # Also write a readme
            readme = f"""KBS System Backup
Exported: {export_data['exported_at']}
Collections: {', '.join(selected)}
Total documents: {total_docs}

Restore via: Admin → System Recovery → Import
""".encode()
            zf.writestr("README.txt", readme)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=kbs_backup_{timestamp}.zip"},
        )

    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=kbs_backup_{timestamp}.json"},
    )


class ImportOptions(BaseModel):
    strategy: str = "add_missing"  # add_missing | replace_all | replace_collection
    collections: list[str] | None = None  # None = all in file


@router.post("/import")
async def import_data(
    file: UploadFile = File(...),
    strategy: str = Query(default="add_missing", description="add_missing | replace_all | replace_collection"),
    collections: str = Query(default="", description="Comma-separated collections to restore, empty = all in file"),
    _user=Depends(require_role("admin")),
):
    """Import data from a backup file (JSON or ZIP).
    
    Strategies:
    - add_missing: Only insert documents not yet present (by id)
    - replace_all: Upsert all documents (insert new, update existing by id)
    - replace_collection: Drop collection then re-insert all (DESTRUCTIVE)
    """
    raw = await file.read()
    filename = file.filename or ""

    # Detect and extract JSON
    json_str: str
    if filename.endswith(".zip"):
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                json_files = [n for n in zf.namelist() if n.endswith(".json")]
                if not json_files:
                    raise HTTPException(status_code=400, detail={"code": "NO_JSON", "message": "ZIP tidak mengandung file .json"})
                json_str = zf.read(json_files[0]).decode("utf-8")
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail={"code": "BAD_ZIP", "message": "File ZIP tidak valid"})
    elif filename.endswith(".json"):
        json_str = raw.decode("utf-8")
    else:
        raise HTTPException(status_code=415, detail={"code": "BAD_FORMAT", "message": "File harus .json atau .zip"})

    try:
        backup = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail={"code": "INVALID_JSON", "message": f"JSON tidak valid: {e}"})

    if "collections" not in backup:
        raise HTTPException(status_code=400, detail={"code": "BAD_STRUCTURE", "message": "Backup tidak memiliki key 'collections'"})

    # Determine which collections to restore
    available = list(backup["collections"].keys())
    selected_cols = [c.strip() for c in collections.split(",") if c.strip()] if collections else available
    unknown = [c for c in selected_cols if c not in available]
    if unknown:
        raise HTTPException(status_code=400, detail={"code": "MISSING_COLLECTIONS", "message": f"Collection tidak ada di backup: {unknown}"})

    db = get_db()
    report: dict[str, Any] = {"strategy": strategy, "results": {}, "total_inserted": 0, "total_updated": 0, "total_skipped": 0}

    for col_name in selected_cols:
        docs = backup["collections"].get(col_name, [])
        col = db[col_name]
        inserted = updated = skipped = 0

        if strategy == "replace_collection":
            await col.delete_many({})

        for doc in docs:
            if not doc.get("id"):
                doc["id"] = new_id()
            if strategy == "add_missing":
                existing = await col.find_one({"id": doc["id"]})
                if existing:
                    skipped += 1
                    continue
                try:
                    await col.insert_one(doc)
                    inserted += 1
                except Exception:
                    skipped += 1
            elif strategy in ("replace_all", "replace_collection"):
                # Upsert by id
                result = await col.replace_one({"id": doc["id"]}, doc, upsert=True)
                if result.upserted_id:
                    inserted += 1
                else:
                    updated += 1

        report["results"][col_name] = {"inserted": inserted, "updated": updated, "skipped": skipped}
        report["total_inserted"] += inserted
        report["total_updated"] += updated
        report["total_skipped"] += skipped

    return {"success": True, "data": report}


@router.post("/dedup")
async def dedup_collections(
    collections: str = Query(default="", description="Comma-separated collections, empty = all CMS"),
    _user=Depends(require_role("admin")),
):
    """Remove duplicate documents (by unique fields: slug/name) keeping oldest entry."""
    db = get_db()
    # Unique key per collection
    unique_keys = {
        "cms_services": "slug",
        "cms_cases": "slug",
        "cms_blog": "slug",
        "cms_careers": "slug",
        "cms_tech": "name",
        "cms_team": "name",
        "cms_clients": "name",
        "cms_partners": "name",
        "cms_home_blocks": "key",
    }
    selected = [c.strip() for c in collections.split(",") if c.strip()] if collections else list(unique_keys.keys())
    report: dict[str, Any] = {}

    for col_name in selected:
        key = unique_keys.get(col_name)
        if not key:
            report[col_name] = {"skipped": True, "reason": "No unique key defined"}
            continue
        col = db[col_name]
        removed = 0
        # Get all docs, find duplicates
        all_docs = await col.find({}).sort("created_at", 1).to_list(10000)
        seen: dict = {}
        ids_to_delete = []
        for doc in all_docs:
            val = doc.get(key)
            if val is None:
                continue
            if val in seen:
                ids_to_delete.append(doc.get("_id"))
            else:
                seen[val] = True
        for oid in ids_to_delete:
            await col.delete_one({"_id": oid})
            removed += 1
        report[col_name] = {"removed_duplicates": removed}

    return {"success": True, "data": report}
