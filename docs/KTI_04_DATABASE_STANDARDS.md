# KTI_04 — DATABASE STANDARDS (MongoDB)

---

## SSOT Principle
```
Setiap business entity = TEPAT SATU collection authoritative.
Sebelum buat collection baru WAJIB:
  1. Cek /app/ENTITY_REGISTRY.md
  2. Bisakah pakai field `type`/`category` di collection yang ada?
  3. Buat baru HANYA jika domain lifecycle benar-benar berbeda.
Setiap collection baru -> WAJIB daftarkan di ENTITY_REGISTRY.md.
```

---

## Naming Convention
```
Format: {domain}_{entity_plural}
Prefix domain: system_ cms_ crm_ assessment_ pm_ billing_ chat_ ai_ audit_
Contoh: system_users, cms_services, cms_cases, pm_projects, pm_milestones,
        assessment_templates, assessment_sessions, billing_invoices
```

---

## Base Schema (semua document)
```python
BASE = {
  "id": str(uuid4()),                              # UUID v4 (BUKAN ObjectId)
  "created_at": now_iso(),                          # UTC ISO-8601 string
  "updated_at": now_iso(),
  "created_by": user_id_or_None,
  "voided": False, "voided_at": None,               # soft delete
}
```
- SELALU UUID v4 untuk `id`. SELALU `datetime.now(timezone.utc).isoformat()`.
- List endpoint WAJIB exclude voided: `filter["voided"] = {"$ne": True}`.

---

## Bilingual Storage (WAJIB untuk konten)
Field yang ditampilkan ke user dalam 2 bahasa disimpan sebagai objek lokal:
```json
{
  "title":   { "id": "Solusi Perangkat Lunak", "en": "Software Solutions" },
  "summary": { "id": "...", "en": "..." },
  "body":    { "id": "...", "en": "..." },
  "slug":    "software-solutions"
}
```
Aturan:
- `slug`, kode, angka, tanggal = single value (tidak diterjemahkan).
- Field teks tampil ke user = objek `{id, en}`.
- Frontend memilih `field[locale]` dengan fallback ke `field.id`.
- Helper backend `localized(value, locale)` boleh dipakai untuk list ringkas.

---

## Index Strategy (minimum)
```python
await db.col.create_index([("created_at", -1)])
await db.col.create_index([("voided", 1)])
# unique
await db.system_users.create_index([("email", 1)], unique=True)
await db.cms_services.create_index([("slug", 1)], unique=True)
# scope
await db.pm_milestones.create_index([("project_id", 1)])
await db.assessment_answers.create_index([("session_id", 1), ("question_id", 1)], unique=True)
```

---

## Anti-Patterns (DILARANG)
```
- Unbounded array dalam 1 document (pakai collection terpisah + foreign key)
- find({}).to_list(None) tanpa limit (WAJIB pagination)
- N+1 query (pakai $lookup / batch fetch)
- Return MongoDB result tanpa serialize_doc()
- ObjectId sebagai business id
- Konten user-facing single-language (WAJIB {id, en})
```
