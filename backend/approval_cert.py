"""Approval Certificate PDF generator (Phase 9)."""
import hashlib
import io
from datetime import datetime


def _format_ts(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%d %B %Y, %H:%M UTC")
    except Exception:
        return iso_str or "—"


def generate_certificate_pdf(
    cert_no: str,
    project_name: str,
    approval_title: str,
    approval_status: str,
    decided_by_name: str,
    decided_by_role: str,
    signer_name: str,
    signer_email: str,
    signer_role: str,
    signed_at: str,
    signature_type: str,
    signature_data: str,
    cert_hash: str,
    notes: str = "",
) -> bytes:
    """Generate a PDF certificate for an approval signature."""
    try:
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        import base64
    except ImportError:
        raise RuntimeError("reportlab not installed")

    buf = io.BytesIO()
    page_w, page_h = A4
    c = rl_canvas.Canvas(buf, pagesize=A4)

    # ---- Background ----
    c.setFillColorRGB(0.02, 0.03, 0.07)  # #050814
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # ---- Header bar ----
    c.setFillColorRGB(0.11, 0.13, 0.22)
    c.rect(0, page_h - 80, page_w, 80, fill=1, stroke=0)

    # Accent line
    c.setStrokeColorRGB(0.48, 0.79, 0.68)  # teal
    c.setLineWidth(3)
    c.line(0, page_h - 80, page_w, page_h - 80)

    # Company name
    c.setFont("Helvetica-Bold", 14)
    c.setFillColorRGB(0.91, 0.92, 0.95)
    c.drawString(2 * cm, page_h - 35, "PT KUBUS TEKNOLOGI INDONESIA")
    c.setFont("Helvetica", 9)
    c.setFillColorRGB(0.58, 0.61, 0.72)
    c.drawString(2 * cm, page_h - 52, "Digital Approval Certificate")

    # Cert no (top right)
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.48, 0.79, 0.68)
    c.drawRightString(page_w - 2 * cm, page_h - 40, f"Cert: {cert_no}")

    y = page_h - 110

    def section_title(txt, y_pos):
        c.setFont("Helvetica-Bold", 9)
        c.setFillColorRGB(0.48, 0.79, 0.68)
        c.drawString(2 * cm, y_pos, txt.upper())
        c.setStrokeColorRGB(0.48, 0.79, 0.68)
        c.setLineWidth(0.5)
        c.line(2 * cm, y_pos - 4, page_w - 2 * cm, y_pos - 4)
        return y_pos - 22

    def field(label, value, y_pos):
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.55, 0.58, 0.72)
        c.drawString(2 * cm, y_pos, label + ":")
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.91, 0.92, 0.95)
        c.drawString(6 * cm, y_pos, str(value)[:90])
        return y_pos - 18

    # ---- Approval info ----
    y = section_title("Informasi Persetujuan", y)
    y = field("Proyek", project_name, y)
    y = field("Judul", approval_title, y)
    status_label = {"approved": "DISETUJUI", "changes_requested": "PERLU REVISI"}.get(approval_status, approval_status)
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.55, 0.58, 0.72)
    c.drawString(2 * cm, y, "Status:")
    sc = colors.HexColor("#4ECBAF") if approval_status == "approved" else colors.HexColor("#E05555")
    c.setFillColor(sc)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(6 * cm, y, status_label)
    y -= 18
    if notes:
        y = field("Catatan", notes[:80], y)
    y -= 10

    # ---- Decision info ----
    y = section_title("Diputuskan Oleh", y)
    y = field("Nama", decided_by_name, y)
    y = field("Role", decided_by_role.title(), y)
    y -= 10

    # ---- Signer info ----
    y = section_title("Ditandatangani Oleh", y)
    y = field("Nama", signer_name, y)
    y = field("Email", signer_email, y)
    y = field("Role", signer_role.title(), y)
    y = field("Waktu", _format_ts(signed_at), y)
    y = field("Metode Tanda Tangan", "Tanda Tangan Digital" if signature_type == "drawn" else "Nama Diketik", y)
    y -= 14

    # ---- Signature box ----
    y = section_title("Tanda Tangan Digital", y)
    box_h = 90
    c.setFillColorRGB(0.07, 0.08, 0.15)
    c.setStrokeColorRGB(0.2, 0.22, 0.38)
    c.setLineWidth(1)
    c.roundRect(2 * cm, y - box_h, page_w - 4 * cm, box_h, 6, fill=1, stroke=1)

    if signature_type == "drawn" and signature_data.startswith("data:image"):
        try:
            img_data = signature_data.split(",", 1)[1]
            img_bytes = base64.b64decode(img_data)
            img_buf = io.BytesIO(img_bytes)
            from reportlab.lib.utils import ImageReader
            img_reader = ImageReader(img_buf)
            c.drawImage(img_reader, 2 * cm + 10, y - box_h + 10, width=page_w - 4 * cm - 20, height=box_h - 20, preserveAspectRatio=True, mask="auto")
        except Exception:
            c.setFont("Helvetica", 10)
            c.setFillColorRGB(0.91, 0.92, 0.95)
            c.drawCentredString(page_w / 2, y - box_h / 2, signer_name)
    else:
        c.setFont("Helvetica-BoldOblique", 16)
        c.setFillColorRGB(0.91, 0.92, 0.95)
        c.drawCentredString(page_w / 2, y - box_h / 2 + 6, signer_name)
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.48, 0.79, 0.68)
        c.drawCentredString(page_w / 2, y - box_h / 2 - 14, "Tanda Tangan Terketik")

    y -= box_h + 20

    # ---- Certificate Hash ----
    c.setStrokeColorRGB(0.2, 0.22, 0.38)
    c.setLineWidth(0.5)
    c.line(2 * cm, y, page_w - 2 * cm, y)
    y -= 18
    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.4, 0.42, 0.55)
    c.drawString(2 * cm, y, f"Certificate Hash (SHA-256): {cert_hash}")
    y -= 14
    c.drawString(2 * cm, y, "Dokumen ini merupakan catatan digital sah atas persetujuan proyek KTI. Verifikasi hash untuk keaslian.")

    # ---- Footer ----
    c.setFillColorRGB(0.07, 0.08, 0.15)
    c.rect(0, 0, page_w, 40, fill=1, stroke=0)
    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.38, 0.40, 0.55)
    c.drawCentredString(page_w / 2, 25, "PT Kubus Teknologi Indonesia · kubus.id · Dokumen ini dibuat secara otomatis")

    c.save()
    return buf.getvalue()
