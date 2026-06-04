"""Professional corporate assessment PDF — Bold Corporate Redesign.

Bold corporate style:
- Dark cover page (full background) with company branding
- Executive summary table (all domains, completion, scoring)
- Per-domain sections with dark header bars + bordered Q&A tables
- Scoring/maturity per domain (scale questions)
- Conditional empty-domain hiding
- Page footer with page numbers
- Fully configurable via CMS PDF settings (pdf_config dict)
"""
import io
import tempfile
import urllib.request
from datetime import datetime, timezone
from functools import partial

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, Image as RLImage,
    KeepTogether, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

from assessment_engine import OTHER_SENTINEL, evaluate_show_if, _get_domains

# ─── Palette ───────────────────────────────────────────────────────────────────
C_COVER_BG  = colors.HexColor("#0D0F1C")
C_COVER_MID = colors.HexColor("#151826")
C_NAVY      = colors.HexColor("#1A1E35")
C_INK       = colors.HexColor("#1A1C25")
C_MUTED     = colors.HexColor("#5A6070")
C_FAINT     = colors.HexColor("#9298AE")
C_WHITE     = colors.white
C_SOFT      = colors.HexColor("#F3F4F9")
C_ROW_A     = colors.white
C_ROW_B     = colors.HexColor("#F7F8FD")
C_SKIPPED   = colors.HexColor("#FFFDF0")
C_EMPTY     = colors.HexColor("#FAFAFA")
C_BORDER    = colors.HexColor("#CED2E5")

# ─── Maturity labels (for scale_1_5 domains) ──────────────────────────────────
MATURITY = {
    1: ("Awal",        "Initial"),
    2: ("Berkembang",  "Developing"),
    3: ("Terdefinisi", "Defined"),
    4: ("Terkelola",   "Managed"),
    5: ("Optimal",     "Optimizing"),
}

# ─── Default PDF config ────────────────────────────────────────────────────────
DEFAULT_CONFIG = {
    "company_name":     "KUBUS TEKNOLOGI INDONESIA",
    "company_tagline":  "IT Solutions & Digital Transformation",
    "logo_url":         None,
    "brand_color":      "#5B49C9",
    "accent_color":     "#1D7874",
    "footer_text":      "Dokumen ini bersifat rahasia dan hanya untuk penerima yang dituju",
    "show_empty_domains": True,
    "show_notes":       True,
    "show_scoring":     True,
    "show_cover":       True,
    "show_summary":     True,
    "show_attachments": True,
}

# ─── Helpers ───────────────────────────────────────────────────────────────────

def _loc(val, locale="id"):
    if isinstance(val, dict):
        return val.get(locale) or val.get("id") or val.get("en") or ""
    return str(val) if val is not None else ""


