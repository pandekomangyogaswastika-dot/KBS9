"""Assessment AI Report generation service (Claude via unified llm_client)."""
import json
from typing import Optional


def _get_prompt_text(q: dict, locale: str = "id") -> str:
    field = q.get("prompt") or q.get("text") or {}
    if isinstance(field, dict):
        return field.get(locale) or field.get("id") or field.get("en") or ""
    return str(field) if field else ""


def _get_loc(val, locale="id"):
    if isinstance(val, dict):
        return val.get(locale) or val.get("id") or val.get("en") or ""
    return str(val) if val else ""


def _get_domains(template):
    return template.get("domains") or template.get("sections") or []


def _render_answer_text(q, ans):
    if not ans:
        return "(belum diisi)"
    if ans.get("skipped"):
        return "(dilewati)"
    val = ans.get("value")
    qtype = q.get("type", "")
    opts = {o["value"]: o for o in (q.get("options") or [])}
    if val is None or val == "":
        return "(belum diisi)"
    if qtype in ("yes_no", "yesno"):
        if val in (True, "yes", "true"):
            return "Ya"
        if val in (False, "no", "false"):
            return "Tidak"
        return str(val)
    if qtype in ("single_choice", "select"):
        opt = opts.get(val)
        return _get_loc(opt["label"]) if opt else str(val)
    if qtype in ("multi_choice", "multiselect"):
        if isinstance(val, list):
            parts = []
            for v in val:
                opt = opts.get(v)
                parts.append(_get_loc(opt["label"]) if opt else str(v))
            return ", ".join(parts) if parts else "(tidak ada pilihan)"
    return str(val)


def format_responses_by_domain(template, answers_map):
    lines = []
    for i, d in enumerate(_get_domains(template), 1):
        title = _get_loc(d.get("title"))
        lines.append(f"\n## Domain {i}: {title}")
        for q in d.get("questions", []):
            prompt = _get_prompt_text(q)
            ans_text = _render_answer_text(q, answers_map.get(q["id"]))
            lines.append(f"  Q: {prompt}")
            lines.append(f"  A: {ans_text}")
            note = (answers_map.get(q["id"]) or {}).get("note")
            if note:
                lines.append(f"  Catatan: {note}")
    return "\n".join(lines)


def _build_prompt(template, answers_map, report_type="summary"):
    template_name = _get_loc(template.get("name"))
    domain_count = len(_get_domains(template))
    domain_titles = ", ".join(_get_loc(d.get("title")) for d in _get_domains(template))
    total_answered = sum(1 for a in answers_map.values() if a and not a.get("skipped") and a.get("value") not in (None, ""))

    responses_text = format_responses_by_domain(template, answers_map)

    prompt = f"""Anda adalah konsultan bisnis teknologi berpengalaman dari Kubus Teknologi Indonesia.
Anda sedang menganalisis hasil assessment klien untuk template: {template_name}

ASSESSMENT OVERVIEW:
- Template: {template_name}
- Jumlah domain: {domain_count}
- Domain: {domain_titles}
- Total pertanyaan terjawab: {total_answered}

JAWABAN KLIEN PER DOMAIN:
{responses_text}

TUGAS ANDA:
Buat laporan assessment profesional dan actionable dalam Bahasa Indonesia.
Fokus pada nilai bisnis, bukan teknis semata.
Gunakan tone konsultan profesional.

STRUKTUR OUTPUT (JSON):
Return HANYA valid JSON object dengan struktur berikut:
{{
  "executive_summary": "Narasi 2-3 paragraf tentang kondisi saat ini, temuan utama, dan tingkat kesiapan klien",
  "key_insights": [
    "Temuan kritis 1 (spesifik, berdasarkan jawaban)",
    "Temuan kritis 2",
    "Temuan kritis 3",
    "Temuan kritis 4",
    "Temuan kritis 5"
  ],
  "recommendations": [
    {{
      "priority": "high",
      "title": "Judul rekomendasi singkat",
      "description": "Penjelasan 2-3 kalimat tentang apa yang harus dilakukan",
      "rationale": "Alasan mengapa ini penting (referensikan jawaban spesifik)",
      "expected_impact": "Dampak yang diharapkan jika diimplementasikan"
    }}
  ],
  "risk_assessment": {{
    "risks": [
      {{
        "risk": "Nama risiko",
        "severity": "high",
        "impact": "Dampak jika tidak ditangani",
        "mitigation": "Strategi mitigasi"
      }}
    ]
  }},
  "opportunities": [
    {{
      "opportunity": "Nama peluang",
      "type": "quick_win",
      "description": "Deskripsi peluang",
      "timeline": "Estimasi timeline implementasi"
    }}
  ]
}}

Pastikan:
- executive_summary minimal 2 paragraf
- key_insights minimal 4 item, maksimal 7 item
- recommendations minimal 4 item, prioritas (high/medium/low)
- risk_assessment.risks minimal 3 item, severity (high/medium/low)
- opportunities minimal 2 item, type (quick_win/strategic)
- Semua teks dalam Bahasa Indonesia
- Return HANYA valid JSON, tidak ada teks lain"""

    return prompt


async def generate_ai_report(
    session_id: str,
    template: dict,
    answers_map: dict,
    report_type: str = "summary",
    db=None,
) -> Optional[dict]:
    """Generate AI report using Claude. Returns report dict or None on failure."""
    prompt = _build_prompt(template, answers_map, report_type)

    from llm_client import llm_complete

    raw_text = await llm_complete(
        system_message="You are a professional business technology consultant. Always respond with valid JSON only.",
        user_text=prompt,
        session_id=f"assess-report-{session_id}",
        max_tokens=3000,
    )

    # Parse JSON response
    content = {}
    try:
        # Try direct parse
        clean = raw_text.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            clean = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        content = json.loads(clean)
    except json.JSONDecodeError:
        # Try to extract JSON from text
        import re
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            try:
                content = json.loads(match.group(0))
            except json.JSONDecodeError:
                content = {"executive_summary": raw_text, "key_insights": [], "recommendations": [], "risk_assessment": {"risks": []}, "opportunities": []}
        else:
            content = {"executive_summary": raw_text, "key_insights": [], "recommendations": [], "risk_assessment": {"risks": []}, "opportunities": []}

    # Save to DB if provided
    if db is not None:
        from core_utils import new_id, now_iso, serialize_doc
        existing = await db.assessment_ai_reports.find_one({"session_id": session_id, "report_type": report_type})
        if existing:
            await db.assessment_ai_reports.update_one(
                {"session_id": session_id, "report_type": report_type},
                {"$set": {"content": content, "generated_at": now_iso(), "ai_model": "claude-sonnet-4-5"}}
            )
            return serialize_doc(await db.assessment_ai_reports.find_one({"session_id": session_id, "report_type": report_type}))
        else:
            report_doc = {
                "id": new_id(),
                "session_id": session_id,
                "template_id": template.get("id"),
                "report_type": report_type,
                "content": content,
                "ai_model": "claude-sonnet-4-5",
                "generated_at": now_iso(),
            }
            await db.assessment_ai_reports.insert_one(report_doc)
            return serialize_doc(report_doc)

    return {"content": content, "ai_model": "claude-sonnet-4-5"}
