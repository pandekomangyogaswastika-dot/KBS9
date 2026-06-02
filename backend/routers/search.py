"""Advanced global search (Phase 14) — RBAC-safe across CMS + Portal.

Endpoints:
  - GET  /api/search        → public CMS-only search (no auth)
  - GET  /api/portal/search → authenticated search (CMS + projects/approvals/
                              documents/leads, scoped per role)

Search strategy:
  1. Try MongoDB `$text` (uses bilingual text indexes created in Phase 13).
  2. Fallback to case-insensitive regex on the most relevant fields when
     `$text` returns zero hits (so partial words / very short queries still
     find something).

Output shape (stable, easy to consume from frontend):
{
  "query": "foo",
  "took_ms": 12,
  "total": 7,
  "groups": [
    {
      "type": "services",
      "label": "Services",
      "count": 2,
      "items": [
        { "id": "...", "type": "services", "title": "...", "summary": "...",
          "url": "/services/some-slug", "score": 1.2 }
      ]
    },
    ...
  ]
}
"""
from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Sequence

from fastapi import APIRouter, Depends, Query
from pymongo.errors import OperationFailure

from cache import cached
from core_utils import success_response
from db import get_db
from security import get_current_user

router = APIRouter()


# --------------------------------------------------------------------------- #
# Configuration                                                               #
# --------------------------------------------------------------------------- #

PUBLIC_TYPES = ("services", "cases", "blog", "careers")
PORTAL_EXTRA_TYPES = ("projects", "approvals", "documents", "leads")
ALL_PORTAL_TYPES = PUBLIC_TYPES + PORTAL_EXTRA_TYPES

# Maps a public "type" key to backing collection + URL builder + lang fields.
_PUBLIC_SPEC: Dict[str, Dict[str, Any]] = {
    "services": {
        "collection": "cms_services",
        "label_id": "Layanan",
        "label_en": "Services",
        "url": lambda doc: f"/services/{doc.get('slug', '')}",
        "title_fields": ("title.id", "title.en", "title"),
        "summary_fields": ("summary.id", "summary.en", "summary"),
        "regex_fields": ("title.id", "title.en", "summary.id", "summary.en", "slug"),
    },
    "cases": {
        "collection": "cms_cases",
        "label_id": "Studi Kasus",
        "label_en": "Cases",
        "url": lambda doc: f"/cases/{doc.get('slug', '')}",
        "title_fields": ("title.id", "title.en", "title"),
        "summary_fields": ("summary.id", "summary.en", "summary"),
        "regex_fields": ("title.id", "title.en", "summary.id", "summary.en", "slug"),
    },
    "blog": {
        "collection": "cms_blog",
        "label_id": "Artikel",
        "label_en": "Blog",
        "url": lambda doc: f"/blog/{doc.get('slug', '')}",
        "title_fields": ("title.id", "title.en", "title"),
        "summary_fields": ("summary.id", "summary.en", "summary"),
        "regex_fields": ("title.id", "title.en", "summary.id", "summary.en", "slug"),
    },
    "careers": {
        "collection": "cms_careers",
        "label_id": "Karier",
        "label_en": "Careers",
        "url": lambda doc: f"/career/{doc.get('slug', '')}",
        "title_fields": ("title.id", "title.en", "title"),
        "summary_fields": ("summary.id", "summary.en", "summary"),
        "regex_fields": ("title.id", "title.en", "summary.id", "summary.en", "slug"),
    },
}


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #


def _pick(doc: Dict[str, Any], fields: Sequence[str]) -> str:
    """Return the first non-empty value from `fields` (supports dotted keys)."""
    for f in fields:
        cur: Any = doc
        for part in f.split("."):
            if not isinstance(cur, dict):
                cur = None
                break
            cur = cur.get(part)
        if cur:
            return str(cur)
    return ""


