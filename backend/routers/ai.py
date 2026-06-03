"""AI routes — grounded advisor (public) + portal assistant (authenticated).

Grounding layers:
  public  → CMS services + cases + tech + blog
  portal  → public grounding + user-scoped project/invoice/approval summary

Conversation logging:
  ai_conversations: {id, session_id, surface, user_id, role, created_at, updated_at, messages[]}
"""
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional

from core_utils import new_id, now_iso, serialize_doc, serialize_list, success_response
from db import get_db
from security import get_current_user, require_role

router = APIRouter(prefix="/api")

MODEL = ("anthropic", "claude-sonnet-4-6")

KTI_IDENTITY = (
    'Anda adalah “Kubus Solution Advisor” — asisten AI resmi PT Kubus Teknologi Indonesia (KTI), '
    "perusahaan IT solutions yang mengkhususkan diri dalam transformasi digital enterprise. "
    "Jawab dengan ramah, ringkas, dan profesional. "
    "Gunakan bahasa yang sama dengan pengguna (Indonesia atau English). "
    "Jawaban umumnya maksimal 150 kata, kecuali diminta lebih detail.\n\n"
)

KTI_RULES = (
    "ATURAN KERAS:\n"
    "1. Hanya bahas topik yang berkaitan dengan KTI, layanan TI, atau proyek klien KTI.\n"
    "2. Jangan membuat komitmen harga atau SLA tanpa assessment formal.\n"
    "3. Jika pertanyaan di luar topik KTI, tolak sopan dan arahkan kembali ke topik KTI.\n"
    "4. Jika pengguna butuh penawaran/estimasi detail, sarankan mengisi Discovery Assessment atau menghubungi tim KTI.\n"
    "5. Jangan menyebut nama kompetitor atau memberikan rekomendasi vendor lain.\n"
    "6. Saat pengguna menunjukkan minat kuat / siap melangkah, tambahkan CTA: \"[CTA_ASSESSMENT]\" atau \"[CTA_CONTACT]\".\n\n"
)


class ChatMessage(BaseModel):
    role: str
    content: str


