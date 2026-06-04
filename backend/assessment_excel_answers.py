"""Excel Export/Import untuk jawaban Assessment Session — Professional Edition.

Export: pertanyaan + opsi lengkap + jawaban saat ini → Excel formal dengan dropdown validasi.
Import: baca Excel → bulk-upsert jawaban ke sesi assessment.

Kolom: question_id (hidden) | No | Domain | Pertanyaan | Tipe | Panduan Pengisian | Jawaban Anda
Fitur:
  - Dropdown validasi otomatis untuk single_choice, yes_no, scale
  - Opsi ditampilkan LENGKAP (tidak disingkat), dengan value dan label
  - Tema profesional: background putih/abu muda, header navy, teks gelap
  - Sheet Panduan dengan teks gelap (readable)
"""
import io
from typing import Any

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side, GradientFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

# ─── Colour palette (professional light theme) ─────────────────────────────────
HDR_BG     = "1E3A5F"   # deep navy header
HDR_FG     = "FFFFFF"   # white text on header
DOM_BG     = "E8EDF5"   # light blue-gray for domain rows
DOM_FG     = "1A2D4F"   # dark navy for domain text
ROW_A_BG   = "FFFFFF"   # white row
ROW_B_BG   = "F4F6FB"   # very light blue-gray alt row
ROW_FG     = "1A1C25"   # almost black text
ANS_BG     = "EBF5EC"   # very light green for answer column
ANS_BG_PRE = "D6EED8"   # slightly darker green when pre-filled
HINT_FG    = "4A5568"   # medium dark gray for hints
BORDER_CLR = "C0C8D8"   # light blue border
ACCENT_CLR = "2C6EAB"   # accent blue for answer column header
META_BG    = "F0F4FA"   # meta rows background

# ─── Helpers ────────────────────────────────────────────────────────────────────

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
    return {
        "select": "single_choice", "multiselect": "multi_choice",
        "yesno": "yes_no", "scale": "scale_1_5",
        "text": "text_short", "textarea": "text_long",
        "single_choice": "single_choice", "multi_choice": "multi_choice",
    }.get(t, t)


def _type_label(qtype: str) -> str:
    return {
        "single_choice": "Pilihan Tunggal",
        "multi_choice":  "Pilihan Berganda",
        "yes_no":        "Ya / Tidak",
        "scale_1_5":     "Skala 1-5",
        "text_short":    "Teks Singkat",
        "text_long":     "Teks Panjang",
        "number":        "Angka",
    }.get(_normalize_type(qtype), qtype)


def _full_options_text(q: dict, locale: str = "id") -> str:
    """Return full option labels for the 'Panduan Pengisian' column."""
    opts = q.get("options") or []
    qtype = _normalize_type(q.get("type", ""))
    if not opts:
        if qtype == "yes_no":
            return "Isi: Ya  —ATAU—  Tidak"
        if qtype == "scale_1_5":
            return "Isi angka: 1 (Sangat Rendah) / 2 (Rendah) / 3 (Cukup) / 4 (Tinggi) / 5 (Sangat Tinggi)"
        if qtype in ("text_short", "text_long"):
            return "Isi dengan teks bebas"
        if qtype == "number":
            return "Isi dengan angka"
        return ""

    # Build full label list
    lines = []
    for o in opts:
        label = _loc(o.get("label", {}), locale) or o.get("value", "")
        value = o.get("value", "")
        if label and label != value:
            lines.append(f"{value}  ({label})")
        else:
            lines.append(value)

    if _normalize_type(q.get("type", "")) == "multi_choice":
        return "Pilih beberapa, pisahkan dengan |  →  " + "  |  ".join(lines)
    return "  /  ".join(lines)


def _answer_to_display(q: dict, ans: dict | None, locale: str = "id") -> str:
    """Convert stored answer value → display string for Excel cell."""
    if not ans or ans.get("skipped"):
        return ""
    val = ans.get("value")
    if val is None or val == "":
        return ""
    qtype = _normalize_type(q.get("type", ""))
    opts = {o["value"]: o for o in (q.get("options") or [])}
    if qtype == "single_choice":
        return str(val)   # store VALUE for clean import/export round-trip
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


