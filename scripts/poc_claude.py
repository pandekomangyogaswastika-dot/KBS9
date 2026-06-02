"""
POC: Claude (Anthropic) via emergentintegrations + EMERGENT_LLM_KEY.
Validasi: koneksi, system prompt grounding, multi-turn, error handling.
Jalankan: python3 /app/scripts/poc_claude.py
"""
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

MODEL = ("anthropic", "claude-sonnet-4-6")

# Grounding context (placeholder ringkasan konten Kubus) -> nanti diambil dari CMS.
KUBUS_CONTEXT = """
Kamu adalah "Kubus Solution Advisor", asisten AI resmi PT Kubus Teknologi Indonesia,
perusahaan IT solutions. Jawab ramah, ringkas, profesional. Gunakan bahasa pengguna.

LAYANAN KUBUS:
- Custom Software / ERP / WMS Development
- Web & Mobile App Development
- Cloud, DevOps & Infrastructure
- AI / Data / Automation
- IoT / RFID Solutions
- UI/UX & Product Design
- IT Consulting & System Integration

ATURAN:
- Hanya bahas layanan yang ada di atas. Jangan mengarang layanan lain.
- Jika user butuh penawaran detail, arahkan untuk mengisi "Assessment" atau hubungi tim via Contact.
- Jangan beri komitmen harga final tanpa assessment.
"""


async def run_poc():
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        print("[FAIL] EMERGENT_LLM_KEY tidak ditemukan di env")
        return 1

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as exc:  # noqa: BLE001
        print(f"[FAIL] import emergentintegrations gagal: {exc}")
        return 1

    print(f"[INFO] Model: {MODEL[0]}/{MODEL[1]}")
    chat = LlmChat(
        api_key=api_key,
        session_id="poc-advisor-001",
        system_message=KUBUS_CONTEXT,
    ).with_model(*MODEL)

    results = []

    # Turn 1 — pertanyaan grounded
    try:
        r1 = await chat.send_message(UserMessage(
            text="Halo, perusahaan saya pabrik tekstil. Solusi apa dari Kubus yang cocok untuk lacak stok gudang secara real-time?"
        ))
        print("\n--- Turn 1 (grounded) ---")
        print(r1)
        ok1 = bool(r1) and len(str(r1)) > 20
        results.append(("grounded_answer", ok1))
    except Exception as exc:  # noqa: BLE001
        print(f"[FAIL] Turn 1 error: {exc}")
        results.append(("grounded_answer", False))

    # Turn 2 — uji multi-turn (context carry-over)
    try:
        r2 = await chat.send_message(UserMessage(
            text="Oke, langkah selanjutnya apa supaya tim kalian bisa kasih estimasi?"
        ))
        print("\n--- Turn 2 (multi-turn) ---")
        print(r2)
        text2 = str(r2).lower()
        # diharapkan menyebut assessment / contact (sesuai grounding)
        ok2 = any(k in text2 for k in ["assessment", "asesmen", "contact", "kontak", "hubungi", "isi"])
        results.append(("multi_turn_grounded_cta", ok2))
    except Exception as exc:  # noqa: BLE001
        print(f"[FAIL] Turn 2 error: {exc}")
        results.append(("multi_turn_grounded_cta", False))

    # Turn 3 — uji guardrail (di luar scope)
    try:
        r3 = await chat.send_message(UserMessage(
            text="Apakah Kubus jual tiket pesawat?"
        ))
        print("\n--- Turn 3 (guardrail out-of-scope) ---")
        print(r3)
        ok3 = bool(r3)
        results.append(("guardrail_answer", ok3))
    except Exception as exc:  # noqa: BLE001
        print(f"[FAIL] Turn 3 error: {exc}")
        results.append(("guardrail_answer", False))

    print("\n================ POC RESULT ================")
    passed = 0
    for name, ok in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
        passed += 1 if ok else 0
    print(f"  TOTAL: {passed}/{len(results)} passed")
    print("============================================")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(run_poc()))
