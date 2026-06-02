"""Seed default email templates (Phase 12, bilingual ID/EN).

Idempotent: only inserts a template if it doesn't already exist for the (template_id, locale)
pair so that admins can safely edit templates without seeds overwriting their changes.
"""
from __future__ import annotations

from datetime import datetime, timezone

import uuid

_DEFAULT_TEMPLATES = [
    # ---------- LEAD CREATED ----------
    {
        "template_id": "lead_created",
        "locale": "id",
        "subject": "[KTI] Lead baru: $name dari $company",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Lead Baru Diterima</h2>"
            "<p>Anda menerima lead baru dari halaman kontak Kubus Teknologi:</p>"
            "<table cellpadding='6' style='border-collapse:collapse;border:1px solid #eee'>"
            "<tr><td><b>Nama</b></td><td>$name</td></tr>"
            "<tr><td><b>Email</b></td><td>$email</td></tr>"
            "<tr><td><b>Perusahaan</b></td><td>$company</td></tr>"
            "<tr><td><b>Telepon</b></td><td>$phone</td></tr>"
            "<tr><td><b>Pesan</b></td><td>$message</td></tr>"
            "</table>"
            "<p style='margin-top:16px'>Buka <a href='/portal/admin/leads'>dashboard leads</a> untuk menindaklanjuti.</p>"
            "</div>"
        ),
        "text_body": "Lead baru: $name ($email) dari $company. Pesan: $message",
        "variables": ["name", "email", "company", "phone", "message"],
    },
    {
        "template_id": "lead_created",
        "locale": "en",
        "subject": "[KTI] New lead: $name from $company",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>New Lead Received</h2>"
            "<p>A new lead arrived via the Kubus Teknologi contact form:</p>"
            "<table cellpadding='6' style='border-collapse:collapse;border:1px solid #eee'>"
            "<tr><td><b>Name</b></td><td>$name</td></tr>"
            "<tr><td><b>Email</b></td><td>$email</td></tr>"
            "<tr><td><b>Company</b></td><td>$company</td></tr>"
            "<tr><td><b>Phone</b></td><td>$phone</td></tr>"
            "<tr><td><b>Message</b></td><td>$message</td></tr>"
            "</table>"
            "<p style='margin-top:16px'>Open the <a href='/portal/admin/leads'>leads dashboard</a> to follow up.</p>"
            "</div>"
        ),
        "text_body": "New lead: $name ($email) from $company. Message: $message",
        "variables": ["name", "email", "company", "phone", "message"],
    },
    # ---------- PROJECT CREATED ----------
    {
        "template_id": "project_created",
        "locale": "id",
        "subject": "[KTI] Proyek baru dibuat: $project_name",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Proyek Baru</h2>"
            "<p>Halo $recipient_name,</p>"
            "<p>Proyek <b>$project_name</b> ($project_code) telah dibuat dan ditugaskan ke Anda.</p>"
            "<p>Status awal: <b>$status</b></p>"
            "<p>Buka <a href='/portal/projects/$project_id'>detail proyek</a> untuk melihat milestone dan dokumen.</p>"
            "</div>"
        ),
        "text_body": "Proyek baru: $project_name ($project_code). Status: $status.",
        "variables": ["recipient_name", "project_name", "project_code", "status", "project_id"],
    },
    {
        "template_id": "project_created",
        "locale": "en",
        "subject": "[KTI] New project created: $project_name",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>New Project</h2>"
            "<p>Hello $recipient_name,</p>"
            "<p>Project <b>$project_name</b> ($project_code) has been created and assigned to you.</p>"
            "<p>Initial status: <b>$status</b></p>"
            "<p>Open <a href='/portal/projects/$project_id'>project detail</a> to view milestones and documents.</p>"
            "</div>"
        ),
        "text_body": "New project: $project_name ($project_code). Status: $status.",
        "variables": ["recipient_name", "project_name", "project_code", "status", "project_id"],
    },
    # ---------- APPROVAL REQUESTED ----------
    {
        "template_id": "approval_requested",
        "locale": "id",
        "subject": "[KTI] Persetujuan diminta: $approval_title",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Permintaan Persetujuan</h2>"
            "<p>Permintaan persetujuan baru pada proyek <b>$project_name</b>:</p>"
            "<blockquote style='border-left:3px solid #7C68E1;padding-left:12px;color:#444'>$approval_title</blockquote>"
            "<p>Diajukan oleh: <b>$requested_by</b></p>"
            "<p>Buka <a href='/portal/admin/projects'>panel proyek</a> untuk menindaklanjuti.</p>"
            "</div>"
        ),
        "text_body": "Permintaan persetujuan baru: $approval_title (Proyek: $project_name)",
        "variables": ["approval_title", "project_name", "requested_by"],
    },
    {
        "template_id": "approval_requested",
        "locale": "en",
        "subject": "[KTI] Approval requested: $approval_title",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Approval Request</h2>"
            "<p>New approval request on project <b>$project_name</b>:</p>"
            "<blockquote style='border-left:3px solid #7C68E1;padding-left:12px;color:#444'>$approval_title</blockquote>"
            "<p>Requested by: <b>$requested_by</b></p>"
            "<p>Open the <a href='/portal/admin/projects'>projects panel</a> to follow up.</p>"
            "</div>"
        ),
        "text_body": "New approval request: $approval_title (Project: $project_name)",
        "variables": ["approval_title", "project_name", "requested_by"],
    },
    # ---------- APPROVAL SIGNED ----------
    {
        "template_id": "approval_signed",
        "locale": "id",
        "subject": "[KTI] Persetujuan ditandatangani: $approval_title",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Persetujuan Ditandatangani</h2>"
            "<p>Halo $recipient_name,</p>"
            "<p><b>$signer_name</b> telah menandatangani persetujuan <b>$approval_title</b> pada proyek $project_name.</p>"
            "<p>Nomor sertifikat: <code>$certificate_no</code></p>"
            "<p>Unduh sertifikat PDF dari portal proyek.</p>"
            "</div>"
        ),
        "text_body": "$signer_name menandatangani $approval_title. Sertifikat: $certificate_no",
        "variables": ["recipient_name", "signer_name", "approval_title", "project_name", "certificate_no"],
    },
    {
        "template_id": "approval_signed",
        "locale": "en",
        "subject": "[KTI] Approval signed: $approval_title",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Approval Signed</h2>"
            "<p>Hello $recipient_name,</p>"
            "<p><b>$signer_name</b> just signed the approval <b>$approval_title</b> on project $project_name.</p>"
            "<p>Certificate no: <code>$certificate_no</code></p>"
            "<p>Download the certificate PDF from the project portal.</p>"
            "</div>"
        ),
        "text_body": "$signer_name signed $approval_title. Certificate: $certificate_no",
        "variables": ["recipient_name", "signer_name", "approval_title", "project_name", "certificate_no"],
    },
    # ---------- INVOICE CREATED ----------
    {
        "template_id": "invoice_created",
        "locale": "id",
        "subject": "[KTI] Invoice baru: $invoice_number",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>Invoice Baru</h2>"
            "<p>Halo $recipient_name,</p>"
            "<p>Invoice baru telah diterbitkan untuk Anda:</p>"
            "<ul>"
            "<li><b>Nomor:</b> $invoice_number</li>"
            "<li><b>Jumlah:</b> $currency $amount</li>"
            "<li><b>Jatuh tempo:</b> $due_at</li>"
            "</ul>"
            "<p>Buka <a href='/portal/invoices'>halaman invoice</a> untuk detail dan pembayaran.</p>"
            "</div>"
        ),
        "text_body": "Invoice $invoice_number sebesar $currency $amount jatuh tempo $due_at",
        "variables": ["recipient_name", "invoice_number", "currency", "amount", "due_at"],
    },
    {
        "template_id": "invoice_created",
        "locale": "en",
        "subject": "[KTI] New invoice: $invoice_number",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#7C68E1'>New Invoice</h2>"
            "<p>Hello $recipient_name,</p>"
            "<p>A new invoice has been issued for you:</p>"
            "<ul>"
            "<li><b>Number:</b> $invoice_number</li>"
            "<li><b>Amount:</b> $currency $amount</li>"
            "<li><b>Due:</b> $due_at</li>"
            "</ul>"
            "<p>Open the <a href='/portal/invoices'>invoices page</a> for details and payment.</p>"
            "</div>"
        ),
        "text_body": "Invoice $invoice_number of $currency $amount due $due_at",
        "variables": ["recipient_name", "invoice_number", "currency", "amount", "due_at"],
    },
    # ---------- INVOICE OVERDUE ----------
    {
        "template_id": "invoice_overdue",
        "locale": "id",
        "subject": "[KTI] Pengingat: Invoice $invoice_number terlambat",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#E25C5C'>Pengingat Pembayaran</h2>"
            "<p>Halo $recipient_name,</p>"
            "<p>Invoice <b>$invoice_number</b> sebesar <b>$currency $amount</b> telah melewati jatuh tempo ($due_at).</p>"
            "<p>Mohon segera lakukan pembayaran. Buka <a href='/portal/invoices'>halaman invoice</a> untuk detail.</p>"
            "</div>"
        ),
        "text_body": "Invoice $invoice_number terlambat. Jumlah: $currency $amount",
        "variables": ["recipient_name", "invoice_number", "currency", "amount", "due_at"],
    },
    {
        "template_id": "invoice_overdue",
        "locale": "en",
        "subject": "[KTI] Reminder: Invoice $invoice_number overdue",
        "html_body": (
            "<div style='font-family:Inter,system-ui,sans-serif'>"
            "<h2 style='color:#E25C5C'>Payment Reminder</h2>"
            "<p>Hello $recipient_name,</p>"
            "<p>Invoice <b>$invoice_number</b> for <b>$currency $amount</b> is past due ($due_at).</p>"
            "<p>Please settle the payment soon. Open the <a href='/portal/invoices'>invoices page</a> for details.</p>"
            "</div>"
        ),
        "text_body": "Invoice $invoice_number overdue. Amount: $currency $amount",
        "variables": ["recipient_name", "invoice_number", "currency", "amount", "due_at"],
    },
]


async def seed_email_templates(db) -> int:
    """Insert default templates if not already present. Returns number created."""
    created = 0
    now = datetime.now(timezone.utc).isoformat()
    for tpl in _DEFAULT_TEMPLATES:
        existing = await db.email_templates.find_one(
            {"template_id": tpl["template_id"], "locale": tpl["locale"]}, {"_id": 0, "id": 1}
        )
        if existing:
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            **tpl,
        }
        await db.email_templates.insert_one(doc)
        created += 1
    return created
