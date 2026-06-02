"""
SEO Router — Sitemap.xml, Robots.txt, and SEO utilities
Phase 11.A: Basic SEO Foundation
"""
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

# Import DB client from server (or reuse pattern)
from pymongo import MongoClient

router = APIRouter()

# Get DB connection
def get_db():
    mongo_url = os.environ.get("MONGO_URL")
    client = MongoClient(mongo_url)
    db = client["kti_db"]
    return db

@router.get("/sitemap.xml", response_class=Response)
async def get_sitemap():
    """
    Generate dynamic sitemap.xml from published CMS content
    Includes:
    - Homepage
    - Services (list + detail pages for published services)
    - Cases (list + detail pages for published cases)
    - Blog (list + detail pages for published posts)
    - Static pages: /tech, /team, /career, /contact
    """
    db = get_db()
    
    # Get base URL from environment or hardcode for now
    base_url = os.environ.get("BASE_URL", "https://kbs-mapping-setup.preview.emergentagent.com")
    
    # Start XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    
    # Helper function to add URL
    def add_url(loc, lastmod=None, changefreq="weekly", priority="0.8"):
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{base_url}{loc}</loc>")
        if lastmod:
            # Format lastmod to YYYY-MM-DD
            if isinstance(lastmod, str):
                try:
                    lastmod_dt = datetime.fromisoformat(lastmod.replace("Z", "+00:00"))
                    lastmod = lastmod_dt.strftime("%Y-%m-%d")
                except:
                    lastmod = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            elif isinstance(lastmod, datetime):
                lastmod = lastmod.strftime("%Y-%m-%d")
            xml_lines.append(f"    <lastmod>{lastmod}</lastmod>")
        xml_lines.append(f"    <changefreq>{changefreq}</changefreq>")
        xml_lines.append(f"    <priority>{priority}</priority>")
        xml_lines.append("  </url>")
    
    # Homepage (highest priority)
    add_url("/", changefreq="daily", priority="1.0")
    
    # Services list page
    add_url("/services", changefreq="weekly", priority="0.9")
    
    # Services detail pages (published only)
    try:
        services = db.cms_services.find({"status": "published"})
        for service in services:
            slug = service.get("slug")
            if slug:
                lastmod = service.get("updated_at") or service.get("created_at")
                add_url(f"/services/{slug}", lastmod=lastmod, changefreq="weekly", priority="0.8")
    except Exception as e:
        pass
    
    # Cases list page
    add_url("/cases", changefreq="weekly", priority="0.9")
    
    # Cases detail pages (published only)
    try:
        cases = db.cms_cases.find({"status": "published"})
        for case in cases:
            slug = case.get("slug")
            if slug:
                lastmod = case.get("updated_at") or case.get("created_at")
                add_url(f"/cases/{slug}", lastmod=lastmod, changefreq="monthly", priority="0.7")
    except Exception as e:
        pass
    
    # Blog list page
    add_url("/blog", changefreq="daily", priority="0.9")
    
    # Blog detail pages (published only)
    try:
        posts = db.cms_blog_posts.find({"status": "published"})
        for post in posts:
            slug = post.get("slug")
            if slug:
                lastmod = post.get("updated_at") or post.get("created_at")
                add_url(f"/blog/{slug}", lastmod=lastmod, changefreq="monthly", priority="0.7")
    except Exception as e:
        pass
    
    # Static pages
    add_url("/tech", changefreq="monthly", priority="0.6")
    add_url("/team", changefreq="monthly", priority="0.6")
    add_url("/career", changefreq="monthly", priority="0.7")
    add_url("/contact", changefreq="monthly", priority="0.8")
    
    # Career detail pages (if they exist and are published)
    try:
        careers = db.cms_career_posts.find({"status": "published"})
        for career in careers:
            slug = career.get("slug")
            if slug:
                lastmod = career.get("updated_at") or career.get("created_at")
                add_url(f"/career/{slug}", lastmod=lastmod, changefreq="weekly", priority="0.6")
    except Exception as e:
        pass
    
    # Close XML
    xml_lines.append("</urlset>")
    
    xml_content = "\n".join(xml_lines)
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}  # Cache for 1 hour
    )


@router.get("/robots.txt", response_class=Response)
async def get_robots():
    """
    Generate robots.txt
    - Allow all public pages
    - Disallow portal routes (/portal/*)
    - Disallow API routes (/api/*)
    - Disallow assessment token pages (optional - can make indexed)
    - Point to sitemap
    """
    base_url = os.environ.get("BASE_URL", "https://kbs-mapping-setup.preview.emergentagent.com")
    
    robots_content = f"""User-agent: *
Disallow: /portal/
Disallow: /api/
Disallow: /assessment/

# Allow public pages
Allow: /
Allow: /services
Allow: /cases
Allow: /blog
Allow: /tech
Allow: /team
Allow: /career
Allow: /contact

# Sitemap location
Sitemap: {base_url}/api/seo/sitemap.xml
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}  # Cache for 24 hours
    )


@router.get("/meta")
async def get_meta_suggestions(path: Optional[str] = "/"):
    """
    Future: Return suggested SEO metadata for a given path
    Phase 11.B will use AI to generate this
    """
    return {
        "success": True,
        "data": {
            "path": path,
            "message": "AI meta generation coming in Phase 11.B"
        }
    }
