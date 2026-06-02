# ENTITY REGISTRY — Kubus Teknologi Indonesia (SSOT)

> **Daftar otoritatif SEMUA MongoDB collection.** Sebelum membuat collection baru, cek di sini. Setiap collection baru WAJIB didaftarkan. Satu entity = satu collection (KTI_04).

**Konvensi:** `{domain}_{entity}` · `id` = UUID v4 · timestamp UTC ISO-8601 · soft delete (`voided`). Field konten user-facing = objek bilingual `{id, en}`.

---

## SYSTEM
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `system_users` | Akun admin/staff/client (dibuat admin/staff) | id, email(unique), password_hash, role, name, company?, phone?, locale, active |
| `system_settings` | Konfigurasi situs global (kontak, sosial, SEO, hero copy) | id, key(unique), value (bilingual bila perlu) |
| `audit_logs` | Jejak aksi sensitif | id, actor_id, action, entity, entity_id, meta, created_at |

## MEDIA (Media Library — Fase 3B, storage LOCAL via abstraksi TD-008)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `media_folders` | Folder/kategori media | id, name, parent_id?, order, created_at |
| `media_assets` | Aset (image/video/document) | id, original_name, filename, mime_type, kind(image\|video\|document), size_bytes, width?, height?, storage_backend, storage_key, url, folder_id?, alt{}, title{}, tags[], created_by, voided |
| `media_usage` | Jejak pemakaian aset di CMS | id, asset_id, entity_type, entity_id, field, created_at |

## CMS (konten publik, bilingual)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `cms_services` | Layanan (Constellations) | id, slug(unique), title{}, summary{}, body{}, icon, category, order, featured, status |
| `cms_home_blocks` | Section interaktif home (process/tiers/gauges/secure) | id, key(unique), kind, title{}, subtitle{}, items[], order, status |
| `cms_cases` | Studi kasus (Explored Worlds) | id, slug(unique), title{}, client_name, industry, summary{}, body{}, cover, gallery[], results[], tech[], project_id?, status, **demo_enabled**, **demo_slug**, **demo_label_id**, **demo_timeout_minutes** |
| `cms_team` | Anggota tim (The Crew) | id, name, role{}, bio{}, photo, socials, order, status |
| `cms_clients` | Klien (Star Map) | id, name, logo, url, order, status |
| `cms_tech` | Tech stack (The Engine) | id, name, category, logo, order |
| `cms_blog` | Artikel | id, slug(unique), title{}, excerpt{}, body{}, cover, tags[], author_id, published_at, status |
| `cms_careers` | Lowongan | id, slug(unique), title{}, location, type, level, description{}, requirements{}, status |
| `cms_pages` | Section editable (hero, about, dll) | id, key(unique), blocks[] (bilingual) |

## CRM
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `crm_leads` | Kontak form + lead dari assessment + lead dari demo gate form | id, source(contact_form\|assessment\|demo_gate), name, email, company?, message, assessment_session_id?, demo_app?, status, created_at |

## ASSESSMENT (Discovery)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `assessment_templates` | Template (domain+pertanyaan), bilingual | id, name{}, description{}, domains[], status |
| `assessment_sessions` | Instance terkirim ke klien | id, template_id, client_name, project_name, contact, token(uuid,unique), status, acknowledged_at, submitted_at |
| `assessment_answers` | Jawaban | id, session_id, question_id, value, other_text?, note?, (unique: session_id+question_id) |
| `assessment_attachments` | Lampiran | id, session_id, question_id, filename, size, path, content_type |

## PROJECT MANAGEMENT (portal)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `pm_projects` | Project klien | id, code, name, client_id, staff_ids[], status, progress, start_date, due_date, summary |
| `pm_milestones` | Milestone/timeline | id, project_id, title, description, status(todo/in_progress/done), order, due_date, completed_at |
| `pm_documents` | Deliverable/dokumen | id, project_id, name, path, content_type, size, uploaded_by, created_at |
| `pm_approvals` | Approval/feedback milestone — termasuk e-sign | id, project_id, milestone_id, status(pending/approved/changes_requested), feedback, decided_by, decided_at |

## BILLING
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `billing_invoices` | Invoice | id, number(unique), project_id, client_id, items[], amount, currency, status(unpaid/paid/overdue), issued_at, due_at, paid_at |

## COMMUNICATION / AI
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `chat_threads` | Thread klien<->staff | id, project_id?, client_id, staff_ids[], last_message_at |
| `chat_messages` | Pesan | id, thread_id, sender_id, body, attachments[], created_at |
| `ai_conversations` | Riwayat AI (advisor publik + portal) | id, surface(public/portal), user_id?, visitor_id?, messages[], created_at, updated_at |

## E-SIGN & AUDIT (Fase 9)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `approval_signatures` | Tanda tangan digital (e-sign) pada approval | id, approval_id, project_id, signer_id, signer_name, signer_role, signature_data(base64), ip_address, signed_at, certificate_url |
| `approval_audit_logs` | Log jejak approval + e-sign immutable | id, approval_id, actor_id, actor_name, action, meta, timestamp |

## NOTIFICATIONS (Fase 15)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `notifications` | Notifikasi in-app per user | id, user_id, kind, title, body, action_url?, read, created_at |
| `notification_preferences` | Preferensi notif per user | id, user_id, email_enabled, inapp_enabled, topics[] |

## EMAIL (Fase 12)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `email_templates` | Template email (HTML + plain text) | id, slug(unique), subject, html_body, text_body, variables[], created_at |
| `email_outbox` | Antrian email terkirim | id, template_slug, to, cc?, subject, vars, status(queued/sent/failed), sent_at |
| `email_events` | Webhook events dari email provider | id, outbox_id?, event_type, provider_data, received_at |

## INTEGRATION SETTINGS (Fase 12)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `integration_settings` | Konfigurasi integrasi eksternal (SMTP, storage, dll) | id, service, config(encrypted), enabled, updated_at |

## DEMO SANDBOX (Fase 16)
| Collection | Deskripsi | Field kunci |
|------------|-----------|-------------|
| `demo_sessions` | Sesi demo sandbox per user (TTL 90 menit) | id, short_id, lead_id, name, email, company?, app_slug, db_name, expires_at, created_at, seeded, seed_summary |

> **Demo databases**: Setiap sesi demo mendapat isolated MongoDB database `demo_kn3_{short_id}`. Database di-drop otomatis saat sesi expired. BUKAN collection di `test_database`.

---

## FORBIDDEN / RESERVED (jangan dipakai — melanggar SSOT)
`users`, `services`, `cases`, `projects`, `invoices`, `messages`, `leads`, `team`, `clients`, `blog`, `posts`, `sessions`, `templates`, `documents`, `files`, `content` (tanpa prefix domain). Gunakan versi ber-prefix di atas.

---

_Status terakhir diupdate: Phase 16 SELESAI (2026-05-31)._
_Collections aktif: system_users, media_assets, media_usage, cms_*, crm_leads, assessment_*, pm_*, billing_invoices, chat_*, ai_conversations, approval_signatures, approval_audit_logs, notifications, notification_preferences, email_templates, email_outbox, email_events, integration_settings, demo_sessions._
