# KTI_12 — AI INTEGRATION (Claude via Emergent LLM)

---

## Provider
- **Claude** (Anthropic) melalui **emergentintegrations** + `EMERGENT_LLM_KEY` (env).
- Ambil playbook resmi via integration agent sebelum implementasi. JANGAN install SDK Anthropic langsung.

## Dua Permukaan AI
```
1. Public "Solution Advisor" (visitor)
   - Floating chat di website publik.
   - GROUNDED ke konten Kubus: services, cases, tech stack (dari CMS).
   - Tujuan: jawab pertanyaan tentang Kubus + rekomendasi solusi + arahkan ke assessment/contact.
   - Tidak mengarang layanan yang tidak ada. Jika di luar scope -> arahkan ke kontak.

2. Client Portal Assistant (client login)
   - Grounded ke konteks project klien (status, milestone, dokumen) + konten Kubus.
   - Jawab status project, jelaskan dokumen, bantu navigasi portal.
   - HANYA akses data milik klien tsb (RBAC).
```

## Grounding Strategy
- Bangun system prompt dari ringkasan konten (services/cases/tech) yang diambil dari DB saat runtime (context injection). Mulai sederhana (inject ringkasan), bisa ditingkatkan ke retrieval bila perlu.
- Simpan percakapan di `ai_conversations` (id, user/visitor ref, surface, messages[], created_at).
- Sertakan disclaimer & batas: tidak memberi komitmen harga final tanpa assessment.

## Standar Teknis
- Service `backend/services/ai_service.py` membungkus pemanggilan Claude.
- Timeout, retry ringan, dan error_response(`AI_PROVIDER_ERROR`) bila gagal.
- JANGAN log isi API key. Rate-limit wajar untuk endpoint publik.