def _dropdown_formula(q: dict) -> str | None:
    """Return Excel dropdown formula string, or None if not applicable."""
    qtype = _normalize_type(q.get("type", ""))
    opts = q.get("options") or []

    if qtype == "yes_no":
        return '"Ya,Tidak"'
    if qtype == "scale_1_5":
        return '"1,2,3,4,5"'
    if qtype == "single_choice" and opts:
        # Use option VALUES (round-trip safe)
        values = [o["value"] for o in opts if o.get("value")]
        csv = ",".join(values)
        formula = f'"{csv}"'
        # Excel dropdown formula max 255 chars
        if len(formula) <= 255:
            return formula
        # Truncate gracefully
        truncated = ""
        for v in values:
            candidate = (truncated + "," + v) if truncated else v
            if len(f'"{candidate}"') > 253:
                break
            truncated = candidate
        return f'"{truncated}"' if truncated else None
    return None


# ─── Styling helpers ────────────────────────────────────────────────────────────

def _thin():
    s = Side(style="thin", color=BORDER_CLR)
    return Border(left=s, right=s, top=s, bottom=s)


def _bottom(color=BORDER_CLR, thick=False):
    s = Side(style="medium" if thick else "thin", color=color)
    return Border(bottom=s)


def _cell_style(ws, row, col, value,
                bg=None, fg=ROW_FG, bold=False, italic=False,
                size=9, wrap=True, halign="left", valign="top",
                border=None, name="Calibri"):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font = Font(name=name, size=size, bold=bold, italic=italic,
                     color=fg)
    if bg:
        cell.fill = PatternFill(start_color=bg, end_color=bg, fill_type="solid")
    cell.alignment = Alignment(horizontal=halign, vertical=valign,
                                wrap_text=wrap, indent=0)
    if border is not None:
        cell.border = border
    else:
        cell.border = _thin()
    return cell


# ─── Export ─────────────────────────────────────────────────────────────────────

# Column index constants
C_QID    = 1   # A – hidden
C_NO     = 2   # B
C_DOMAIN = 3   # C
C_Q      = 4   # D
C_TYPE   = 5   # E
C_GUIDE  = 6   # F  (Panduan Pengisian — full options)
C_ANS    = 7   # G  (Jawaban Anda — editable, dropdown)

COL_WIDTHS = [28, 5, 26, 52, 18, 56, 32]


