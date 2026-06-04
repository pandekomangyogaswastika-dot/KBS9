"""Excel Export/Import untuk jawaban Assessment Session.

Export: pertanyaan + jawaban saat ini → file Excel yang bisa diisi offline.
Import: baca file Excel → bulk-upsert jawaban ke sesi assessment.

Format kolom:
  question_id | domain | no | pertanyaan_id | pertanyaan_en | type | opsi_tersedia | jawaban_anda
"""
import io
from typing import Any

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _loc(val, locale="id"):
    if isinstance(val, dict):
        return val.get(locale) or val.get("id") or val.get("en") or ""
    return str(val) if val is not None else ""


def _get_domains(template: dict) -> list:
    return template.get("domains") or template.get("sections") or []


def _get_q_text(q: dict, locale: str = "id") -> str:
    field = q.get("prompt") or q.get("text") or {}
    return _loc(field, locale)


def _normalize_type(t: str) -> str:
    aliases = {
        "select": "single_choice", "multiselect": "multi_choice",
        "yesno": "yes_no", "scale": "scale_1_5",
        "text": "text_short", "textarea": "text_long",
        "single_choice": "single_choice", "multi_choice": "multi_choice",
    }
    return aliases.get(t, t)


def _answer_to_display(q: dict, ans: dict | None) -> str:
    """Convert stored answer value → human-readable string for Excel."""
    if not ans or ans.get("skipped"):
        return ""
    val = ans.get("value")
    if val is None or val == "":
        return ""
    qtype = _normalize_type(q.get("type", "text_short"))
    opts = {o["value"]: o for o in (q.get("options") or [])}
    if qtype == "single_choice":
        opt = opts.get(val)
        return opt["value"] if opt else str(val)
    if qtype == "multi_choice":
        if isinstance(val, list):
            return "|".join(str(v) for v in val)
        return str(val)
    if qtype == "yes_no":
        if val in (True, "yes", "true", "Ya", "ya"):
            return "Ya"
        if val in (False, "no", "false", "Tidak", "tidak"):
            return "Tidak"
        return str(val)
    if qtype == "scale_1_5":
        return str(val)
    return str(val)


def _options_hint(q: dict) -> str:
    """Return pipe-separated option values for reference."""
    opts = q.get("options") or []
    if not opts:
        qtype = _normalize_type(q.get("type", ""))
        if qtype == "yes_no":
            return "Ya | Tidak"
        if qtype == "scale_1_5":
            return "1 | 2 | 3 | 4 | 5"
        return ""
    return " | ".join(o["value"] for o in opts)


# ─── Export ───────────────────────────────────────────────────────────────────

COLS = [
    "question_id",       # A — hidden, used for import matching
    "domain",            # B
    "no",                # C
    "pertanyaan",        # D
    "type",              # E
    "opsi_tersedia",     # F
    "jawaban_anda",      # G ← user fills this
]

COL_WIDTHS = [28, 22, 6, 52, 14, 42, 36]

# Palette
BG_HEADER   = "0D0F18"
BG_DOMAIN   = "1C1F30"
BG_ROW_A    = "121420"
BG_ROW_B    = "0D0F18"
BG_ANSWER   = "1A2540"  # slightly blue for answer column
FG_HEADER   = "C8C6F7"
FG_DOMAIN   = "73D1AD"
FG_ROW      = "D0CEF0"
FG_HINT     = "7A7FA8"
FG_ANSWER   = "FFFFFF"
BORDER_COL  = "2A2D45"


def _thin_border():
    s = Side(style="thin", color=BORDER_COL)
    return Border(left=s, right=s, top=s, bottom=s)


