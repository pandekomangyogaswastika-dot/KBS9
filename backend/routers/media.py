"""Media Library (Fase 3B). Upload/serve (Range)/folders/usage. Storage via TD-008 abstraction."""
import io
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from core_utils import new_id, now_iso, paginate_response, serialize_doc, serialize_list, success_response
from db import get_db
from security import require_role
from storage import get_storage

# Admin (auth-gated) and public (read-only file serve) routers.
router = APIRouter(prefix="/api/admin/media")
public_router = APIRouter(prefix="/api/media")

KIND_BY_EXT = {
    "jpg": "image", "jpeg": "image", "png": "image", "webp": "image", "gif": "image", "svg": "image",
    "mp4": "video", "webm": "video",
    "pdf": "document",
}
MIME_BY_EXT = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp",
    "gif": "image/gif", "svg": "image/svg+xml", "mp4": "video/mp4", "webm": "video/webm",
    "pdf": "application/pdf",
}
SIZE_LIMITS = {"image": 10 * 1024 * 1024, "video": 50 * 1024 * 1024, "document": 20 * 1024 * 1024}


def _ext_of(filename: str) -> str:
    return (filename.rsplit(".", 1)[-1] if filename and "." in filename else "").lower()


def _image_dims(data: bytes, ext: str):
    if ext == "svg":
        return None, None
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(data))
        return int(im.width), int(im.height)
    except Exception:
        return None, None


async def _save_one(db, storage, f: UploadFile, folder_id, user):
    ext = _ext_of(f.filename or "")
    kind = KIND_BY_EXT.get(ext)
    if not kind:
        raise HTTPException(status_code=422, detail={"code": "MEDIA_UNSUPPORTED_TYPE", "message": f"Tipe file .{ext or '?'} tidak didukung"})
    data = await f.read()
    if len(data) > SIZE_LIMITS[kind]:
        mb = SIZE_LIMITS[kind] // (1024 * 1024)
        raise HTTPException(status_code=413, detail={"code": "MEDIA_TOO_LARGE", "message": f"File melebihi batas {mb}MB untuk {kind}"})
    width, height = _image_dims(data, ext) if kind == "image" else (None, None)
    key = storage.save(data, ext)
    now = now_iso()
    asset_id = new_id()
    doc = {
        "id": asset_id, "created_at": now, "updated_at": now, "created_by": user["id"],
        "voided": False, "voided_at": None,
        "original_name": f.filename, "filename": key.split("/")[-1],
        "mime_type": f.content_type or MIME_BY_EXT.get(ext, "application/octet-stream"),
        "kind": kind, "size_bytes": len(data), "width": width, "height": height,
        "storage_backend": storage.name, "storage_key": key,
        "url": f"/api/media/file/{asset_id}",
        "folder_id": folder_id or None,
        "alt": {"id": "", "en": ""}, "title": {"id": "", "en": ""}, "tags": [],
    }
    await db.media_assets.insert_one(doc)
    return serialize_doc(dict(doc))


