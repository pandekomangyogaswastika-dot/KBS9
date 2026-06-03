"""Seed home-blocks CMS entries for all configurable homepage sections.

Each entry maps to a homepage SceneSection/MediaSection via its `key`.
Admins can edit title/eyebrow/subtitle from /portal/admin/cms/home-blocks.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME   = os.environ["DB_NAME"]

def _b(id_text: str, en_text: str) -> dict:
    return {"id": id_text, "en": en_text}

def _doc(order: int, key: str, eyebrow: dict, title: dict, subtitle: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "key": key,
        "kind": "section-heading",
        "eyebrow": eyebrow,
        "title": title,
        "subtitle": subtitle,
        "items": [],
        "status": "published",
        "order": order,
        "created_at": now,
        "updated_at": now,
        "voided": False,
        "voided_at": None,
    }

HOME_BLOCKS = [
    _doc(1,  "services",
         _b("Konstelasi", "Constellations"),
         _b("Konstelasi Layanan", "Service Constellation"),
         _b("Tujuh bidang keahlian yang menggerakkan transformasi digital Anda.",
            "Seven areas of expertise that drive your digital transformation.")),
    _doc(2,  "process",
         _b("Idea → Launch", "Idea → Launch"),
         _b("Dari Ide hingga Lepas Landas", "From Idea to Launch"),
         _b("Geser untuk menelusuri setiap fase misi kami.",
            "Slide through every phase of our mission.")),
    _doc(3,  "tech",
         _b("The Engine", "The Engine"),
         _b("Mesin Penggerak", "The Driving Engine"),
         _b("Teknologi modern yang kami kuasai untuk membangun solusi tahan masa depan.",
            "Modern technology we master to build future-proof solutions.")),
    _doc(4,  "cases",
         _b("Dunia Tergali", "Explored Worlds"),
         _b("Dunia yang Telah Kami Jelajahi", "Worlds We Have Explored"),
         _b("Studi kasus nyata dengan dampak terukur.",
            "Real case studies with measurable impact.")),
    _doc(5,  "secure",
         _b("Transmisi Aman", "Secure Transmission"),
         _b("Setiap Sinyal, Terenkripsi", "Every Signal, Encrypted"),
         _b("Coba sendiri: ketik pesan, lalu kirim lewat kanal aman kami.",
            "Try it yourself: type a message, then send it through our secure channel.")),
    _doc(6,  "tiers",
         _b("Model Kolaborasi", "Collaboration Model"),
         _b("Cara Kita Bekerja Sama", "How We Work Together"),
         _b("Pilih lintasan yang paling sesuai dengan misi Anda.",
            "Choose the track that best fits your mission.")),
    _doc(7,  "team",
         _b("Sang Kru", "The Crew"),
         _b("Sang Kru", "The Crew"),
         _b("Tim ahli di balik setiap misi.",
            "The expert team behind every mission.")),
    _doc(8,  "clients",
         _b("Peta Bintang", "Star Map"),
         _b("Dipercaya oleh", "Trusted By"),
         _b("Perusahaan yang menjelajah bersama kami.",
            "Companies exploring alongside us.")),
    _doc(9,  "contact",
         _b("Mission Control", "Mission Control"),
         _b("Mulai Komunikasi", "Start Communication"),
         _b("Ceritakan tantangan Anda. Tim kami siap merespons.",
            "Tell us your challenge. Our team is ready to respond.")),
]

async def seed_home_blocks_db(db) -> int:
    """Idempotent: seed home blocks. Returns count of inserted blocks."""
    inserted = 0
    for block in HOME_BLOCKS:
        existing = await db.cms_home_blocks.find_one({"key": block["key"], "voided": {"$ne": True}})
        if not existing:
            await db.cms_home_blocks.insert_one(block)
            inserted += 1
    if inserted:
        print(f"[startup] seeded {inserted} home blocks")
    return inserted


async def run() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    inserted = 0
    skipped  = 0

    for block in HOME_BLOCKS:
        existing = await db.cms_home_blocks.find_one({"key": block["key"], "voided": {"$ne": True}})
        if existing:
            skipped += 1
            print(f"  skip  [{block['key']}] already exists")
        else:
            await db.cms_home_blocks.insert_one(block)
            inserted += 1
            print(f"  seed  [{block['key']}] inserted")

    client.close()
    print(f"\n✅ home-blocks seed done: {inserted} inserted, {skipped} skipped")

if __name__ == "__main__":
    asyncio.run(run())
