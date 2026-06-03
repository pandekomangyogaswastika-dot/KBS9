# ⚠️ IMPORTANT: Library Dependencies untuk Production

## 🚫 TIDAK PAKAI `emergentintegrations`

File ini adalah versi **PRODUCTION** yang **TIDAK menggunakan library emergent**.

### ❌ Yang DIHAPUS:
- `emergentintegrations==0.1.2` ← Library khusus Emergent Agent

### ✅ Yang DIPAKAI:
- `anthropic>=0.39.0` ← SDK resmi Anthropic untuk Claude AI
- `reportlab>=4.0.0` ← Untuk PDF generation
- `Pillow>=10.0.0` ← Untuk image processing

---

## 📋 Installation

### Di VPS Production:

```bash
cd /home/kbs8/KBS8/backend
source venv/bin/activate
pip install -r requirements.production.txt
```

---

## 🔑 Environment Variables

### Untuk AI Integration (Optional):

**Jika mau pakai Claude AI untuk assessment reports:**

```bash
# Di /home/kbs8/KBS8/backend/.env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Get key dari: https://console.anthropic.com/settings/keys
```

**Jika TIDAK pakai AI:**
- Skip variabel ANTHROPIC_API_KEY
- AI Report feature akan disabled otomatis
- Assessment tetap bisa digunakan normal

---

## 📁 File References

### AI Service Files:

**Production (pakai Anthropic SDK):**
- `/app/backend/ai_report_service_production.py` ← USE THIS!
- `/app/backend/services/assessment_ai_report.py` (update untuk pakai anthropic)

**Development (pakai emergent - JANGAN PAKAI DI PRODUCTION):**
- `/app/backend/ai_report_service.py` ← IGNORE di production

---

## 🔄 Migration dari Emergent

Jika ada kode yang masih import emergent:

```python
# ❌ OLD (Emergent)
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ✅ NEW (Production)
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
```

---

## ✅ Verification

Setelah install, verify:

```bash
python3 -c "import anthropic; print('✓ anthropic installed')"
python3 -c "import reportlab; print('✓ reportlab installed')"
python3 -c "import PIL; print('✓ Pillow installed')"
```

Output yang benar:
```
✓ anthropic installed
✓ reportlab installed
✓ Pillow installed
```

---

## 📦 Full Dependencies List

```
fastapi==0.110.1              # Web framework
uvicorn==0.25.0               # ASGI server
motor==3.3.1                  # Async MongoDB driver
pymongo==4.5.0                # MongoDB driver
pydantic>=2.6.4               # Data validation
pyjwt>=2.10.1                 # JWT auth
bcrypt==4.1.3                 # Password hashing
python-jose>=3.3.0            # JWT utilities
python-multipart>=0.0.9       # File upload
python-dotenv>=1.0.1          # .env support
requests>=2.31.0              # HTTP client
pandas>=2.2.0                 # Data processing
numpy>=1.26.0                 # Numeric computing
boto3>=1.34.129               # AWS SDK (untuk S3 jika perlu)
anthropic>=0.39.0             # ← AI Integration
reportlab>=4.0.0              # ← PDF generation
Pillow>=10.0.0                # ← Image processing
```

---

## 🎯 Summary

- ✅ **Production-ready** tanpa dependency ke Emergent
- ✅ **AI optional** - bisa diaktifkan/nonaktifkan
- ✅ **All features work** dengan atau tanpa AI
- ✅ **Clean dependencies** - hanya library public

---

**File ini untuk deployment ke VPS Hostinger atau server production lainnya.**