def _esc(t):
    return str(t or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _get_prompt(q, locale):
    field = q.get("prompt") or q.get("text") or {}
    return _loc(field, locale)


def _normalize_type(t):
    return {
        "select": "single_choice", "multiselect": "multi_choice",
        "yesno": "yes_no", "scale": "scale_1_5",
        "text": "text_short", "textarea": "text_long",
    }.get(t, t)


def _render_answer(q, ans, locale):
    none_txt = "—"
    if not ans:
        return none_txt
    if ans.get("skipped"):
        return "(Dilewati)" if locale == "id" else "(Skipped)"
    val = ans.get("value")
    if val is None or val == "":
        return none_txt
    other = (ans.get("other_text") or "").strip()
    other_lbl = "Lainnya" if locale == "id" else "Other"
    qtype = _normalize_type(q.get("type", ""))
    opts = {o["value"]: o for o in (q.get("options") or [])}
    if qtype == "single_choice":
        if val == OTHER_SENTINEL:
            return f"{other_lbl}: {other}" if other else none_txt
        opt = opts.get(val)
        return _loc(opt.get("label"), locale) if opt else str(val)
    if qtype == "multi_choice":
        if not val:
            return none_txt
        parts = []
        for v in (val if isinstance(val, list) else [val]):
            if v == OTHER_SENTINEL:
                if other:
                    parts.append(f"{other_lbl}: {other}")
            else:
                opt = opts.get(v)
                parts.append(_loc(opt["label"], locale) if opt else str(v))
        return ", ".join(parts) or none_txt
    if qtype == "yes_no":
        if val in (True, "yes", "true", "Ya", "ya"):
            return "Ya" if locale == "id" else "Yes"
        if val in (False, "no", "false", "Tidak", "tidak"):
            return "Tidak" if locale == "id" else "No"
        return none_txt
    if qtype == "scale_1_5":
        return f"{val}/5" if val not in (None, "") else none_txt
    return str(val) if val not in (None, "") else none_txt


def _build_options_display(q, ans, qtype, locale, style_sel, style_none, style_skip):
    """Show ALL answer options with selected one marked '>>' — mimics web form display."""
    opts = q.get("options") or []
    val = (ans or {}).get("value")
    is_skipped = bool(ans and ans.get("skipped"))

    if is_skipped:
        return Paragraph("(Dilewati)" if locale == "id" else "(Skipped)", style_skip)

    # Synthetic options for yes_no
    if qtype == "yes_no" and not opts:
        opts = [
            {"value": "ya",    "label": {"id": "Ya",    "en": "Yes"}},
            {"value": "tidak", "label": {"id": "Tidak", "en": "No"}},
        ]

    # Resolve selected values
    selected_set: set = set()
    if val is not None and val != "":
        if qtype == "yes_no":
            if val in (True, "yes", "true", "Ya", "ya", 1, "1"):
                selected_set = {"ya"}
            elif val in (False, "no", "false", "Tidak", "tidak", 0, "0"):
                selected_set = {"tidak"}
        elif qtype == "multi_choice":
            selected_set = {str(v) for v in (val if isinstance(val, list) else [val])}
        else:
            selected_set = {str(val)}

    if not opts:
        ans_text = _render_answer(q, ans, locale)
        return Paragraph(
            _esc(ans_text) if ans_text and ans_text != "—" else
            ("Belum dijawab" if locale == "id" else "Not answered"),
            style_none,
        )

    parts = []
    for opt in opts:
        opt_val = str(opt.get("value", ""))
        opt_label = _loc(opt.get("label", {}), locale) or opt_val
        is_sel = (opt_val in selected_set or
                  opt_val.lower() in {v.lower() for v in selected_set})
        if is_sel:
            parts.append(Paragraph(f">> {_esc(opt_label)}", style_sel))
        else:
            parts.append(Paragraph(_esc(opt_label), style_none))

    return parts if parts else Paragraph(
        "Belum dijawab" if locale == "id" else "Not answered", style_none
    )


def _build_scale_display(q, ans, locale, style_sel, style_none):
    """Show scale 1–5 with selected bracket marker and maturity label."""
    val = (ans or {}).get("value")
    if (ans or {}).get("skipped"):
        return Paragraph("(Dilewati)" if locale == "id" else "(Skipped)", style_none)
    try:
        selected = int(float(val)) if val is not None and val != "" else None
    except (TypeError, ValueError):
        selected = None

    if selected is None:
        return Paragraph("Belum dijawab" if locale == "id" else "Not answered", style_none)

    # Build: " 1    2   [3]   4    5 "
    parts_text = []
    for i in range(1, 6):
        parts_text.append(f"[{i}]" if i == selected else f" {i} ")
    scale_line = "  ".join(parts_text)
    maturity = _maturity_label(float(selected), locale)
    sub_line = f"{selected}/5 — {maturity}" if maturity != "—" else f"{selected}/5"

    return [Paragraph(scale_line, style_sel), Paragraph(sub_line, style_none)]


def _domain_progress(domain, answers_map):
    qs = domain.get("questions") or []
    visible = [q for q in qs if evaluate_show_if(q.get("show_if"), answers_map)]
    answered = sum(
        1 for q in visible
        if (answers_map or {}).get(q.get("id", "")) and
        not (answers_map or {}).get(q.get("id", ""), {}).get("skipped") and
        (answers_map or {}).get(q.get("id", ""), {}).get("value") not in (None, "")
    )
    total = len(visible)
    pct = round(answered / total * 100) if total else 0
    return answered, total, pct


def _domain_score(domain, answers_map):
    """Return (avg_score_float, has_scale_qs). avg_score is None if no scale answers."""
    vals = []
    for q in (domain.get("questions") or []):
        if _normalize_type(q.get("type", "")) == "scale_1_5":
            ans = (answers_map or {}).get(q.get("id", ""))
            if ans and not ans.get("skipped") and ans.get("value") is not None:
                try:
                    vals.append(float(ans["value"]))
                except (TypeError, ValueError):
                    pass
    if not vals:
        return None, False
    return round(sum(vals) / len(vals), 1), True


def _maturity_label(score, locale):
    if score is None:
        return "—"
    idx = max(1, min(5, round(score)))
    return MATURITY[idx][0 if locale == "id" else 1]


def _try_load_logo(logo_url):
    if not logo_url:
        return None
    try:
        with urllib.request.urlopen(logo_url, timeout=5) as r:
            data = r.read()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        tmp.write(data)
        tmp.close()
        return tmp.name
    except Exception:
        return None


# ─── Page template callbacks ──────────────────────────────────────────────────

def _draw_cover_bg(canvas, doc, brand_color):
    """Draw the full dark cover background."""
    canvas.saveState()
    w, h = A4
    # Background
    canvas.setFillColor(C_COVER_BG)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    # Bottom lighter zone
    canvas.setFillColor(C_COVER_MID)
    canvas.rect(0, 0, w, 65 * mm, fill=1, stroke=0)
    # Top accent bar
    canvas.setFillColor(brand_color)
    canvas.rect(0, h - 2.5 * mm, w, 2.5 * mm, fill=1, stroke=0)
    # Bottom accent bar
    canvas.setFillColor(brand_color)
    canvas.rect(0, 0, w, 1.2 * mm, fill=1, stroke=0)
    # Subtle side accents
    canvas.setFillColorRGB(1, 1, 1, 0.03)
    canvas.rect(0, h * 0.42, w * 0.35, 0.6, fill=1, stroke=0)
    canvas.restoreState()


def _draw_content_footer(canvas, doc, config, brand_color, company_name):
    """Draw footer line and text on content pages."""
    canvas.saveState()
    w, h = A4
    y_line = 15 * mm
    canvas.setStrokeColor(brand_color)
    canvas.setLineWidth(0.7)
    canvas.line(16 * mm, y_line, w - 16 * mm, y_line)

    canvas.setFont("Helvetica", 7)
    footer_text = config.get("footer_text", "Dokumen ini bersifat rahasia")
    canvas.setFillColor(C_FAINT)
    canvas.drawString(16 * mm, 10 * mm, footer_text)
    canvas.drawCentredString(w / 2, 10 * mm, company_name)
    canvas.drawRightString(w - 16 * mm, 10 * mm, f"Halaman {doc.page}")
    canvas.restoreState()


# ─── Cover content builders ───────────────────────────────────────────────────

def _build_cover(story, session, template, progress, locale, brand, accent, logo_path, company, tagline, config):
    h2_cover = ParagraphStyle("h2c", fontName="Helvetica-Bold", fontSize=9, textColor=C_FAINT,
                               leading=13, alignment=TA_LEFT)
    h1_cover = ParagraphStyle("h1c", fontName="Helvetica-Bold", fontSize=26, textColor=C_WHITE,
                               leading=32, alignment=TA_LEFT, spaceAfter=2)
    sub_cover = ParagraphStyle("sc", fontName="Helvetica", fontSize=12, textColor=brand,
                                leading=15, alignment=TA_LEFT)
    meta_key = ParagraphStyle("mk", fontName="Helvetica", fontSize=9, textColor=C_FAINT,
                               leading=13, alignment=TA_LEFT)
    meta_val = ParagraphStyle("mv", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE,
                               leading=13, alignment=TA_LEFT)
    tag_style = ParagraphStyle("ts", fontName="Helvetica", fontSize=8, textColor=C_FAINT,
                                leading=11, alignment=TA_CENTER)

    content_w = A4[0] - 32 * mm  # frame width
    spacer_top = Spacer(1, 22 * mm)

    # Logo
    logo_el = []
    if logo_path:
        try:
            logo_el = [RLImage(logo_path, width=45 * mm, height=16 * mm, kind="proportional"), Spacer(1, 6 * mm)]
        except Exception:
            pass
    if not logo_el:
        logo_el = [Paragraph(_esc(company), h2_cover), Spacer(1, 6 * mm)]

    # Title block
    tpl_name = _loc(template.get("name", {}), locale)
    client_name = session.get("client_name") or "—"
    project_name = session.get("project_name") or "—"
    contact = session.get("contact_person") or "—"
    now_str = datetime.now(timezone.utc).strftime("%d %B %Y")
    status = session.get("status", "draft")
    answered = progress.get("answered", 0)
    total = progress.get("total", 0)
    pct = progress.get("percent", 0)

    title_block = [
        spacer_top,
        *logo_el,
        Spacer(1, 10 * mm),
        Paragraph(_esc(tpl_name), h1_cover),
        Paragraph(_esc(tagline), sub_cover),
        Spacer(1, 8 * mm),
    ]

    # Metadata table (dark, minimal)
    meta_data = [
        [Paragraph(("Klien" if locale == "id" else "Client") + ":", meta_key),
         Paragraph(_esc(client_name), meta_val)],
        [Paragraph(("Proyek" if locale == "id" else "Project") + ":", meta_key),
         Paragraph(_esc(project_name), meta_val)],
        [Paragraph(("Kontak" if locale == "id" else "Contact") + ":", meta_key),
         Paragraph(_esc(contact), meta_val)],
        [Paragraph("Status:", meta_key),
         Paragraph(_esc(status.upper()), meta_val)],
        [Paragraph("Tanggal:", meta_key),
         Paragraph(_esc(now_str), meta_val)],
    ]
    meta_tbl = Table(meta_data, colWidths=[28 * mm, content_w - 28 * mm])
    meta_tbl.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW",     (0, 0), (-1, -2), 0.3, colors.HexColor("#2A2E45")),
    ]))

    # Progress block
    prog_label = ParagraphStyle("pl", fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE, leading=14)
    prog_sub   = ParagraphStyle("ps", fontName="Helvetica", fontSize=8, textColor=C_FAINT, leading=11)
    # Progress bar as a table
    bar_row = [
        [Paragraph(f"{answered}/{total}", prog_label), ""],
    ]
    bar_tbl = Table(bar_row, colWidths=[30 * mm, content_w - 30 * mm])
    bar_tbl.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    prog_pct_text = f"{pct}% {'dijawab' if locale == 'id' else 'answered'}"
    prog_block = [
        Spacer(1, 10 * mm),
        Paragraph(
            f"Progress: <b>{prog_pct_text}</b>  —  {answered} dari {total} pertanyaan",
            prog_sub,
        ),
        Spacer(1, 1.5 * mm),
        HRFlowable(width=f"{pct}%", color=brand, thickness=3, lineCap="round"),
        HRFlowable(width="100%", color=colors.HexColor("#1E2235"), thickness=1),
    ]

    # Company tagline at bottom
    bottom_block = [
        Spacer(1, 24 * mm),
        Paragraph(_esc(config.get("company_name", company)), tag_style),
        Paragraph(_esc(tagline), tag_style),
    ]

    for el in [*title_block, meta_tbl, *prog_block, *bottom_block]:
        story.append(el)