def _snippet(text: str, query: str, *, max_len: int = 160) -> str:
    """Return a short snippet around the first match of `query` in `text`."""
    if not text:
        return ""
    if not query:
        return text[:max_len] + ("…" if len(text) > max_len else "")
    low_text = text.lower()
    low_q = query.lower()
    idx = low_text.find(low_q)
    if idx < 0:
        return text[:max_len] + ("…" if len(text) > max_len else "")
    start = max(0, idx - 40)
    end = min(len(text), idx + len(query) + 80)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return f"{prefix}{text[start:end]}{suffix}"


def _build_item(doc: Dict[str, Any], type_: str, query: str) -> Dict[str, Any]:
    spec = _PUBLIC_SPEC[type_]
    title = _pick(doc, spec["title_fields"]) or doc.get("slug") or doc.get("id") or "—"
    summary = _pick(doc, spec["summary_fields"]) or ""
    url = spec["url"](doc)
    return {
        "id": doc.get("id") or str(doc.get("_id", "")),
        "type": type_,
        "title": title,
        "summary": summary,
        "snippet": _snippet(summary or title, query),
        "url": url,
        "score": doc.get("score"),
    }


async def _public_search_type(
    type_: str, query: str, limit: int
) -> List[Dict[str, Any]]:
    """Search a single public CMS collection."""
    spec = _PUBLIC_SPEC.get(type_)
    if not spec:
        return []
    db = get_db()
    col = db[spec["collection"]]
    base_filter = {"voided": {"$ne": True}, "status": "published"}

    # 1) Text search (uses Phase 13 bilingual text indexes)
    docs: List[Dict[str, Any]] = []
    try:
        cursor = col.find(
            {**base_filter, "$text": {"$search": query}},
            {"score": {"$meta": "textScore"}, "_id": 0, "id": 1, "slug": 1,
             "title": 1, "summary": 1},
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)
        docs = await cursor.to_list(limit)
    except OperationFailure:
        # Index missing or query invalid for $text → skip silently.
        docs = []

    # 2) Regex fallback if zero hits
    if not docs:
        safe = re.escape(query)
        or_clauses = [{f: {"$regex": safe, "$options": "i"}} for f in spec["regex_fields"]]
        cursor = col.find(
            {**base_filter, "$or": or_clauses},
            {"_id": 0, "id": 1, "slug": 1, "title": 1, "summary": 1},
        ).limit(limit)
        docs = await cursor.to_list(limit)

    return [_build_item(d, type_, query) for d in docs]


def _group_label(type_: str, locale: str) -> str:
    spec = _PUBLIC_SPEC.get(type_)
    if spec:
        return spec["label_id"] if locale == "id" else spec["label_en"]
    # Portal-only types
    map_id = {"projects": "Proyek", "approvals": "Persetujuan", "documents": "Dokumen", "leads": "Leads"}
    map_en = {"projects": "Projects", "approvals": "Approvals", "documents": "Documents", "leads": "Leads"}
    return (map_id if locale == "id" else map_en).get(type_, type_)


def _parse_types(types: Optional[str], allowed: Sequence[str]) -> List[str]:
    if not types:
        return list(allowed)
    requested = [t.strip().lower() for t in types.split(",") if t.strip()]
    return [t for t in requested if t in allowed]


# --------------------------------------------------------------------------- #
# Public endpoint                                                             #
# --------------------------------------------------------------------------- #


@cached("public_search", ttl=30.0, key_fn=lambda q, types, limit, locale: f"{q}|{types}|{limit}|{locale}")
async def _public_search(q: str, types: str, limit: int, locale: str) -> Dict[str, Any]:
    start = time.time()
    type_list = _parse_types(types, PUBLIC_TYPES)
    groups: List[Dict[str, Any]] = []
    total = 0
    for type_ in type_list:
        items = await _public_search_type(type_, q, limit)
        if not items:
            continue
        groups.append(
            {
                "type": type_,
                "label": _group_label(type_, locale),
                "count": len(items),
                "items": items,
            }
        )
        total += len(items)
    took_ms = int((time.time() - start) * 1000)
    return {"query": q, "total": total, "took_ms": took_ms, "groups": groups}


