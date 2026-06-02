"""Seed default partners for the public PartnersShowcase section."""
from core_utils import new_id, now_iso

DEFAULT_PARTNERS = [
    {"name": "Microsoft", "slug_icon": "microsoft", "logo_color": "FFFFFF", "website": "https://microsoft.com", "order": 1},
    {"name": "AWS", "slug_icon": "amazonwebservices", "logo_color": "FF9900", "website": "https://aws.amazon.com", "order": 2},
    {"name": "Google Cloud", "slug_icon": "googlecloud", "logo_color": "4285F4", "website": "https://cloud.google.com", "order": 3},
    {"name": "MongoDB", "slug_icon": "mongodb", "logo_color": "47A248", "website": "https://www.mongodb.com", "order": 4},
    {"name": "Docker", "slug_icon": "docker", "logo_color": "2496ED", "website": "https://www.docker.com", "order": 5},
    {"name": "GitHub", "slug_icon": "github", "logo_color": "FFFFFF", "website": "https://github.com", "order": 6},
    {"name": "Vercel", "slug_icon": "vercel", "logo_color": "FFFFFF", "website": "https://vercel.com", "order": 7},
    {"name": "Cloudflare", "slug_icon": "cloudflare", "logo_color": "F38020", "website": "https://www.cloudflare.com", "order": 8},
]


async def seed_partners(db) -> int:
    """
    Idempotently seed partners. Returns count of newly inserted records.

    Schema:
      {
        id, name, website, order, status,
        logo_url      → optional, prefer Media Library or external image URL
        slug_icon     → optional simple-icons slug for CDN fallback
        logo_color    → optional hex (no '#') for simple-icons CDN
      }
    """
    inserted = 0
    now = now_iso()
    for partner in DEFAULT_PARTNERS:
        existing = await db.cms_partners.find_one({"name": partner["name"]})
        if existing:
            continue
        doc = {
            "id": new_id(),
            "name": partner["name"],
            "logo_url": None,
            "slug_icon": partner["slug_icon"],
            "logo_color": partner["logo_color"],
            "website": partner["website"],
            "order": partner["order"],
            "status": "published",
            "voided": False,
            "voided_at": None,
            "created_at": now,
            "updated_at": now,
            "created_by": None,
        }
        await db.cms_partners.insert_one(doc)
        inserted += 1
    return inserted
