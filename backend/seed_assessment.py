"""Seed the default 'IT Solution Discovery' assessment template (idempotent)."""
from assessment_questions import build_it_discovery_template
from core_utils import now_iso


async def seed_assessment(db):
    existing = await db.assessment_templates.find_one({"code": "it-solution-discovery", "voided": {"$ne": True}})
    if existing:
        return 0
    tpl = build_it_discovery_template()
    now = now_iso()
    tpl.update({"created_at": now, "updated_at": now, "created_by": None, "voided": False, "voided_at": None, "published": True})
    await db.assessment_templates.insert_one(tpl)
    return 1