@router.post("/upload", status_code=201)
async def upload(
    files: list[UploadFile] = File(...),
    folder_id: str | None = Form(None),
    user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    storage = get_storage()
    out = []
    for f in files:
        out.append(await _save_one(db, storage, f, folder_id, user))
    return success_response(out)


# ---- Folders (declare BEFORE /{asset_id} to avoid route capture) ----------
class FolderIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    parent_id: str | None = None


class FolderPatch(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@router.get("/folders")
async def list_folders(_user=Depends(require_role("admin", "staff"))):
    db = get_db()
    docs = await db.media_folders.find({"voided": {"$ne": True}}).sort("name", 1).to_list(200)
    return success_response(serialize_list(docs))


@router.post("/folders", status_code=201)
async def create_folder(payload: FolderIn, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    now = now_iso()
    doc = {"id": new_id(), "created_at": now, "updated_at": now, "created_by": user["id"],
           "voided": False, "name": payload.name.strip(), "parent_id": payload.parent_id, "order": 0}
    await db.media_folders.insert_one(doc)
    return success_response(serialize_doc(dict(doc)))


@router.patch("/folders/{folder_id}")
async def rename_folder(folder_id: str, payload: FolderPatch, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    res = await db.media_folders.update_one({"id": folder_id, "voided": {"$ne": True}}, {"$set": {"name": payload.name.strip(), "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Folder tidak ditemukan"})
    return success_response({"id": folder_id, "name": payload.name.strip()})


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    res = await db.media_folders.update_one({"id": folder_id, "voided": {"$ne": True}}, {"$set": {"voided": True, "voided_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Folder tidak ditemukan"})
    await db.media_assets.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None, "updated_at": now_iso()}})
    return success_response({"id": folder_id})


# ---- Assets ----------------------------------------------------------------
@router.get("")
async def list_media(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    kind: str | None = None,
    folder_id: str | None = None,
    search: str | None = None,
    _user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    flt = {"voided": {"$ne": True}}
    if kind in {"image", "video", "document"}:
        flt["kind"] = kind
    if folder_id:
        flt["folder_id"] = folder_id
    if search:
        rx = {"$regex": re.escape(search), "$options": "i"}
        flt["$or"] = [{"original_name": rx}, {"tags": rx}, {"title.id": rx}, {"title.en": rx}]
    total = await db.media_assets.count_documents(flt)
    cursor = db.media_assets.find(flt).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    docs = serialize_list(await cursor.to_list(limit))
    return paginate_response(docs, total, page, limit)


@router.get("/{asset_id}")
async def get_media(asset_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    doc = await db.media_assets.find_one({"id": asset_id, "voided": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Aset tidak ditemukan"})
    return success_response(serialize_doc(doc))


class MediaPatch(BaseModel):
    alt: dict | None = None
    title: dict | None = None
    tags: list[str] | None = None
    folder_id: str | None = None
    folder_id_set: bool = False


@router.patch("/{asset_id}")
async def patch_media(asset_id: str, payload: MediaPatch, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    asset = await db.media_assets.find_one({"id": asset_id, "voided": {"$ne": True}})
    if not asset:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Aset tidak ditemukan"})
    updates = {}
    if payload.alt is not None:
        updates["alt"] = {"id": str(payload.alt.get("id", "")), "en": str(payload.alt.get("en", ""))}
    if payload.title is not None:
        updates["title"] = {"id": str(payload.title.get("id", "")), "en": str(payload.title.get("en", ""))}
    if payload.tags is not None:
        updates["tags"] = [str(t).strip() for t in payload.tags if str(t).strip()]
    if payload.folder_id_set:
        updates["folder_id"] = payload.folder_id or None
    if updates:
        updates["updated_at"] = now_iso()
        await db.media_assets.update_one({"id": asset_id}, {"$set": updates})
    fresh = await db.media_assets.find_one({"id": asset_id})
    return success_response(serialize_doc(fresh))


@router.post("/{asset_id}/replace")
async def replace_media(asset_id: str, file: UploadFile = File(...), _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    asset = await db.media_assets.find_one({"id": asset_id, "voided": {"$ne": True}})
    if not asset:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Aset tidak ditemukan"})
    ext = _ext_of(file.filename or "")
    kind = KIND_BY_EXT.get(ext)
    if not kind or kind != asset["kind"]:
        raise HTTPException(status_code=422, detail={"code": "MEDIA_KIND_MISMATCH", "message": "Tipe file pengganti harus sama dengan aslinya"})
    data = await file.read()
    if len(data) > SIZE_LIMITS[kind]:
        mb = SIZE_LIMITS[kind] // (1024 * 1024)
        raise HTTPException(status_code=413, detail={"code": "MEDIA_TOO_LARGE", "message": f"File melebihi batas {mb}MB"})
    storage = get_storage()
    width, height = _image_dims(data, ext) if kind == "image" else (None, None)
    new_key = storage.save(data, ext)
    old_key = asset.get("storage_key")
    await db.media_assets.update_one({"id": asset_id}, {"$set": {
        "storage_key": new_key, "filename": new_key.split("/")[-1], "size_bytes": len(data),
        "width": width, "height": height, "mime_type": file.content_type or MIME_BY_EXT.get(ext), "updated_at": now_iso(),
    }})
    if old_key and old_key != new_key:
        storage.delete(old_key)
    fresh = await db.media_assets.find_one({"id": asset_id})
    return success_response(serialize_doc(fresh))


@router.get("/{asset_id}/usage")
async def media_usage(asset_id: str, _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    docs = await db.media_usage.find({"asset_id": asset_id}).to_list(200)
    return success_response(serialize_list(docs))


@router.delete("/{asset_id}")
async def delete_media(asset_id: str, force: bool = Query(False), _user=Depends(require_role("admin", "staff"))):
    db = get_db()
    asset = await db.media_assets.find_one({"id": asset_id, "voided": {"$ne": True}})
    if not asset:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Aset tidak ditemukan"})
    usage_count = await db.media_usage.count_documents({"asset_id": asset_id})
    if usage_count > 0 and not force:
        raise HTTPException(status_code=409, detail={"code": "MEDIA_IN_USE", "message": f"Aset masih dipakai di {usage_count} tempat", "details": [usage_count]})
    await db.media_assets.update_one({"id": asset_id}, {"$set": {"voided": True, "voided_at": now_iso(), "updated_at": now_iso()}})
    return success_response({"id": asset_id})


# ---- Public file serving (Range support, read-only) ------------------------
def _range_response(path, content_type: str, request: Request):
    file_size = path.stat().st_size
    range_header = request.headers.get("range")
    if range_header:
        try:
            _units, rng = range_header.split("=", 1)
            start_s, end_s = rng.split("-", 1)
            start = int(start_s) if start_s.strip() else 0
            end = int(end_s) if end_s.strip() else file_size - 1
        except Exception:
            start, end = 0, file_size - 1
        start = max(0, start)
        end = min(end, file_size - 1)
        if start > end:
            start = 0
        length = end - start + 1

        def iterfile():
            with open(path, "rb") as fh:
                fh.seek(start)
                remaining = length
                chunk = 256 * 1024
                while remaining > 0:
                    data = fh.read(min(chunk, remaining))
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Cache-Control": "public, max-age=3600",
        }
        return StreamingResponse(iterfile(), status_code=206, headers=headers, media_type=content_type)
    return FileResponse(path, media_type=content_type, headers={"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600"})


@public_router.get("/file/{asset_id}")
async def serve_file(asset_id: str, request: Request):
    db = get_db()
    asset = await db.media_assets.find_one({"id": asset_id, "voided": {"$ne": True}})
    if not asset:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "File tidak ditemukan"})
    storage = get_storage()
    p = storage.path(asset["storage_key"])
    if not p.exists():
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "File tidak tersedia"})
    return _range_response(p, asset.get("mime_type", "application/octet-stream"), request)