@router.get("/api/search")
async def public_search(
    q: str = Query(..., min_length=2, max_length=120),
    types: Optional[str] = Query(None, description="Comma-separated subset of: services,cases,blog,careers"),
    limit: int = Query(8, ge=1, le=25),
    locale: str = Query("id", pattern="^(id|en)$"),
):
    """Public global search across published CMS content."""
    data = await _public_search(q.strip(), types or "", limit, locale)
    return success_response(data)


# --------------------------------------------------------------------------- #
# Portal endpoint (auth + RBAC)                                               #
# --------------------------------------------------------------------------- #


async def _accessible_project_ids(db, user: Dict[str, Any]) -> Optional[List[str]]:
    """Return list of project ids the user can read.

    Returns None when the user is admin (means: no restriction).
    """
    role = user.get("role")
    uid = user.get("id")
    if role == "admin":
        return None
    flt: Dict[str, Any] = {"voided": {"$ne": True}}
    if role == "client":
        flt["client_id"] = uid
    elif role == "staff":
        flt["staff_ids"] = uid
    else:
        return []  # unknown role: no access
    cursor = db.pm_projects.find(flt, {"_id": 0, "id": 1})
    rows = await cursor.to_list(500)
    return [r["id"] for r in rows]


async def _portal_search_projects(db, user, query: str, limit: int) -> List[Dict[str, Any]]:
    role = user.get("role")
    uid = user.get("id")
    base: Dict[str, Any] = {"voided": {"$ne": True}}
    if role == "client":
        base["client_id"] = uid
    elif role == "staff":
        base["staff_ids"] = uid
    # admin: no extra filter

    safe = re.escape(query)
    or_clauses = [
        {"name": {"$regex": safe, "$options": "i"}},
        {"code": {"$regex": safe, "$options": "i"}},
        {"summary": {"$regex": safe, "$options": "i"}},
    ]
    cursor = db.pm_projects.find({**base, "$or": or_clauses}, {"_id": 0}).limit(limit)
    docs = await cursor.to_list(limit)
    return [
        {
            "id": d.get("id"),
            "type": "projects",
            "title": d.get("name", d.get("code", "—")),
            "summary": d.get("summary", ""),
            "snippet": _snippet(d.get("summary") or d.get("name", ""), query),
            "url": "/portal/admin/projects" if role in ("admin", "staff") else f"/portal/projects/{d.get('id')}",
            "meta": {"code": d.get("code"), "status": d.get("status")},
        }
        for d in docs
    ]


async def _portal_search_approvals(db, project_ids, query: str, limit: int) -> List[Dict[str, Any]]:
    flt: Dict[str, Any] = {"voided": {"$ne": True}}
    if project_ids is not None:
        if not project_ids:
            return []
        flt["project_id"] = {"$in": project_ids}
    safe = re.escape(query)
    flt["$or"] = [
        {"title": {"$regex": safe, "$options": "i"}},
        {"note": {"$regex": safe, "$options": "i"}},
        {"feedback": {"$regex": safe, "$options": "i"}},
    ]
    cursor = db.pm_approvals.find(flt, {"_id": 0}).limit(limit)
    docs = await cursor.to_list(limit)
    return [
        {
            "id": d.get("id"),
            "type": "approvals",
            "title": d.get("title", "Approval"),
            "summary": d.get("note", ""),
            "snippet": _snippet(d.get("note") or d.get("title", ""), query),
            "url": "/portal/admin/projects",  # detail view varies — keep simple
            "meta": {"status": d.get("status"), "project_id": d.get("project_id")},
        }
        for d in docs
    ]


async def _portal_search_documents(db, project_ids, query: str, limit: int) -> List[Dict[str, Any]]:
    flt: Dict[str, Any] = {"voided": {"$ne": True}}
    if project_ids is not None:
        if not project_ids:
            return []
        flt["project_id"] = {"$in": project_ids}
    safe = re.escape(query)
    flt["name"] = {"$regex": safe, "$options": "i"}
    cursor = db.pm_documents.find(flt, {"_id": 0}).limit(limit)
    docs = await cursor.to_list(limit)
    return [
        {
            "id": d.get("id"),
            "type": "documents",
            "title": d.get("name", "Document"),
            "summary": d.get("content_type", ""),
            "snippet": _snippet(d.get("name") or "", query),
            "url": d.get("url") or "#",
            "meta": {"project_id": d.get("project_id"), "size": d.get("size")},
        }
        for d in docs
    ]


