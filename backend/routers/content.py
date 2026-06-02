"""Public read-only content endpoints (Phase 13: added TTL caching + HTTP cache headers).

All public-facing CMS endpoints are cached in-process for `PUBLIC_TTL` seconds and
include `Cache-Control: public, max-age=PUBLIC_TTL` headers so CDNs and browsers
can also cache. Writes via admin/cms.py call `invalidate_public_cache(...)` to
flush the relevant entries.
"""
from fastapi import APIRouter, HTTPException, Response

from cache import cache_get, cache_set, invalidate_ns, invalidate_key
from core_utils import serialize_doc, serialize_list, success_response
from db import get_db

router = APIRouter(prefix="/api")

# Namespace for the entire public content area; gives admin writes a simple
# "flush everything public" path if they don't know the exact collection.
NS = "public_content"
PUBLIC_TTL = 60.0  # seconds (low enough for ~1m staleness, high enough to help)
PUBLIC_CACHE_HEADER = f"public, max-age={int(PUBLIC_TTL)}, stale-while-revalidate=30"

_LIST_TTL = PUBLIC_TTL
_DETAIL_TTL = PUBLIC_TTL


def _list_key(collection: str, sort_field: str = "order") -> str:
    return f"list:{collection}:{sort_field}"


def _detail_key(collection: str, slug: str) -> str:
    return f"detail:{collection}:{slug}"


def invalidate_public_cache(collection: str | None = None, slug: str | None = None) -> None:
    """Invalidate cached public content.

    - With no args: drop the entire public_content namespace.
    - With collection only: drop the list entry + slug detail entries for that collection.
    - With collection + slug: drop just that detail entry (and the list snapshot).
    """
    if collection is None and slug is None:
        invalidate_ns(NS)
        return
    if collection and slug is None:
        # invalidate list snapshot for this collection (and conservatively drop
        # any detail entry by relying on TTL — keeping logic simple here)
        invalidate_key(NS, _list_key(collection))
        return
    if collection and slug:
        invalidate_key(NS, _list_key(collection))
        invalidate_key(NS, _detail_key(collection, slug))


async def _list(response: Response, collection: str, sort_field: str = "order"):
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    key = _list_key(collection, sort_field)
    cached = cache_get(NS, key)
    if cached is not None:
        return cached
    db = get_db()
    docs = await db[collection].find(
        {"voided": {"$ne": True}, "status": "published"}
    ).sort(sort_field, 1).to_list(200)
    payload = success_response(serialize_list(docs))
    cache_set(NS, key, payload, ttl=_LIST_TTL)
    return payload


async def _detail(response: Response, collection: str, slug: str):
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    key = _detail_key(collection, slug)
    cached = cache_get(NS, key)
    if cached is not None:
        return cached
    db = get_db()
    doc = await db[collection].find_one(
        {"slug": slug, "voided": {"$ne": True}, "status": "published"}
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Resource not found"},
        )
    payload = success_response(serialize_doc(doc))
    cache_set(NS, key, payload, ttl=_DETAIL_TTL)
    return payload


@router.get("/services")
async def list_services(response: Response):
    return await _list(response, "cms_services")


@router.get("/services/{slug}")
async def get_service(slug: str, response: Response):
    return await _detail(response, "cms_services", slug)


@router.get("/cases")
async def list_cases(response: Response):
    return await _list(response, "cms_cases")


@router.get("/cases/{slug}")
async def get_case(slug: str, response: Response):
    return await _detail(response, "cms_cases", slug)


@router.get("/team")
async def list_team(response: Response):
    return await _list(response, "cms_team")


@router.get("/clients")
async def list_clients(response: Response):
    return await _list(response, "cms_clients")


@router.get("/tech")
async def list_tech(response: Response):
    return await _list(response, "cms_tech")


@router.get("/blog")
async def list_blog(response: Response):
    return await _list(response, "cms_blog")


@router.get("/blog/{slug}")
async def get_blog(slug: str, response: Response):
    return await _detail(response, "cms_blog", slug)


@router.get("/careers")
async def list_careers(response: Response):
    return await _list(response, "cms_careers")


@router.get("/careers/{slug}")
async def get_career(slug: str, response: Response):
    return await _detail(response, "cms_careers", slug)


@router.get("/settings")
async def get_settings(response: Response):
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    key = "settings:site"
    cached = cache_get(NS, key)
    if cached is not None:
        return cached
    db = get_db()
    doc = await db.cms_pages.find_one({"key": "site", "voided": {"$ne": True}})
    payload = success_response(serialize_doc(doc) if doc else {})
    cache_set(NS, key, payload, ttl=PUBLIC_TTL)
    return payload