# ─── Summary table ─────────────────────────────────────────────────────────────

def _build_summary(story, template, answers_map, progress, locale, brand, accent, config):
    h2 = ParagraphStyle("h2s", fontName="Helvetica-Bold", fontSize=12, textColor=C_INK, leading=16,
                         spaceBefore=0, spaceAfter=6)
    cell_norm = ParagraphStyle("cn", fontName="Helvetica", fontSize=9, textColor=C_INK, leading=12)
    cell_hdr  = ParagraphStyle("ch", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE, leading=12)
    cell_pct  = ParagraphStyle("cp", fontName="Helvetica-Bold", fontSize=9, textColor=brand, leading=12)

    domains = _get_domains(template)
    show_scoring = config.get("show_scoring", True)

    story.append(Paragraph("Ringkasan Pelaksanaan" if locale == "id" else "Assessment Summary", h2))

    hdrs_id = ["No", "Domain / Seksi", "Dijawab", "Total", "%", "Skor", "Maturitas"]
    hdrs_en = ["No", "Domain / Section", "Answered", "Total", "%", "Score", "Maturity"]
    hdrs = hdrs_id if locale == "id" else hdrs_en

    if not show_scoring:
        hdrs = hdrs[:5]

    rows = [[Paragraph(_esc(h), cell_hdr) for h in hdrs]]
    col_widths_full = [10 * mm, 60 * mm, 22 * mm, 18 * mm, 20 * mm, 18 * mm, 30 * mm]
    col_widths_no_score = [10 * mm, 85 * mm, 25 * mm, 20 * mm, 25 * mm]
    col_widths = col_widths_full if show_scoring else col_widths_no_score

    for idx, dom in enumerate(domains, 1):
        dom_title = _loc(dom.get("title", {}), locale)
        answered, total, pct = _domain_progress(dom, answers_map)
        pct_str = f"{pct}%"
        score, has_scale = _domain_score(dom, answers_map)
        score_str = f"{score}" if score is not None else "—"
        maturity_str = _maturity_label(score, locale) if has_scale else "—"

        row_data = [
            Paragraph(str(idx), cell_norm),
            Paragraph(_esc(dom_title), cell_norm),
            Paragraph(str(answered), cell_norm),
            Paragraph(str(total), cell_norm),
            Paragraph(pct_str, cell_pct),
        ]
        if show_scoring:
            row_data += [
                Paragraph(score_str, cell_norm),
                Paragraph(maturity_str, cell_norm),
            ]
        rows.append(row_data)

    # Overall row
    oa, ot = progress.get("answered", 0), progress.get("total", 0)
    opct = f"{round(oa / ot * 100) if ot else 0}%"
    total_row = [
        Paragraph("", cell_hdr),
        Paragraph("TOTAL", cell_hdr),
        Paragraph(str(oa), cell_hdr),
        Paragraph(str(ot), cell_hdr),
        Paragraph(opct, cell_hdr),
    ]
    if show_scoring:
        total_row += [Paragraph("", cell_hdr), Paragraph("", cell_hdr)]
    rows.append(total_row)

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    n = len(rows)
    tbl.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",   (0, 0), (-1, 0), C_NAVY),
        ("TEXTCOLOR",    (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        # Total row
        ("BACKGROUND",   (0, n - 1), (-1, n - 1), C_NAVY),
        ("TEXTCOLOR",    (0, n - 1), (-1, n - 1), C_WHITE),
        # Row alternating
        *[("BACKGROUND", (0, r), (-1, r), C_ROW_B if r % 2 == 0 else C_ROW_A)
          for r in range(1, n - 1)],
        # Borders
        ("GRID",         (0, 0), (-1, -1), 0.4, C_BORDER),
        ("BOX",          (0, 0), (-1, -1), 0.7, C_BORDER),
        ("LINEBELOW",    (0, 0), (-1, 0), 1.2, brand),
        # Padding
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",        (2, 0), (-1, -1), "CENTER"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 8 * mm))


# ─── Domain section ────────────────────────────────────────────────────────────

def _build_domain_section(story, domain, visible_qs, answers_map, locale, brand, accent,
                           domain_idx, attachments_by_question, config):
    domain_title = _loc(domain.get("title", {}), locale)
    domain_num = domain.get("number", str(domain_idx + 1))
    answered, total, pct = _domain_progress(domain, answers_map)
    score, has_scale = _domain_score(domain, answers_map)

    # Domain header color
    raw_dom_color = domain.get("color")
    try:
        dom_bg = colors.HexColor(raw_dom_color) if raw_dom_color else brand
    except Exception:
        dom_bg = brand

    h_dom = ParagraphStyle("hd", fontName="Helvetica-Bold", fontSize=11, textColor=C_WHITE,
                            leading=15, alignment=TA_LEFT)
    h_dom_meta = ParagraphStyle("hdm", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#C0C8F0"),
                                 leading=11, alignment=TA_RIGHT)
    cell_q       = ParagraphStyle("cq",   fontName="Helvetica",         fontSize=9, textColor=C_INK,                          leading=12)
    cell_q_hdr   = ParagraphStyle("cqh",  fontName="Helvetica-Bold",    fontSize=9, textColor=C_WHITE,                        leading=12)
    cell_ans     = ParagraphStyle("ca",   fontName="Helvetica",         fontSize=9, textColor=colors.HexColor("#1D6060"),      leading=12)
    cell_ans_none= ParagraphStyle("can",  fontName="Helvetica-Oblique", fontSize=8, textColor=C_FAINT,                        leading=11)
    cell_ans_skip= ParagraphStyle("cas",  fontName="Helvetica-Oblique", fontSize=8, textColor=colors.HexColor("#A08030"),     leading=11)
    cell_no      = ParagraphStyle("cno",  fontName="Helvetica-Bold",    fontSize=9, textColor=C_MUTED, alignment=TA_CENTER,   leading=12)
    cell_note    = ParagraphStyle("cnte", fontName="Helvetica-Oblique", fontSize=8, textColor=C_FAINT,                        leading=11)
    # Pre-define status styles (avoid same-name re-creation each loop)
    cell_ok   = ParagraphStyle("cok",   fontName="Helvetica-Bold", fontSize=9, textColor=accent,  alignment=TA_CENTER, leading=12)
    cell_skip_s = ParagraphStyle("cskip", fontName="Helvetica",     fontSize=9, textColor=C_FAINT, alignment=TA_CENTER, leading=12)
    cell_empty_s= ParagraphStyle("cempty",fontName="Helvetica",     fontSize=9, textColor=C_FAINT, alignment=TA_CENTER, leading=12)
    # Option display styles (for choice + scale questions)
    opt_sel  = ParagraphStyle("opsel",  fontName="Helvetica-Bold", fontSize=9,   textColor=accent, leading=12, leftIndent=0)
    opt_none = ParagraphStyle("opnone", fontName="Helvetica",       fontSize=8.5, textColor=C_FAINT, leading=11,  leftIndent=10)

    # Domain header row
    score_str = ""
    if config.get("show_scoring", True) and has_scale and score is not None:
        maturity = _maturity_label(score, locale)
        score_str = f"Skor: {score}/5  ({maturity})"
    prog_str = f"{pct}%  ({answered}/{total})"
    meta_line = f"{prog_str}   {score_str}".strip()

    dom_hdr = Table(
        [[
            Paragraph(f"{domain_num}. {_esc(domain_title)}", h_dom),
            Paragraph(_esc(meta_line), h_dom_meta),
        ]],
        colWidths=[100 * mm, 78 * mm],
    )
    dom_hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), dom_bg),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))

    # Q&A table
    qa_hdrs = [
        Paragraph("#", cell_q_hdr),
        Paragraph("Pertanyaan" if locale == "id" else "Question", cell_q_hdr),
        Paragraph("Jawaban" if locale == "id" else "Answer", cell_q_hdr),
        Paragraph("", cell_q_hdr),
    ]
    qa_rows = [qa_hdrs]

    show_notes = config.get("show_notes", True)
    show_attachments = config.get("show_attachments", True)

    for q_idx, q in enumerate(visible_qs, 1):
        qid = q.get("id", "")
        ans = (answers_map or {}).get(qid)
        has_answer = bool(ans and not ans.get("skipped") and ans.get("value") not in (None, ""))
        is_skipped = bool(ans and ans.get("skipped"))

        # Answer cell — show all options for choice/scale (mimics web form)
        qtype_n = _normalize_type(q.get("type", ""))
        if qtype_n in ("single_choice", "multi_choice", "yes_no"):
            ans_cell = _build_options_display(q, ans, qtype_n, locale, opt_sel, opt_none, cell_ans_skip)
        elif qtype_n == "scale_1_5":
            ans_cell = _build_scale_display(q, ans, locale, opt_sel, opt_none)
        else:
            ans_text = _render_answer(q, ans, locale)
            if has_answer:
                ans_cell = Paragraph(_esc(ans_text), cell_ans)
            elif is_skipped:
                ans_cell = Paragraph(_esc(ans_text), cell_ans_skip)
            else:
                ans_cell = Paragraph("Belum dijawab" if locale == "id" else "Not answered", cell_ans_none)

        # Question cell (may include note + attachments as sub-items)
        q_content_parts = [Paragraph(_esc(_get_prompt(q, locale) or "—"), cell_q)]
        note = (ans or {}).get("note") if show_notes else None
        if note:
            q_content_parts.append(Paragraph(f"{'Catatan' if locale == 'id' else 'Note'}: {_esc(note)}", cell_note))
        if show_attachments:
            atts = (attachments_by_question or {}).get(qid, [])
            if atts:
                names = ", ".join(a.get("filename") or a.get("original_name", "file") for a in atts)
                q_content_parts.append(Paragraph(f"Lampiran: {_esc(names)}", cell_note))
        q_cell = q_content_parts[0] if len(q_content_parts) == 1 else q_content_parts

        # Status cell — ASCII only, no Unicode
        if has_answer:
            status_cell = Paragraph("Ya", cell_ok)
        elif is_skipped:
            status_cell = Paragraph("-", cell_skip_s)
        else:
            status_cell = Paragraph("", cell_empty_s)

        row = [Paragraph(str(q_idx), cell_no), q_cell, ans_cell, status_cell]
        qa_rows.append(row)

    col_w = [10 * mm, 90 * mm, 70 * mm, 8 * mm]
    qa_tbl = Table(qa_rows, colWidths=col_w, repeatRows=1)

    n = len(qa_rows)
    row_styles = []
    for r in range(1, n):
        if r - 1 < len(visible_qs):
            qid_r = visible_qs[r - 1].get("id", "")
            ans_r = (answers_map or {}).get(qid_r)
        else:
            ans_r = None
        has_a = bool(ans_r and not ans_r.get("skipped") and ans_r.get("value") not in (None, ""))
        is_s  = bool(ans_r and ans_r.get("skipped"))
        if is_s:
            row_styles.append(("BACKGROUND", (0, r), (-1, r), C_SKIPPED))
        elif not has_a:
            row_styles.append(("BACKGROUND", (0, r), (-1, r), C_EMPTY))
        else:
            row_styles.append(("BACKGROUND", (0, r), (-1, r), C_ROW_A if r % 2 != 0 else C_ROW_B))

    qa_tbl.setStyle(TableStyle([
        # Header
        ("BACKGROUND",    (0, 0), (-1, 0), C_NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        # Borders
        ("GRID",          (0, 0), (-1, -1), 0.3, C_BORDER),
        ("BOX",           (0, 0), (-1, -1), 0.6, C_BORDER),
        ("LINEBELOW",     (0, 0), (-1, 0), 1.0, dom_bg),
        # Padding
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("ALIGN",        (0, 0), (0, -1), "CENTER"),
        ("ALIGN",        (3, 0), (3, -1), "CENTER"),
        *row_styles,
    ]))

    story.append(KeepTogether([dom_hdr, Spacer(1, 0)]))
    story.append(qa_tbl)
    story.append(Spacer(1, 6 * mm))


# ─── AI section (reuse from legacy) ───────────────────────────────────────────

def _build_ai_section(story, ai_report, brand, accent, locale):
    ss = getSampleStyleSheet()
    body = ParagraphStyle("body", parent=ss["Normal"], fontSize=9, textColor=C_INK, leading=13)
    h3 = ParagraphStyle("h3ai", fontName="Helvetica-Bold", fontSize=11, textColor=brand, spaceBefore=8, spaceAfter=4)
    bullet = ParagraphStyle("bull", parent=body, leftIndent=12)
    domain_hdr = ParagraphStyle("dhai", fontName="Helvetica-Bold", fontSize=10, textColor=C_INK, spaceBefore=6, spaceAfter=2)
    domain_bullet = ParagraphStyle("dbai", parent=body, leftIndent=16)

    story.append(PageBreak())
    story.append(Paragraph("Analisis AI" if locale == "id" else "AI Analysis", h3))
    overall = ai_report.get("overall") or {}
    if overall.get("summary"):
        story.append(Paragraph(_esc(overall["summary"]), body))
        story.append(Spacer(1, 6))
    if ai_report.get("domains"):
        story.append(Paragraph("Insight per Domain" if locale == "id" else "Domain Insights", h3))
        for dom_r in ai_report["domains"]:
            story.append(Paragraph(_esc(dom_r.get("name", "")), domain_hdr))
            if dom_r.get("analysis"):
                story.append(Paragraph(_esc(dom_r["analysis"]), body))
            for i, rec in enumerate(dom_r.get("recommendations", [])[:3], 1):
                story.append(Paragraph(f"{i}. {_esc(rec)}", domain_bullet))
            story.append(Spacer(1, 4))
    if overall.get("next_steps"):
        story.append(Paragraph("Langkah Selanjutnya" if locale == "id" else "Next Steps", h3))
        for i, step in enumerate(overall["next_steps"], 1):
            story.append(Paragraph(f"{i}. {_esc(step)}", bullet))
    if ai_report.get("recommendations"):
        story.append(Paragraph("Prioritas Aksi" if locale == "id" else "Priority Actions", h3))
        for i, rec in enumerate(ai_report["recommendations"], 1):
            story.append(Paragraph(f"{i}. {_esc(rec)}", bullet))


# ─── Main builder ──────────────────────────────────────────────────────────────

def build_pdf(session, template, answers_map, progress, attachments_by_question=None,
              locale="id", ai_report=None, pdf_config=None):
    """Build a professional corporate PDF for an assessment session.

    Args:
        session: assessment_sessions document
        template: assessment_templates document
        answers_map: {question_id: answer_doc}
        progress: {answered, total, percent}
        attachments_by_question: {question_id: [attachment]}
        locale: "id" | "en"
        ai_report: optional AI analysis dict
        pdf_config: optional CMS pdf config dict (merged with DEFAULT_CONFIG)
    """
    config = {**DEFAULT_CONFIG, **(pdf_config or {})}

    # Brand color (session override > config)
    brand_hex = session.get("brand_color") or config.get("brand_color") or "#5B49C9"
    try:
        brand = colors.HexColor(brand_hex)
    except Exception:
        brand = colors.HexColor("#5B49C9")

    accent_hex = config.get("accent_color") or "#1D7874"
    try:
        accent = colors.HexColor(accent_hex)
    except Exception:
        accent = colors.HexColor("#1D7874")

    company = config.get("company_name") or session.get("company_name") or "KUBUS TEKNOLOGI INDONESIA"
    tagline = config.get("company_tagline") or "IT Solutions & Digital Transformation"
    logo_url = session.get("company_logo_url") or config.get("logo_url")
    logo_path = _try_load_logo(logo_url)

    buf = io.BytesIO()

    # ── Document ──
    doc = BaseDocTemplate(
        buf, pagesize=A4,
        topMargin=20 * mm, bottomMargin=24 * mm,
        leftMargin=16 * mm, rightMargin=16 * mm,
        title="Assessment Report",
    )

    # ── Page templates ──
    cover_frame = Frame(
        16 * mm, 24 * mm, doc.width, doc.height, id="cover"
    )
    content_frame = Frame(
        doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal"
    )

    cover_template = PageTemplate(
        "cover", [cover_frame],
        onPage=partial(_draw_cover_bg, brand_color=brand),
    )
    content_template = PageTemplate(
        "content", [content_frame],
        onPage=partial(_draw_content_footer, config=config, brand_color=brand, company_name=company),
    )
    doc.addPageTemplates([cover_template, content_template])

    story = []

    # ── Cover Page ──
    if config.get("show_cover", True):
        _build_cover(story, session, template, progress, locale, brand, accent, logo_path, company, tagline, config)
        story.append(NextPageTemplate("content"))
        story.append(PageBreak())
    else:
        story.append(NextPageTemplate("content"))

    # ── Summary table ──
    if config.get("show_summary", True):
        _build_summary(story, template, answers_map, progress, locale, brand, accent, config)

    # ── Domain sections ──
    domains = _get_domains(template)
    for d_idx, domain in enumerate(domains):
        visible = [q for q in (domain.get("questions") or [])
                   if evaluate_show_if(q.get("show_if"), answers_map)]
        # Sembunyikan domain HANYA jika benar-benar tidak ada pertanyaan (bukan karena 0 jawaban)
        # Pertanyaan SELALU ditampilkan meski belum dijawab (blank = "Belum dijawab")
        if len(visible) == 0:
            continue
        _build_domain_section(
            story, domain, visible, answers_map, locale, brand, accent,
            d_idx, attachments_by_question, config,
        )

    # ── AI section ──
    if ai_report:
        _build_ai_section(story, ai_report, brand, accent, locale)

    # Cleanup logo temp file
    if logo_path:
        try:
            import os as _os
            _os.unlink(logo_path)
        except Exception:
            pass

    doc.build(story)
    return buf.getvalue()