def generate_answers_excel(session: dict, template: dict, answers_map: dict,
                            locale: str = "id") -> bytes:
    """Generate professional Excel assessment answer form."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Jawaban"

    # ── Title block ──────────────────────────────────────────────────────────
    tpl_name = _loc(template.get("name", {}), locale) or "Assessment"
    client   = session.get("client_name") or "—"
    project  = session.get("project_name") or "—"
    date_str = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%d %B %Y")

    # Row 1: Document title
    ws.merge_cells("A1:G1")
    title_cell = ws.cell(row=1, column=1, value=f"FORMULIR JAWABAN ASSESSMENT — {tpl_name.upper()}")
    title_cell.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color=HDR_BG, end_color=HDR_BG, fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 26

    # Row 2-4: Meta info
    meta = [
        ("Klien / Client:", client,  "Tanggal / Date:", date_str),
        ("Proyek / Project:", project, "Status:", (session.get("status") or "draft").upper()),
    ]
    for mi, (k1, v1, k2, v2) in enumerate(meta, 2):
        ws.merge_cells(f"A{mi}:B{mi}")
        ws.merge_cells(f"C{mi}:D{mi}")
        ws.merge_cells(f"E{mi}:F{mi}")
        ws.merge_cells(f"G{mi}:G{mi}")
        for col, val, is_key in [(1, k1, True), (3, v1, False), (5, k2, True), (7, v2, False)]:
            c = ws.cell(row=mi, column=col, value=val)
            c.font = Font(name="Calibri", size=9, bold=is_key, color=HDR_BG if is_key else ROW_FG)
            c.fill = PatternFill(start_color=META_BG, end_color=META_BG, fill_type="solid")
            c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[mi].height = 17

    # Row 5: spacer
    ws.row_dimensions[5].height = 6

    # ── Column header (row 6) ─────────────────────────────────────────────────
    HDR_ROW = 6
    hdr_labels = ["Question ID", "No.", "Domain / Seksi", "Pertanyaan",
                  "Tipe Jawaban", "Panduan Pengisian & Opsi Tersedia",
                  "Jawaban Anda  ✏"]
    hdr_fgs    = [HDR_FG] * 6 + ["FFFFFF"]
    hdr_bgs    = [HDR_BG] * 6 + [ACCENT_CLR]
    for ci, (lbl, fg, bg) in enumerate(zip(hdr_labels, hdr_fgs, hdr_bgs), 1):
        c = ws.cell(row=HDR_ROW, column=ci, value=lbl)
        c.font = Font(name="Calibri", size=9, bold=True, color=fg)
        c.fill = PatternFill(start_color=bg, end_color=bg, fill_type="solid")
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = _thin()
    ws.row_dimensions[HDR_ROW].height = 28

    # ── Data rows ────────────────────────────────────────────────────────────
    data_row = HDR_ROW + 1
    q_no = 0
    domains = _get_domains(template)
    dv_registry: dict[str, DataValidation] = {}  # cache DV by formula

    for dom in domains:
        dom_title = _loc(dom.get("title", {}), locale)
        questions = dom.get("questions") or []

        # Domain separator row
        ws.merge_cells(f"A{data_row}:G{data_row}")
        dc = ws.cell(row=data_row, column=1,
                     value=f"  {dom_title}")
        dc.font = Font(name="Calibri", size=9, bold=True, color=DOM_FG)
        dc.fill = PatternFill(start_color=DOM_BG, end_color=DOM_BG, fill_type="solid")
        dc.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        dc.border = Border(
            bottom=Side(style="medium", color="2C6EAB"),
            top=Side(style="thin", color=BORDER_CLR),
        )
        ws.row_dimensions[data_row].height = 18
        data_row += 1

        for q in questions:
            q_no += 1
            qid     = q.get("id", "")
            ans     = answers_map.get(qid)
            qtype   = q.get("type", "text_short")
            ans_str = _answer_to_display(q, ans, locale)
            is_prefilled = bool(ans_str)

            row_bg = ROW_A_BG if q_no % 2 != 0 else ROW_B_BG
            ans_bg = ANS_BG_PRE if is_prefilled else ANS_BG

            # Col A: question_id (hidden later)
            _cell_style(ws, data_row, C_QID, qid,
                        bg=row_bg, fg="BBBBBB", size=8, halign="left")

            # Col B: question number
            _cell_style(ws, data_row, C_NO, q_no,
                        bg=row_bg, fg=HINT_FG, bold=True, size=9, halign="center")

            # Col C: domain (just repeat for reference)
            _cell_style(ws, data_row, C_DOMAIN, dom_title,
                        bg=row_bg, fg=HINT_FG, size=8)

            # Col D: question text
            q_text = _get_q_text(q, locale) or "—"
            _cell_style(ws, data_row, C_Q, q_text,
                        bg=row_bg, fg=ROW_FG, size=9, bold=False)

            # Col E: type label
            _cell_style(ws, data_row, C_TYPE, _type_label(qtype),
                        bg=row_bg, fg=HINT_FG, size=8, halign="center")

            # Col F: full options / guide
            guide = _full_options_text(q, locale)
            _cell_style(ws, data_row, C_GUIDE, guide,
                        bg=row_bg, fg=HINT_FG, italic=True, size=8)

            # Col G: answer (editable, with dropdown)
            ans_cell = ws.cell(row=data_row, column=C_ANS, value=ans_str if ans_str else None)
            ans_cell.font = Font(name="Calibri", size=9, bold=bool(ans_str), color=ROW_FG)
            ans_cell.fill = PatternFill(start_color=ans_bg, end_color=ans_bg, fill_type="solid")
            ans_cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
            ans_cell.border = Border(
                left=Side(style="medium", color=ACCENT_CLR),
                right=Side(style="thin", color=BORDER_CLR),
                top=Side(style="thin", color=BORDER_CLR),
                bottom=Side(style="thin", color=BORDER_CLR),
            )

            # Dropdown validation
            formula = _dropdown_formula(q)
            if formula:
                if formula not in dv_registry:
                    dv = DataValidation(
                        type="list",
                        formula1=formula,
                        allow_blank=True,
                        showDropDown=False,
                        showErrorMessage=True,
                        errorTitle="Pilihan Tidak Valid",
                        error="Pilih salah satu dari daftar yang tersedia",
                    )
                    ws.add_data_validation(dv)
                    dv_registry[formula] = dv
                dv_registry[formula].add(ans_cell)

            # Row height
            lines = max(1, len(q_text) // 55 + 1)
            ws.row_dimensions[data_row].height = max(20, lines * 14)
            data_row += 1

    # ── Column widths & hide question_id ─────────────────────────────────────
    for ci, w in enumerate(COL_WIDTHS, 1):
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.column_dimensions["A"].hidden = True

    # ── Freeze panes ────────────────────────────────────────────────────────
    ws.freeze_panes = f"D{HDR_ROW + 1}"

    # ── Panduan sheet ──────────────────────────────────────────────────────
    ws2 = wb.create_sheet("Panduan")
    ws2.sheet_view.showGridLines = False

    # Title
    ws2.merge_cells("A1:C1")
    t = ws2.cell(row=1, column=1, value="PANDUAN PENGISIAN FORMULIR ASSESSMENT")
    t.font = Font(name="Calibri", size=12, bold=True, color=HDR_BG)
    t.fill = PatternFill(start_color="EBF0FA", end_color="EBF0FA", fill_type="solid")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[1].height = 24

    # Instructions table
    pan_rows = [
        ("Kolom", "Keterangan", ""),
        ("Question ID (A)",    "ID pertanyaan — JANGAN diubah. Digunakan sistem saat import.", ""),
        ("No. (B)",            "Nomor urut — hanya referensi, tidak diimport.", ""),
        ("Domain/Seksi (C)",   "Nama domain/seksi — hanya referensi, tidak diimport.", ""),
        ("Pertanyaan (D)",     "Teks pertanyaan — hanya referensi, tidak diimport.", ""),
        ("Tipe Jawaban (E)",   "Tipe input yang diharapkan (lihat panduan tipe di bawah).", ""),
        ("Panduan (F)",        "Opsi yang tersedia / format pengisian — hanya referensi.", ""),
        ("Jawaban Anda (G)",   "ISI KOLOM INI. Sel berwarna hijau = harus diisi.", "← EDIT SINI"),
        ("", "", ""),
        ("Panduan per Tipe", "Format Pengisian", "Catatan"),
        ("Pilihan Tunggal",    "Isi SATU nilai opsi dari kolom Panduan (huruf sesuai).", "Dropdown tersedia"),
        ("Pilihan Berganda",   "Isi beberapa nilai, pisahkan dengan |  contoh: val1|val2|val3", ""),
        ("Ya / Tidak",         "Isi: Ya  —ATAU—  Tidak  (sesuai huruf besar/kecil)", "Dropdown tersedia"),
        ("Skala 1-5",          "Isi angka 1 / 2 / 3 / 4 / 5", "Dropdown tersedia"),
        ("Teks Singkat",       "Tulis teks bebas (maksimal 1 baris).", ""),
        ("Teks Panjang",       "Tulis penjelasan panjang, enter diperbolehkan.", ""),
        ("Angka",              "Isi dengan angka (desimal gunakan titik: 3.5)", ""),
        ("", "", ""),
        ("Catatan Penting", "", ""),
        ("Baris kosong di kolom G = pertanyaan tidak dijawab (diabaikan saat import).", "", ""),
        ("Jangan menambah/menghapus baris atau mengubah kolom Question ID (A).", "", ""),
        ("Jangan mengubah nama sheet 'Jawaban'.", "", ""),
    ]

    for ri, row_data in enumerate(pan_rows, 2):
        is_section = ri in (2, 10, 19)
        is_hdr = ri == 2
        bg = HDR_BG if is_hdr else ("DEE8F5" if is_section else "FFFFFF")
        fg_color = "FFFFFF" if is_hdr else (HDR_BG if is_section else ROW_FG)
        for ci, val in enumerate(row_data, 1):
            c = ws2.cell(row=ri, column=ci, value=val)
            c.font = Font(name="Calibri", size=9, bold=is_hdr or is_section, color=fg_color)
            c.fill = PatternFill(start_color=bg, end_color=bg, fill_type="solid")
            c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
            c.border = Border(bottom=Side(style="thin", color=BORDER_CLR))
        # Highlight "Jawaban Anda" row
        if row_data[0] == "Jawaban Anda (G)":
            for ci in range(1, 4):
                c = ws2.cell(row=ri, column=ci)
                c.fill = PatternFill(start_color=ANS_BG, end_color=ANS_BG, fill_type="solid")
                c.font = Font(name="Calibri", size=9, bold=True, color=HDR_BG)
        ws2.row_dimensions[ri].height = 17

    ws2.column_dimensions["A"].width = 24
    ws2.column_dimensions["B"].width = 60
    ws2.column_dimensions["C"].width = 18

    # ── Meta sheet ────────────────────────────────────────────────────────────
    ws3 = wb.create_sheet("Meta")
    from datetime import datetime, timezone
    ws3["A1"], ws3["B1"] = "session_id",    session.get("id", "")
    ws3["A2"], ws3["B2"] = "template_id",   template.get("id", "")
    ws3["A3"], ws3["B3"] = "generated_at",  datetime.now(timezone.utc).isoformat()
    ws3["A4"], ws3["B4"] = "client_name",   client
    ws3["A5"], ws3["B5"] = "project_name",  project

    # ── Final output ──────────────────────────────────────────────────────────
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


# ─── Import ─────────────────────────────────────────────────────────────────────

def _parse_answer(q: dict, raw_val: Any) -> dict | None:
    if raw_val is None or str(raw_val).strip() == "":
        return None
    raw = str(raw_val).strip()
    qtype = _normalize_type(q.get("type", "text_short"))
    opts = {o["value"]: o for o in (q.get("options") or [])}
    opts_by_label_id = {_loc(o.get("label", {}), "id").lower(): o["value"]
                        for o in (q.get("options") or [])}
    opts_by_label_en = {_loc(o.get("label", {}), "en").lower(): o["value"]
                        for o in (q.get("options") or [])}

    if qtype == "single_choice":
        if raw in opts:
            return {"value": raw, "skipped": False}
        lower = raw.lower()
        if lower in opts_by_label_id:
            return {"value": opts_by_label_id[lower], "skipped": False}
        if lower in opts_by_label_en:
            return {"value": opts_by_label_en[lower], "skipped": False}
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

    return {"value": raw, "skipped": False}


def parse_answers_excel(file_bytes: bytes, template: dict) -> list[dict]:
    """Parse uploaded Excel → list of {question_id, value, skipped}."""
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)

    # Find Jawaban sheet
    ws = None
    for name in wb.sheetnames:
        if name.lower() in ("jawaban", "answers"):
            ws = wb[name]
            break
    if ws is None:
        ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return []

    # Build question index
    q_index: dict[str, dict] = {}
    for dom in _get_domains(template):
        for q in dom.get("questions") or []:
            if q.get("id"):
                q_index[q["id"]] = q

    # Auto-detect header row and columns
    qid_col = ans_col = None
    hdr_row_idx = 0
    for ri, row in enumerate(rows):
        cells = [str(c).strip().lower() if c else "" for c in row]
        if any("question_id" in c or c == "id" for c in cells):
            hdr_row_idx = ri
            for ci, h in enumerate(cells):
                if "question_id" in h or h == "id":
                    qid_col = ci
                if "jawaban" in h or "answer" in h:
                    ans_col = ci
            break

    if qid_col is None:
        qid_col = 0   # fallback: col A
    if ans_col is None:
        ans_col = C_ANS - 1  # fallback: col G (0-indexed = 6)

    results: list[dict] = []
    for row in rows[hdr_row_idx + 1:]:
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
            continue
        results.append({
            "question_id": qid,
            "value": parsed["value"],
            "skipped": parsed.get("skipped", False),
            "other_text": None,
            "note": None,
        })

    return results