async def _portal_search_leads(db, user, query: str, limit: int) -> List[Dict[str, Any]]:
    if user.get("role") not in ("admin", "staff"):
        return []
    safe = re.escape(query)
    flt = {
        "voided": {"$ne": True},
        "$or": [
            {"name": {"$regex": safe, "$options": "i"}},
            {"email": {"$regex": safe, "$options": "i"}},
            {"company": {"$regex": safe, "$options": "i"}},
            {"message": {"$regex": safe, "$options": "i"}},
        ],
    }
    cursor = db.crm_leads.find(flt, {"_id": 0}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(limit)
    return [
        {
            "id": d.get("id"),
            "type": "leads",
            "title": d.get("name", d.get("email", "—")),
            "summary": d.get("company") or d.get("email") or "",
            "snippet": _snippet(d.get("message") or "", query),
            "url": "/portal/admin/leads",
            "meta": {"status": d.get("status"), "email": d.get("email")},
        }
        for d in docs
    ]


@router.get("/api/portal/search")
async def portal_search(
    q: str = Query(..., min_length=2, max_length=120),
    types: Optional[str] = Query(None, description="Comma-separated subset"),
    limit: int = Query(8, ge=1, le=25),
    locale: str = Query("id", pattern="^(id|en)$"),
    user=Depends(get_current_user),
):
    """Authenticated global search across CMS + portal entities.

    Scoping (per role):
      - admin: full access
      - staff: only projects in staff_ids + their related approvals/documents +
               leads (read-only) + all published CMS
      - client: only projects with client_id == user.id + their related
                approvals/documents + all published CMS (no leads)
    """
    start = time.time()
    q = q.strip()
    type_list = _parse_types(types, ALL_PORTAL_TYPES)
    db = get_db()
    role = user.get("role")

    # CMS portion (everyone can search published CMS via portal)
    cms_types = [t for t in type_list if t in PUBLIC_TYPES]
    groups: List[Dict[str, Any]] = []
    total = 0
    for type_ in cms_types:
        items = await _public_search_type(type_, q, limit)
        if items:
            groups.append({"type": type_, "label": _group_label(type_, locale),
                           "count": len(items), "items": items})
            total += len(items)

    # Project ids the user can read (None = admin = unrestricted)
    project_ids: Optional[List[str]] = None
    if "projects" in type_list or "approvals" in type_list or "documents" in type_list:
        project_ids = await _accessible_project_ids(db, user)

    if "projects" in type_list:
        items = await _portal_search_projects(db, user, q, limit)
        if items:
            groups.append({"type": "projects", "label": _group_label("projects", locale),
                           "count": len(items), "items": items})
            total += len(items)

    if "approvals" in type_list:
        items = await _portal_search_approvals(db, project_ids, q, limit)
        if items:
            groups.append({"type": "approvals", "label": _group_label("approvals", locale),
                           "count": len(items), "items": items})
            total += len(items)

    if "documents" in type_list:
        items = await _portal_search_documents(db, project_ids, q, limit)
        if items:
            groups.append({"type": "documents", "label": _group_label("documents", locale),
                           "count": len(items), "items": items})
            total += len(items)

    if "leads" in type_list and role in ("admin", "staff"):
        items = await _portal_search_leads(db, user, q, limit)
        if items:
            groups.append({"type": "leads", "label": _group_label("leads", locale),
                           "count": len(items), "items": items})
            total += len(items)

    took_ms = int((time.time() - start) * 1000)
    return success_response({
        "query": q,
        "total": total,
        "took_ms": took_ms,
        "scope": role,
        "groups": groups,
    })
