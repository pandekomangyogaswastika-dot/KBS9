"""Bilingual PDF report for an assessment session (ReportLab).

Supports both 'domains' and 'sections' key in template.
"""
import io

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

from assessment_engine import OTHER_SENTINEL, evaluate_show_if, _get_domains

INDIGO = colors.HexColor("#5B49C9")
TEAL = colors.HexColor("#1D7874")
INK = colors.HexColor("#1A1C25")
MUTED = colors.HexColor("#5B6070")
SOFT = colors.HexColor("#EEF1F7")


def _loc(val, locale):
    if isinstance(val, dict):
        return val.get(locale) or val.get("id") or val.get("en") or ""
    return str(val) if val is not None else ""


def _get_prompt(q, locale):
    """Get question text from either 'prompt' or 'text' field."""
    field = q.get("prompt") or q.get("text")
    return _loc(field, locale)


def _esc(text):
    return (str(text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def _normalize_type(qtype):
    aliases = {
        "select": "single_choice", "multiselect": "multi_choice",
        "yesno": "yes_no", "scale": "scale_1_5",
        "text": "text_short", "textarea": "text_long",
    }
    return aliases.get(qtype, qtype)


def _render_answer(q, ans, locale):
    skipped_txt = "(dilewati)" if locale == "id" else "(skipped)"
    none_txt = "(belum diisi)" if locale == "id" else "(not answered)"
    other_lbl = "Lainnya" if locale == "id" else "Other"
    if not ans:
        return none_txt
    if ans.get("skipped"):
        return skipped_txt
    val = ans.get("value")
    other = (ans.get("other_text") or "").strip()
    qtype = _normalize_type(q.get("type", ""))
    options = {o["value"]: o for o in (q.get("options") or [])}
    if qtype == "single_choice":
        if val == OTHER_SENTINEL:
            return f"{other_lbl}: {other}" if other else none_txt
        opt = options.get(val)
        if opt:
            return _loc(opt.get("label"), locale)
        return str(val) if val not in (None, "") else none_txt
    if qtype == "multi_choice":
        if not val:
            return none_txt
        parts = []
        for v in val:
            if v == OTHER_SENTINEL:
                if other:
                    parts.append(f"{other_lbl}: {other}")
            else:
                opt = options.get(v)
                parts.append(_loc(opt["label"], locale) if opt else str(v))
        return ", ".join(parts) if parts else none_txt
    if qtype == "yes_no":
        if val in (True, "yes", "true", "Ya", "ya"):
            return "Ya" if locale == "id" else "Yes"
        if val in (False, "no", "false", "Tidak", "tidak"):
            return "Tidak" if locale == "id" else "No"
        return none_txt
    if qtype == "scale_1_5":
        return f"{val} / 5" if val not in (None, "") else none_txt
    if val in (None, ""):
        return none_txt
    return str(val)


def _build_ai_section(story, ai_report, ss, locale):
    """Append AI report section (Phase 21C professional format) to story."""
    h2 = ParagraphStyle("h2ai", parent=ss["Heading2"], textColor=colors.HexColor("#5B49C9"), fontSize=14, spaceBefore=14, spaceAfter=4)
    h3 = ParagraphStyle("h3ai", parent=ss["Heading3"], textColor=colors.HexColor("#1D7874"), fontSize=12, spaceBefore=10, spaceAfter=3)
    body = ParagraphStyle("bodyai", parent=ss["Normal"], textColor=colors.HexColor("#1A1C25"), fontSize=10, leading=14, spaceBefore=4)
    bullet = ParagraphStyle("bulletai", parent=body, leftIndent=12, spaceBefore=2, bulletIndent=8, bulletFontName="Symbol")
    domain_bullet = ParagraphStyle("dombulletai", parent=body, leftIndent=16, spaceBefore=2)

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#5B49C9"), thickness=1.5))
    story.append(Spacer(1, 10))
    
    # AI Report Title
    ai_title = "AI Analysis Report" if locale == "en" else "Laporan Analisis AI"
    story.append(Paragraph(f"<b>{_esc(ai_title)}</b>", h2))
    story.append(Spacer(1, 4))

    # Overall Summary
    overall = ai_report.get("overall_summary", {})
    if overall.get("summary"):
        story.append(Paragraph("<b>Executive Summary</b>" if locale == "en" else "<b>Ringkasan Eksekutif</b>", h3))
        story.append(Paragraph(_esc(overall["summary"]), body))
        story.append(Spacer(1, 6))

    # Key Findings
    if overall.get("key_findings"):
        story.append(Paragraph("<b>Key Findings</b>" if locale == "en" else "<b>Temuan Kunci</b>", h3))
        for finding in overall["key_findings"]:
            story.append(Paragraph(f"• {_esc(finding)}", bullet))
        story.append(Spacer(1, 6))

    # Domain Insights
    domain_insights = ai_report.get("domain_insights", [])
    if domain_insights:
        story.append(Paragraph("<b>Domain Analysis</b>" if locale == "en" else "<b>Analisis Per Domain</b>", h2))
        story.append(Spacer(1, 4))
        
        for insight in domain_insights:
            domain_name = insight.get("domain", "")
            maturity_score = insight.get("maturity_score")
            maturity_label = insight.get("maturity_label", "")
            
            # Domain header with maturity
            domain_header = f"<b>{_esc(domain_name)}</b>"
            if maturity_score:
                domain_header += f" — Maturity: {maturity_score}/5 ({_esc(maturity_label)})"
            story.append(Paragraph(domain_header, h3))
            
            # Strengths
            strengths = insight.get("strengths", [])
            if strengths:
                story.append(Paragraph("<i>Strengths:</i>" if locale == "en" else "<i>Kekuatan:</i>", body))
                for strength in strengths:
                    story.append(Paragraph(f"✓ {_esc(strength)}", domain_bullet))
            
            # Concerns
            concerns = insight.get("concerns", [])
            if concerns:
                story.append(Paragraph("<i>Areas for Improvement:</i>" if locale == "en" else "<i>Area Perbaikan:</i>", body))
                for concern in concerns:
                    story.append(Paragraph(f"⚠ {_esc(concern)}", domain_bullet))
            
            # Recommendations
            recommendations = insight.get("recommendations", [])
            if recommendations:
                story.append(Paragraph("<i>Recommendations:</i>" if locale == "en" else "<i>Rekomendasi:</i>", body))
                for i, rec in enumerate(recommendations[:3], 1):  # Top 3
                    story.append(Paragraph(f"{i}. {_esc(rec)}", domain_bullet))
            
            story.append(Spacer(1, 8))

    # Next Steps
    if overall.get("next_steps"):
        story.append(Paragraph("<b>Strategic Next Steps</b>" if locale == "en" else "<b>Langkah Strategis Selanjutnya</b>", h3))
        for i, step in enumerate(overall["next_steps"], 1):
            story.append(Paragraph(f"{i}. {_esc(step)}", bullet))
        story.append(Spacer(1, 6))

    # Overall Recommendations
    recommendations = ai_report.get("recommendations", [])
    if recommendations:
        story.append(Paragraph("<b>Priority Actions</b>" if locale == "en" else "<b>Aksi Prioritas</b>", h3))
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {_esc(rec)}", bullet))

    story.append(Spacer(1, 10))
    # Footer note
    footer_note = "This AI analysis is generated using Claude 3.5 Sonnet and should be reviewed by qualified professionals." if locale == "en" else "Analisis AI ini dihasilkan menggunakan Claude 3.5 Sonnet dan sebaiknya ditinjau oleh profesional yang berkualifikasi."
    story.append(Paragraph(f"<i>{_esc(footer_note)}</i>", ParagraphStyle("footnote", parent=body, fontSize=8, textColor=colors.HexColor("#5B6070"))))


def build_pdf(session, template, answers_map, progress, attachments_by_question=None, locale="id", ai_report=None):
    buf = io.BytesIO()
    # Brand color support
    raw_color = session.get("brand_color") or "#5B49C9"
    try:
        BRAND = colors.HexColor(raw_color)
    except Exception:
        BRAND = INDIGO
    company_logo_url = session.get("company_logo_url")
    company_name = session.get("company_name") or "KUBUS TEKNOLOGI INDONESIA"

    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm,
                            leftMargin=16 * mm, rightMargin=16 * mm, title="Assessment Report")
    ss = getSampleStyleSheet()
    h_title = ParagraphStyle("t", parent=ss["Title"], textColor=BRAND, fontSize=22, spaceAfter=2)
    h_sub = ParagraphStyle("s", parent=ss["Normal"], textColor=MUTED, fontSize=10, spaceAfter=2)
    h_dom = ParagraphStyle("d", parent=ss["Heading2"], textColor=colors.white, fontSize=12, leftIndent=4, spaceBefore=2, spaceAfter=2)
    q_style = ParagraphStyle("q", parent=ss["Normal"], textColor=INK, fontSize=10, leading=13, spaceBefore=6, alignment=TA_LEFT)
    a_style = ParagraphStyle("a", parent=ss["Normal"], textColor=TEAL, fontSize=10, leading=13, leftIndent=8)
    n_style = ParagraphStyle("n", parent=ss["Normal"], textColor=MUTED, fontSize=9, leading=12, leftIndent=8)

    story = []

    # Logo header
    logo_added = False
    if company_logo_url:
        try:
            import urllib.request, tempfile, os as _os
            with urllib.request.urlopen(company_logo_url, timeout=4) as r:
                logo_data = r.read()
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            tmp.write(logo_data); tmp.close()
            from reportlab.platypus import Image as RLImage
            img = RLImage(tmp.name, width=35*mm, height=12*mm, kind="proportional")
            _os.unlink(tmp.name)
            story.append(img)
            logo_added = True
        except Exception:
            pass  # Skip logo on failure

    story.append(Paragraph(_esc(company_name), h_sub))
    story.append(Paragraph(_esc(_loc(template.get("name"), locale)), h_title))
    meta = [
        ["Klien" if locale == "id" else "Client", _esc(session.get("client_name", "-"))],
        ["Proyek" if locale == "id" else "Project", _esc(session.get("project_name") or "-")],
        ["Kontak" if locale == "id" else "Contact", _esc(session.get("contact_person") or "-")],
        ["Status", _esc(session.get("status", "-"))],
        ["Progress", f"{progress.get('answered', 0)}/{progress.get('total', 0)} ({progress.get('percent', 0)}%)"],
    ]
    mt = Table(meta, colWidths=[35 * mm, 130 * mm])
    mt.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), INK),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, SOFT),
    ]))
    story.append(Spacer(1, 6))
    story.append(mt)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", color=BRAND, thickness=1.2))

    answers_map = answers_map or {}
    for d in _get_domains(template):
        visible = [q for q in d.get("questions", []) if evaluate_show_if(q.get("show_if"), answers_map)]
        if not visible:
            continue
        domain_title = _loc(d.get("title"), locale)
        domain_num = d.get("number", "")
        story.append(Spacer(1, 10))
        hdr = Table([[Paragraph(f"{domain_num}. {_esc(domain_title)}" if domain_num else _esc(domain_title), h_dom)]], colWidths=[166 * mm])
        domain_color_hex = d.get("color")
        try:
            dom_bg = colors.HexColor(domain_color_hex) if domain_color_hex else BRAND
        except Exception:
            dom_bg = BRAND
        hdr.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), dom_bg), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        story.append(hdr)
        for q in visible:
            ans = answers_map.get(q["id"])
            story.append(Paragraph(f"<b>{_esc(_get_prompt(q, locale))}</b>", q_style))
            story.append(Paragraph(_esc(_render_answer(q, ans, locale)), a_style))
            note = (ans or {}).get("note")
            if note:
                story.append(Paragraph(f"{'Catatan' if locale == 'id' else 'Note'}: {_esc(note)}", n_style))
            atts = (attachments_by_question or {}).get(q["id"], [])
            if atts:
                names = ", ".join(_esc(a.get("filename") or a.get("original_name", "file")) for a in atts)
                story.append(Paragraph(f"\U0001F4CE {'Lampiran' if locale == 'id' else 'Attachments'} ({len(atts)}): {names}", n_style))

    # AI Report section
    if ai_report:
        _build_ai_section(story, ai_report, ss, locale)

    doc.build(story)
    return buf.getvalue()