@router.get("/home-blocks")
async def list_home_blocks(response: Response):
    """Public endpoint for CMS-managed homepage section configuration."""
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    key = "list:cms_home_blocks"
    cached = cache_get(NS, key)
    if cached is not None:
        return cached
    db = get_db()
    docs = await db.cms_home_blocks.find(
        {"voided": {"$ne": True}, "status": "published"}
    ).sort("order", 1).to_list(100)
    payload = success_response(serialize_list(docs))
    cache_set(NS, key, payload, ttl=PUBLIC_TTL)
    return payload


# ── Phase 20: Portfolio / Case Studies / Products (with filtering) ────────────
@router.get("/portfolio")
async def list_portfolio(
    response: Response,
    industry: str | None = None,
    technology: str | None = None,
    project_type: str | None = None,
    tag: str | None = None,
    has_case_study: bool | None = None
):
    """Public portfolio list with optional filters."""
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    
    # Build filter query
    filters = {"voided": {"$ne": True}, "status": "published"}
    if industry:
        filters["industry"] = industry
    if technology:
        filters["technology"] = {"$in": [technology]}
    if project_type:
        filters["project_type"] = project_type
    if tag:
        filters["tags"] = {"$in": [tag]}
    if has_case_study is not None:
        if has_case_study:
            filters["case_study_id"] = {"$ne": None, "$exists": True}
        else:
            filters["$or"] = [{"case_study_id": None}, {"case_study_id": {"$exists": False}}]
    
    # Simple caching: only cache unfiltered requests
    is_filtered = any([industry, technology, project_type, tag, has_case_study is not None])
    key = "list:cms_portfolios:unfiltered"
    
    if not is_filtered:
        cached = cache_get(NS, key)
        if cached is not None:
            return cached
    
    db = get_db()
    docs = await db.cms_portfolios.find(filters).sort("order", 1).to_list(200)
    payload = success_response(serialize_list(docs))
    
    if not is_filtered:
        cache_set(NS, key, payload, ttl=_LIST_TTL)
    
    return payload


@router.get("/portfolio/{slug}")
async def get_portfolio_detail(slug: str, response: Response):
    """Public portfolio detail page."""
    return await _detail(response, "cms_portfolios", slug)


@router.get("/case-studies")
async def list_case_studies(
    response: Response,
    industry: str | None = None,
    technology: str | None = None,
    tag: str | None = None
):
    """Public case studies list with optional filters."""
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    
    filters = {"voided": {"$ne": True}, "status": "published"}
    if industry:
        filters["industry"] = industry
    if technology:
        filters["technology"] = {"$in": [technology]}
    if tag:
        filters["tags"] = {"$in": [tag]}
    
    is_filtered = any([industry, technology, tag])
    key = "list:cms_case_studies:unfiltered"
    
    if not is_filtered:
        cached = cache_get(NS, key)
        if cached is not None:
            return cached
    
    db = get_db()
    docs = await db.cms_case_studies.find(filters).sort("order", 1).to_list(200)
    payload = success_response(serialize_list(docs))
    
    if not is_filtered:
        cache_set(NS, key, payload, ttl=_LIST_TTL)
    
    return payload


@router.get("/case-studies/{slug}")
async def get_case_study_detail(slug: str, response: Response):
    """Public case study detail page."""
    return await _detail(response, "cms_case_studies", slug)


@router.get("/products")
async def list_products(
    response: Response,
    category: str | None = None,
    tag: str | None = None
):
    """Public products list with optional filters."""
    response.headers["Cache-Control"] = PUBLIC_CACHE_HEADER
    
    filters = {"voided": {"$ne": True}, "status": "published"}
    if category:
        filters["category"] = category
    if tag:
        filters["tags"] = {"$in": [tag]}
    
    is_filtered = any([category, tag])
    key = "list:cms_products:unfiltered"
    
    if not is_filtered:
        cached = cache_get(NS, key)
        if cached is not None:
            return cached
    
    db = get_db()
    docs = await db.cms_products.find(filters).sort("order", 1).to_list(200)
    payload = success_response(serialize_list(docs))
    
    if not is_filtered:
        cache_set(NS, key, payload, ttl=_LIST_TTL)
    
    return payload


@router.get("/products/{slug}")
async def get_product_detail(slug: str, response: Response):
    """Public product detail page."""
    return await _detail(response, "cms_products", slug)


# ── Phase 20 P2: Partners (public) ──────────────────────────────────────────
@router.get("/partners")
async def list_partners(response: Response):
    """Public list of partner companies. Order by 'order' asc."""
    return await _list(response, "cms_partners")