class AdvisorIn(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    locale: Optional[str] = "id"


class PortalChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    locale: Optional[str] = "id"


# ---- Grounding builders -----------------------------------------------

async def _build_public_grounding(db) -> str:
    """Fetch CMS content and build grounding text for public AI advisor."""
    services = await db.cms_services.find({"voided": {"$ne": True}, "status": "published"}).sort("order", 1).to_list(10)
    cases = await db.cms_cases.find({"voided": {"$ne": True}, "status": "published"}).sort("order", 1).to_list(6)
    techs = await db.cms_tech.find({"voided": {"$ne": True}}).sort("order", 1).to_list(20)
    blog_posts = await db.cms_blog.find({"voided": {"$ne": True}, "status": "published"}).sort("published_at", -1).to_list(4)
    settings = await db.cms_settings.find_one({}) or {}

    company_name = settings.get("company_name", "PT Kubus Teknologi Indonesia")
    company_tagline = settings.get("hero_tagline", {}).get("id", "")

    svc_lines = "\n".join(
        f"- {s.get('title', {}).get('id', '?')}: {str(s.get('summary', {}).get('id', ''))[:120]}"
        for s in services
    )
    case_lines = "\n".join(
        f"- {c.get('title', {}).get('id', '?')} → industri {c.get('industry', {}).get('id', '?')}, klien {c.get('client_name', '?')}"
        for c in cases
    )
    tech_lines = "\n".join(
        f"- {t.get('name', '?')} ({t.get('category', '?')})"
        for t in techs[:12]
    )
    blog_lines = "\n".join(
        f"- {b.get('title', {}).get('id', '?')}"
        for b in blog_posts
    ) or "(tidak ada artikel terbaru)"

    return (
        KTI_IDENTITY
        + f"PERUSAHAAN: {company_name}\n{company_tagline}\n\n"
        + "LAYANAN UTAMA KTI:\n" + (svc_lines or "(data tidak tersedia)") + "\n\n"
        + "STUDI KASUS UNGGULAN:\n" + (case_lines or "(data tidak tersedia)") + "\n\n"
        + "TEKNOLOGI & TOOLS:\n" + (tech_lines or "(data tidak tersedia)") + "\n\n"
        + "ARTIKEL TERBARU:\n" + blog_lines + "\n\n"
        + KTI_RULES
    )


async def _build_portal_grounding(db, user: dict) -> str:
    """Build grounding for authenticated portal users: public context + project summary."""
    public_grounding = await _build_public_grounding(db)
    role = user["role"]
    uid = user["id"]

    if role == "client":
        # Fetch client's project summary
        projects = await db.pm_projects.find({"client_id": uid, "voided": {"$ne": True}}).to_list(20)
        invoices = await db.billing_invoices.find({"client_id": uid, "voided": {"$ne": True}}).to_list(50)
        approvals = []
        for p in projects:
            ap = await db.pm_approvals.find({"project_id": p["id"], "status": "pending", "voided": {"$ne": True}}).to_list(20)
            approvals.extend(ap)

        active_projects = [p for p in projects if p.get("status") == "active"]
        unpaid = [i for i in invoices if i.get("status") in ("unpaid", "overdue")]
        unpaid_total = sum(i.get("amount", 0) for i in unpaid)

        project_lines = "\n".join(
            f"- [{p.get('code')}] {p.get('name')} — progress {p.get('progress', 0)}%, status {p.get('status')}, tenggat {p.get('due_date', '—')}"
            for p in projects
        ) or "Tidak ada proyek."

        context = (
            f"\n\nKONTEKS KLIEN (RAHASIA — jangan bocorkan ke pihak lain):\n"
            f"Nama klien: {user.get('name')}\n"
            f"Proyek aktif: {len(active_projects)} dari {len(projects)} total\n"
            f"Persetujuan pending: {len(approvals)}\n"
            f"Invoice belum dibayar: {len(unpaid)} (total Rp {unpaid_total:,.0f})\n"
            f"Detail proyek:\n{project_lines}\n\n"
            f"Gunakan informasi ini untuk memberikan jawaban yang relevan dan kontekstual untuk klien ini. "
            f"Bantu klien memahami status proyek mereka, milestone, dan langkah berikutnya. "
            f"Jika mereka bertanya tentang sesuatu yang tidak ada datanya, katakan Anda akan koordinasikan dengan tim.\n"
        )
        return public_grounding + context

    elif role in ("admin", "staff"):
        context = (
            f"\n\nKONTEKS STAFF:\n"
            f"Anda sedang berbicara dengan {user.get('name')} (role: {role}). "
            f"Ini adalah portal internal KTI. Anda boleh membahas detail teknis dan operasional lebih mendalam. "
            f"Bantu staff memecahkan masalah operasional, memberikan informasi layanan, atau mendukung klien.\n"
        )
        return public_grounding + context

    return public_grounding


# ---- Logging helper ---------------------------------------------------

async def _log_conversation(db, session_id: str, surface: str, user_id: Optional[str],
                             role: Optional[str], user_msg: str, ai_reply: str):
    now = now_iso()
    await db.ai_conversations.update_one(
        {"session_id": session_id},
        {
            "$setOnInsert": {"id": new_id(), "session_id": session_id, "surface": surface,
                             "user_id": user_id, "role": role, "created_at": now},
            "$set": {"updated_at": now},
            "$push": {"messages": {"$each": [
                {"role": "user", "content": user_msg, "at": now},
                {"role": "assistant", "content": ai_reply, "at": now},
            ]}},
        },
        upsert=True,
    )


# ---- Chat helpers -----------------------------------------------------

def _build_prompt(payload: AdvisorIn | PortalChatIn) -> str:
    history_text = ""
    if payload.history:
        recent = payload.history[-8:]
        joined = "\n".join(f"{m.role}: {m.content}" for m in recent)
        history_text = f"Riwayat percakapan:\n{joined}\n\n"
    return f"{history_text}Pertanyaan pengguna: {payload.message}"


async def _call_llm(session_id: str, system_msg: str, prompt: str) -> str:
    from llm_client import llm_complete, LLMNotConfigured

    try:
        return await llm_complete(
            system_message=system_msg,
            user_text=prompt,
            session_id=session_id,
            max_tokens=1200,
        )
    except LLMNotConfigured:
        raise HTTPException(status_code=503, detail={"code": "AI_PROVIDER_ERROR", "message": "AI key not configured"})
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"code": "AI_PROVIDER_ERROR", "message": f"AI error: {exc}"})


