# KTI_13 — ASSESSMENT (DISCOVERY) MODULE SPEC

> Diadaptasi dari modul Discovery (referensi KN3). Untuk Kubus: alat **client intake** — saat ada prospek butuh solusi IT, Kubus kirim questionnaire untuk menggali kebutuhan. **Template-driven & dikelola di Advanced CMS.**

---

## Konsep
- Admin/staff membuat **template** assessment (kumpulan domain + pertanyaan).
- Untuk tiap prospek/klien, dibuat **session** dari sebuah template -> menghasilkan **UUID token**.
- Klien mengisi via link `/assessment/{token}` **tanpa login**, boleh skip, **auto-save**, bisa upload file.
- Setelah submit, session terkunci; staff/admin lihat hasil + **export PDF**.
- Seed 1 template contoh: **"IT Solution Discovery"** (boleh adopsi pertanyaan gaya KN3, generalisasi ke konteks IT solution).

---

## Data Model (SSOT)
```
assessment_templates   : id, name{id,en}, description{id,en}, domains[], status, created_by, ...
  domain               : id, number, code, title{id,en}, icon, color, description{id,en}, questions[]
  question             : id, prompt{id,en}, type, options[{value,label{id,en}}], help{id,en},
                         max_select?, show_if?(branching rule), required(bool)
assessment_sessions    : id, template_id, client_name, project_name, contact, status(draft|submitted),
                         token(uuid), acknowledged_at, created_by, created_at, submitted_at
assessment_answers     : id, session_id, question_id, value, other_text?, note?, updated_at
assessment_attachments : id, session_id, question_id, filename, size, path, content_type, created_at
```

## Answer Types
`single_choice` · `multi_choice` · `text_short` · `text_long` · `number` · `scale_1_5` · `yes_no`
+ opsi "Lainnya" (`other_text`, sentinel `__other__`) + kolom `note` per pertanyaan.

## Fitur
```
- Dashboard domain dengan progress ring per domain (value-aware: skip & note-only tidak dihitung).
- Branching logic (show_if): operator equals/not_equals/in/includes/is_truthy/...; default-show.
- Auto-save debounce ~700ms + indikator real-time.
- File upload per pertanyaan (PDF/PNG/JPG/XLSX/DOCX, max 10MB, max 5/pertanyaan).
- Help tooltip non-teknis per pertanyaan.
- Submit final mengunci (PATCH setelah submit -> 403 / ASSESSMENT_SESSION_LOCKED).
- Export PDF (reportlab) profesional.
- Admin: list session, badge "Baru!", acknowledge, stats.
- Bilingual: prompt/help/options tersimpan {id, en}; klien isi sesuai locale.
```

## Endpoints (rencana)
```
GET    /api/assessment/templates                 (admin/staff)
POST   /api/assessment/templates                 (admin)
GET    /api/assessment/templates/{id}
POST   /api/assessment/sessions                  (admin/staff -> token)
GET    /api/assessment/sessions                  (admin/staff list)
GET    /api/assessment/sessions/{token}          (publik via token)
PATCH  /api/assessment/sessions/{token}/answers  (batch upsert; 403 jika locked)
POST   /api/assessment/sessions/{token}/submit
POST   /api/assessment/sessions/{token}/attachments
GET    /api/assessment/sessions/{token}/export.pdf
POST   /api/assessment/sessions/{id}/acknowledge (admin/staff)
```

Dikerjakan pada **Fase 3** (setelah CMS & auth siap).