def generate_answers_excel(session: dict, template: dict, answers_map: dict, locale: str = "id") -> bytes:
    """Generate Excel with all questions pre-filled with current answers (if any)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Jawaban"

    # ── Header row ──
    hdr_fill = PatternFill(start_color=BG_HEADER, end_color=BG_HEADER, fill_type="solid")
    hdr_font = Font(bold=True, color=FG_HEADER, size=10, name="Calibri")
    hdr_labels = ["Question ID", "Domain", "No", "Pertanyaan", "Tipe", "Opsi Tersedia", "Jawaban Anda ✏"]
    for ci, label in enumerate(hdr_labels, 1):
        cell = ws.cell(row=1, column=ci, value=label)
        cell.fill = hdr_fill
        cell.font = hdr_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 28

    # ── Data rows ──
    q_no = 0
    row_idx = 2
    domains = _get_domains(template)

    for dom in domains:
        dom_title = _loc(dom.get("title", {}), locale) or _loc(dom.get("title", {}), "id")
        questions = dom.get("questions") or []
        for q in questions:
            q_no += 1
            qid = q.get("id", "")
            ans = answers_map.get(qid)
            answer_str = _answer_to_display(q, ans)
            hint_str = _options_hint(q)
            qtype = q.get("type", "text")

            # Row fill
            is_even = q_no % 2 == 0
            row_bg = BG_ROW_A if is_even else BG_ROW_B
            row_fill = PatternFill(start_color=row_bg, end_color=row_bg, fill_type="solid")
            ans_fill = PatternFill(start_color=BG_ANSWER, end_color=BG_ANSWER, fill_type="solid")
            row_font_normal = Font(color=FG_ROW, size=9, name="Calibri")
            row_font_hint = Font(color=FG_HINT, size=8, name="Calibri", italic=True)
            ans_font = Font(color=FG_ANSWER, size=9, name="Calibri", bold=True)

            values = [qid, dom_title, q_no, _get_q_text(q, locale), qtype, hint_str, answer_str]
            for ci, val in enumerate(values, 1):
                cell = ws.cell(row=row_idx, column=ci, value=val)
                cell.border = _thin_border()
                cell.alignment = Alignment(wrap_text=True, vertical="top")
                if ci == 7:  # answer column
                    cell.fill = ans_fill
                    cell.font = ans_font
                elif ci == 6:  # hints
                    cell.fill = row_fill
                    cell.font = row_font_hint
                else:
                    cell.fill = row_fill
                    cell.font = row_font_normal
            ws.row_dimensions[row_idx].height = 22
            row_idx += 1

    # ── Column widths ──
    for ci, w in enumerate(COL_WIDTHS, 1):
        ws.column_dimensions[get_column_letter(ci)].width = w

    # ── Hide question_id column (col A) — still readable for import ──
    ws.column_dimensions["A"].hidden = True

    # ── Freeze top row ──
    ws.freeze_panes = "B2"

    # ── Panduan sheet ──
    ws2 = wb.create_sheet("Panduan")
    instructions = [
        ["Field", "Keterangan"],
        ["question_id",    "ID pertanyaan (JANGAN diubah). Digunakan untuk import."],
        ["domain",         "Nama domain/seksi (hanya referensi, tidak diimport)."],
        ["no",             "Nomor urut pertanyaan (hanya referensi)."],
        ["pertanyaan",     "Teks pertanyaan (hanya referensi)."],
        ["type",           "Tipe: text|textarea|select|multiselect|yesno|scale|number"],
        ["opsi_tersedia",  "Daftar nilai opsi valid (pisah dengan |). Untuk select/multiselect isi nilai persis."],
        ["jawaban_anda",   "ISI KOLOM INI dengan jawaban Anda."],
        [],
        ["Panduan per tipe:", ""],
        ["text / textarea",  "Tulis teks bebas."],
        ["select",           "Isi dengan SATU nilai opsi persis seperti di kolom opsi_tersedia."],
        ["multiselect",      "Isi dengan beberapa nilai dipisah | contoh: nilai1|nilai2"],
        ["yesno",            "Isi: Ya atau Tidak"],
        ["scale",            "Isi angka: 1 / 2 / 3 / 4 / 5"],
        ["number",           "Isi angka."],
        [],
        ["Catatan:",         "Baris kosong di kolom jawaban_anda berarti pertanyaan tidak dijawab (akan diabaikan saat import)."],
        ["",                 "Jangan menambah/menghapus baris atau mengubah kolom question_id."],
    ]
    pan_hdr = Font(bold=True, color="C8C6F7", name="Calibri", size=10)
    pan_row = Font(color="D0CEF0", name="Calibri", size=9)
    for ri, row_data in enumerate(instructions, 1):
        for ci, val in enumerate(row_data, 1):
            cell = ws2.cell(row=ri, column=ci, value=val)
            cell.font = pan_hdr if ri == 1 else pan_row
            cell.alignment = Alignment(wrap_text=True)
    ws2.column_dimensions["A"].width = 20
    ws2.column_dimensions["B"].width = 72

    # ── Metadata sheet ──
    ws3 = wb.create_sheet("Meta")
    ws3["A1"] = "session_id"
    ws3["B1"] = session.get("id", "")
    ws3["A2"] = "template_id"
    ws3["B2"] = session.get("template_id", "")
    ws3["A3"] = "generated_at"
    from datetime import datetime, timezone
    ws3["B3"] = datetime.now(timezone.utc).isoformat()

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


# ─── Import ───────────────────────────────────────────────────────────────────

def _parse_answer(q: dict, raw_val: Any) -> dict | None:
    """Convert raw Excel cell value → answer dict {value, skipped}."""
    if raw_val is None or str(raw_val).strip() == "":
        return None  # skip empty cells

    raw = str(raw_val).strip()
    qtype = _normalize_type(q.get("type", "text_short"))
    opts = {o["value"]: o for o in (q.get("options") or [])}
    opts_by_label_id = {_loc(o.get("label", {}), "id").lower(): o["value"] for o in (q.get("options") or [])}
    opts_by_label_en = {_loc(o.get("label", {}), "en").lower(): o["value"] for o in (q.get("options") or [])}

    if qtype == "single_choice":
        # Try exact value match first, then label match
        if raw in opts:
            return {"value": raw, "skipped": False}
        lower = raw.lower()
        if lower in opts_by_label_id:
            return {"value": opts_by_label_id[lower], "skipped": False}
        if lower in opts_by_label_en:
            return {"value": opts_by_label_en[lower], "skipped": False}
        # Fallback: return as-is (might be a valid custom value)
        return {"value": raw, "skipped": False}

    if qtype == "multi_choice":
        parts = [p.strip() for p in raw.split("|") if p.strip()]
        resolved = []
        for p in parts:
            if p in opts:
                resolved.append(p)
            elif p.lower() in opts_by_label_id:
                resolved.append(opts_by_label_id[p.lower()])
            elif p.lower() in opts_by_label_en:
                resolved.append(opts_by_label_en[p.lower()])
            else:
                resolved.append(p)
        return {"value": resolved, "skipped": False} if resolved else None

    if qtype == "yes_no":
        lower = raw.lower()
        if lower in ("ya", "yes", "y", "true", "1"):
            return {"value": True, "skipped": False}
        if lower in ("tidak", "no", "n", "false", "0"):
            return {"value": False, "skipped": False}
        return None

    if qtype == "scale_1_5":
        try:
            n = int(float(raw))
            if 1 <= n <= 5:
                return {"value": n, "skipped": False}
        except (ValueError, TypeError):
            pass
        return None

    if qtype == "number":
        try:
            return {"value": float(raw) if "." in raw else int(raw), "skipped": False}
        except (ValueError, TypeError):
            return None

    # text_short, text_long, default
    return {"value": raw, "skipped": False}


def parse_answers_excel(file_bytes: bytes, template: dict) -> list[dict]:
    """Parse uploaded Excel → list of {question_id, value, skipped, other_text, note}."""
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)

    # Find Jawaban sheet
    ws = None
    for name in wb.sheetnames:
        if name.lower() in ("jawaban", "answers", "sheet"):
            ws = wb[name]
            break
    if ws is None:
        ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return []

    # Build question index from template for fast lookup
    q_index: dict[str, dict] = {}
    for dom in _get_domains(template):
        for q in dom.get("questions") or []:
            if q.get("id"):
                q_index[q["id"]] = q

    # Detect header columns
    header = [str(c).strip().lower() if c else "" for c in rows[0]]
    try:
        qid_col = next(i for i, h in enumerate(header) if "question_id" in h or "id" == h)
    except StopIteration:
        qid_col = 0  # fallback: col A

    try:
        ans_col = next(i for i, h in enumerate(header) if "jawaban" in h or "answer" in h)
    except StopIteration:
        ans_col = 6  # fallback: col G (0-indexed)

    results: list[dict] = []
    for row in rows[1:]:
        if all(c is None or str(c).strip() == "" for c in row):
            continue
        if qid_col >= len(row):
            continue
        qid = str(row[qid_col] or "").strip()
        if not qid or qid not in q_index:
            continue

        raw_val = row[ans_col] if ans_col < len(row) else None
        parsed = _parse_answer(q_index[qid], raw_val)
        if parsed is None:
            continue  # blank → skip this question

        results.append({
            "question_id": qid,
            "value": parsed["value"],
            "skipped": parsed.get("skipped", False),
            "other_text": None,
            "note": None,
        })

    return results