def _parse_ctas(reply: str) -> dict:
    """Extract CTA markers from reply text, returning clean reply + CTA flags."""
    has_assessment = "[CTA_ASSESSMENT]" in reply
    has_contact = "[CTA_CONTACT]" in reply
    clean = reply.replace("[CTA_ASSESSMENT]", "").replace("[CTA_CONTACT]", "").strip()
    return {"reply": clean, "cta_assessment": has_assessment, "cta_contact": has_contact}


# ---- Public advisor ---------------------------------------------------

@router.post("/ai/advisor")
async def ai_advisor(payload: AdvisorIn):
    db = get_db()
    session_id = payload.session_id or new_id()
    system_msg = await _build_public_grounding(db)
    prompt = _build_prompt(payload)
    raw_reply = await _call_llm(f"public-{session_id}", system_msg, prompt)
    result = _parse_ctas(raw_reply)
    await _log_conversation(db, session_id, "public", None, None, payload.message, result["reply"])
    return success_response({"session_id": session_id, "reply": result["reply"],
                             "cta_assessment": result["cta_assessment"],
                             "cta_contact": result["cta_contact"]})


# ---- Portal assistant (authenticated) --------------------------------

@router.post("/ai/portal")
async def ai_portal(payload: PortalChatIn, user=Depends(get_current_user)):
    db = get_db()
    session_id = payload.session_id or new_id()
    system_msg = await _build_portal_grounding(db, user)
    prompt = _build_prompt(payload)
    raw_reply = await _call_llm(f"portal-{session_id}-{user['id']}", system_msg, prompt)
    result = _parse_ctas(raw_reply)
    await _log_conversation(db, session_id, "portal", user["id"], user["role"], payload.message, result["reply"])
    return success_response({"session_id": session_id, "reply": result["reply"],
                             "cta_assessment": result["cta_assessment"],
                             "cta_contact": result["cta_contact"]})


# ---- Admin: list/view conversations ----------------------------------

@router.get("/ai/conversations")
async def list_conversations(
    surface: Optional[str] = None,
    limit: int = 50,
    user=Depends(require_role("admin", "staff")),
):
    db = get_db()
    filt = {}
    if surface:
        filt["surface"] = surface
    convs = await db.ai_conversations.find(filt).sort("updated_at", -1).to_list(limit)
    result = []
    for c in convs:
        c = serialize_doc(c)
        c["message_count"] = len(c.get("messages", []))
        c["last_user_msg"] = next(
            (m["content"][:80] for m in reversed(c.get("messages", [])) if m["role"] == "user"), ""
        )
        # enrich user name
        if c.get("user_id"):
            u = await db.system_users.find_one({"id": c["user_id"]}, {"_id": 0, "name": 1})
            c["user_name"] = u["name"] if u else "—"
        result.append(c)
    return success_response(result)


@router.get("/ai/conversations/{conv_id}")
async def get_conversation(conv_id: str, user=Depends(require_role("admin", "staff"))):
    db = get_db()
    conv = await db.ai_conversations.find_one({"id": conv_id})
    if not conv:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Percakapan tidak ditemukan"})
    c = serialize_doc(conv)
    if c.get("user_id"):
        u = await db.system_users.find_one({"id": c["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        c["user_name"] = u["name"] if u else "—"
        c["user_email"] = u.get("email", "") if u else ""
    return success_response(c)
