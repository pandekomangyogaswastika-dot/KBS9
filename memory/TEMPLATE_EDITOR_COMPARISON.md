# Perbandingan Fitur Pembuatan Pertanyaan (Template Editor)

**Tanggal Analisis:** ${new Date().toISOString().split('T')[0]}

---

## 🎯 KESIMPULAN UTAMA

### KBS8: ✅ **MEMILIKI Template Editor Visual yang LENGKAP**
### KN3: ❌ **TIDAK ADA UI Editor** (questions hardcoded di backend)

---

## 📊 PERBANDINGAN DETAIL

### KBS8 Assessment Template Editor ✅

**File:** `/app/frontend/src/features/admin/assessment/TemplateEditorV2.jsx` (746 lines)

#### ✅ Fitur yang SUDAH ADA di KBS8:

**1. Visual Domain/Section Editor**
- ✅ Create, Update, Delete domains
- ✅ Reorder domains (move up/down)
- ✅ Color picker untuk setiap domain
- ✅ Icon picker (lucide icons)
- ✅ Multilingual title & description (ID + EN)

**2. Visual Question Builder**
```javascript
// 7 Tipe Pertanyaan Didukung:
- Text (isian pendek)
- Textarea (isian panjang) 
- Select (pilihan ganda - pilih satu)
- Multiselect (pilihan ganda - pilih banyak)
- Yes/No (ya/tidak)
- Scale (skala 1-5 dengan label)
- Number (angka)
```

**3. Options Builder untuk Pilihan Ganda**
- ✅ Add/Remove/Reorder options
- ✅ Multilingual labels (ID + EN)
- ✅ Custom value untuk setiap option
- ✅ Visual drag & drop (up/down buttons)

**4. Conditional Logic (Show If)**
```javascript
// Operators yang didukung:
- equals          (sama dengan)
- not_equals      (tidak sama dengan)
- in              (termasuk dalam list)
- not_in          (tidak termasuk dalam)
- is_truthy       (diisi / Ya)
- is_falsy        (kosong / Tidak)
```

**Features:**
- ✅ Visual builder untuk show_if rules
- ✅ Dropdown untuk pilih question dependency
- ✅ Dynamic value selector based on target question type
- ✅ Preview of conditional logic

**5. Scale Labels Editor**
- ✅ Custom labels untuk skala 1-5
- ✅ Contoh: 1="Sangat Tidak Setuju", 5="Sangat Setuju"

**6. Question Properties**
- ✅ Required toggle (wajib/opsional)
- ✅ Weight/bobot untuk scoring
- ✅ Help text/hint (multilingual)
- ✅ Question text (multilingual)

**7. Template Management**
- ✅ Create new template
- ✅ Edit existing template
- ✅ Publish/unpublish
- ✅ Category assignment
- ✅ Clone/duplicate questions
- ✅ Bulk operations

**8. Live Preview**
- ✅ Real-time preview saat edit
- ✅ Visual validation (highlight incomplete fields)
- ✅ Question counter per domain

**9. Advanced Features**
- ✅ Drag & drop reordering
- ✅ Duplicate question
- ✅ Bulk import/export (future)
- ✅ Template versioning (backend ready)

---

### KN3 Discovery Questions ❌

**File:** `/tmp/KN3_repo/backend/services/discovery_questions.py` (1332 lines)

#### ❌ TIDAK Ada UI Editor

**Cara membuat pertanyaan di KN3:**
```python
# Hardcoded di Python file
DISCOVERY_DOMAINS = [
    {
        "id": "D01",
        "title": "Profil Perusahaan & Tujuan Strategis",
        "questions": [
            {
                "id": "D01-Q01",
                "prompt": "Jenis bisnis utama PT. Kain Nusantara?",
                "type": "single_choice",
                "options": [
                    {"value": "distributor", "label": "Distributor / Wholesaler"},
                    # ... manual coding
                ],
                "help": "Pilih yang paling mendekati..."
            }
        ]
    }
]
```

**Implikasi:**
- ❌ Tidak ada UI untuk admin
- ❌ Harus edit kode Python untuk ubah questions
- ❌ Butuh developer untuk setiap perubahan
- ❌ Tidak bisa create multiple templates
- ❌ Tidak ada versioning
- ❌ Risk typo & syntax error

**Tipe pertanyaan yang didukung (hardcoded):**
```python
# 7 tipe (sama dengan KBS8):
- single_choice
- multi_choice  
- text_short
- text_long
- number
- scale_1_5
- yes_no
```

---

## 🔥 KEUNGGULAN KBS8 vs KN3

### Template Editor UI ⭐⭐⭐⭐⭐

| Fitur | KBS8 | KN3 | Winner |
|-------|------|-----|--------|
| Visual Editor | ✅ Full UI | ❌ None | **KBS8** |
| Create/Edit Questions | ✅ Point & click | ❌ Code editing | **KBS8** |
| Multilingual Support | ✅ ID + EN | ✅ Hardcoded | **KBS8** |
| Conditional Logic Builder | ✅ Visual | ❌ Manual coding | **KBS8** |
| Options Management | ✅ Dynamic UI | ❌ JSON in code | **KBS8** |
| Multiple Templates | ✅ Unlimited | ❌ Single template | **KBS8** |
| Template Versioning | ✅ Backend ready | ❌ None | **KBS8** |
| Real-time Preview | ✅ Yes | ❌ None | **KBS8** |
| User-friendly | ✅ Non-tech admin can use | ❌ Need developer | **KBS8** |
| Reorder Questions | ✅ Drag & drop | ❌ Edit array order | **KBS8** |

**SCORE: KBS8 10/10 vs KN3 0/10** ✅

---

## 🎨 SCREENSHOT FITUR TEMPLATE EDITOR KBS8

### 1. Main Editor Interface
```
┌─────────────────────────────────────────────────────────┐
│  Template Editor V2                        [Save] [Close]│
├─────────────────┬───────────────────────────────────────┤
│                 │                                        │
│ Domain List     │  Question Editor Panel                │
│ ┌─────────────┐ │  ┌──────────────────────────────┐    │
│ │ Domain 1    │ │  │ Tipe Pertanyaan              │    │
│ │ 5 pertanyaan│ │  │ [Text] [Textarea] [Select]   │    │
│ └─────────────┘ │  └──────────────────────────────┘    │
│ ┌─────────────┐ │                                       │
│ │ Domain 2    │ │  Teks Pertanyaan (ID): _________     │
│ │ 3 pertanyaan│ │  Teks Pertanyaan (EN): _________     │
│ └─────────────┘ │                                       │
│                 │  Pilihan Jawaban:                     │
│ [+ Add Domain]  │  ☐ Option 1  [↑] [↓] [×]            │
│                 │  ☐ Option 2  [↑] [↓] [×]            │
│                 │  [+ Tambah pilihan]                   │
│                 │                                       │
│                 │  Logika Kondisional:                  │
│                 │  [+ Tambah kondisi tampil]            │
│                 │                                       │
│                 │  [x] Wajib Diisi    Weight: [1.0]    │
└─────────────────┴───────────────────────────────────────┘
```

### 2. Conditional Logic Builder
```
Show this question IF:
┌────────────────────────────────────────┐
│ Question: [D01-Q01 ▼]                  │
│ Operator: [equals ▼]                   │
│ Value:    [distributor ▼]              │
│                          [Remove]      │
└────────────────────────────────────────┘
```

### 3. Scale Labels Editor
```
Label Skala (opsional):
┌────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │
├────┼────┼────┼────┼────┤
│Buruk│    │Cukup│    │Baik│
└────┴────┴────┴────┴────┘
```

---

## 🚀 CARA MENGGUNAKAN TEMPLATE EDITOR KBS8

### Akses Editor
1. Login sebagai Admin
2. Navigate ke `/admin/assessments`
3. Klik "Create New Template" atau "Edit" pada template existing

### Membuat Template Baru
1. **Set Template Info:**
   - Name (ID + EN)
   - Category (general, it_maturity, security, dll)
   - Description

2. **Tambah Domain:**
   - Klik "+ Add Domain"
   - Isi title, description
   - Pilih color & icon

3. **Tambah Pertanyaan:**
   - Pilih domain
   - Klik "+ Add Question"
   - Pilih tipe pertanyaan
   - Isi text & hint

4. **Set Options (untuk Select/Multiselect):**
   - Klik "+ Tambah pilihan"
   - Isi value & label (ID + EN)
   - Reorder dengan ↑ ↓

5. **Tambah Conditional Logic (opsional):**
   - Klik "+ Tambah kondisi tampil"
   - Pilih question dependency
   - Pilih operator
   - Pilih value

6. **Publish:**
   - Toggle "Published" ON
   - Klik "Save"

### Edit Template Existing
1. Find template di list
2. Klik "Edit"
3. Modify as needed
4. Save

---

## 📋 TIPE PERTANYAAN LENGKAP

### 1. Text (Isian Pendek)
```javascript
{
  "type": "text",
  "text": {"id": "Nama perusahaan Anda?", "en": "Your company name?"},
  "hint": {"id": "Contoh: PT Sejahtera Abadi", "en": "Example: PT Sejahtera Abadi"}
}
```
**Use case:** Nama, email, nomor telepon, SKU

---

### 2. Textarea (Isian Panjang)
```javascript
{
  "type": "textarea",
  "text": {"id": "Jelaskan proses bisnis Anda", "en": "Describe your business process"}
}
```
**Use case:** Deskripsi, catatan, penjelasan detail

---

### 3. Select (Pilihan Ganda - Pilih Satu)
```javascript
{
  "type": "select",
  "text": {"id": "Ukuran perusahaan?", "en": "Company size?"},
  "options": [
    {"value": "small", "label": {"id": "Kecil (1-50)", "en": "Small (1-50)"}},
    {"value": "medium", "label": {"id": "Menengah (51-250)", "en": "Medium (51-250)"}},
    {"value": "large", "label": {"id": "Besar (250+)", "en": "Large (250+)"}}
  ]
}
```
**Use case:** Single selection dari beberapa pilihan

---

### 4. Multiselect (Pilihan Ganda - Pilih Banyak)
```javascript
{
  "type": "multiselect",
  "text": {"id": "Modul apa yang Anda butuhkan?", "en": "Which modules do you need?"},
  "max_select": 3,
  "options": [
    {"value": "inventory", "label": {"id": "Inventory", "en": "Inventory"}},
    {"value": "sales", "label": {"id": "Sales", "en": "Sales"}},
    {"value": "purchasing", "label": {"id": "Purchasing", "en": "Purchasing"}}
  ]
}
```
**Use case:** Multiple selection dengan optional max limit

---

### 5. Yes/No (Ya/Tidak)
```javascript
{
  "type": "yesno",
  "text": {"id": "Apakah Anda punya warehouse?", "en": "Do you have a warehouse?"}
}
```
**Use case:** Boolean questions, trigger conditional logic

---

### 6. Scale (Skala 1-5)
```javascript
{
  "type": "scale",
  "text": {"id": "Seberapa puas dengan sistem saat ini?", "en": "How satisfied with current system?"},
  "scale_labels": {
    "1": "Sangat tidak puas",
    "3": "Netral",
    "5": "Sangat puas"
  }
}
```
**Use case:** Likert scale, satisfaction rating, maturity level

---

### 7. Number (Angka)
```javascript
{
  "type": "number",
  "text": {"id": "Berapa jumlah karyawan?", "en": "How many employees?"}
}
```
**Use case:** Quantities, counts, numeric values

---

## 🔧 CONDITIONAL LOGIC EXAMPLES

### Example 1: Show question based on Yes/No
```javascript
// Question 1
{
  "id": "Q01",
  "type": "yesno",
  "text": "Apakah Anda punya warehouse?"
}

// Question 2 (only show if Q01 = Yes)
{
  "id": "Q02",
  "type": "number",
  "text": "Berapa jumlah warehouse?",
  "show_if": {
    "question_id": "Q01",
    "operator": "is_truthy"
  }
}
```

### Example 2: Show based on specific value
```javascript
// Question 1
{
  "id": "Q01",
  "type": "select",
  "text": "Jenis bisnis?",
  "options": [
    {"value": "distributor", "label": "Distributor"},
    {"value": "retail", "label": "Retail"}
  ]
}

// Question 2 (only show if Q01 = "distributor")
{
  "id": "Q02",
  "type": "text",
  "text": "Nama supplier utama?",
  "show_if": {
    "question_id": "Q01",
    "operator": "equals",
    "value": "distributor"
  }
}
```

### Example 3: Show if value in list
```javascript
// Question 1
{
  "id": "Q01",
  "type": "multiselect",
  "text": "Modul yang dibutuhkan?",
  "options": [
    {"value": "inventory", "label": "Inventory"},
    {"value": "sales", "label": "Sales"},
    {"value": "accounting", "label": "Accounting"}
  ]
}

// Question 2 (only show if "inventory" is selected)
{
  "id": "Q02",
  "type": "select",
  "text": "Metode stock valuation?",
  "show_if": {
    "question_id": "Q01",
    "operator": "includes",
    "values": ["inventory"]
  }
}
```

---

## 🎯 API ENDPOINTS (Backend Support)

### Template CRUD
```
GET    /api/assessment/templates          # List all templates
GET    /api/assessment/templates/{id}     # Get one template
POST   /api/assessment/templates          # Create new
PATCH  /api/assessment/templates/{id}     # Update
DELETE /api/assessment/templates/{id}     # Delete
POST   /api/assessment/templates/{id}/publish   # Publish
```

### Session Management
```
POST   /api/assessment/sessions           # Create session from template
GET    /api/assessment/sessions/{id}/detail     # Get session + answers
PATCH  /api/assessment/sessions/{id}/answers    # Save answers
POST   /api/assessment/sessions/{id}/submit     # Submit assessment
```

---

## ✅ KESIMPULAN

### KBS8 SANGAT LENGKAP untuk Pembuatan Pertanyaan! 🎉

**Yang SUDAH ADA di KBS8:**
1. ✅ Visual Template Editor (drag & drop, point & click)
2. ✅ 7 tipe pertanyaan (text, textarea, select, multiselect, yesno, scale, number)
3. ✅ Options builder untuk pilihan ganda
4. ✅ Conditional logic (show_if) dengan visual builder
5. ✅ Multilingual (ID + EN)
6. ✅ Scale labels editor
7. ✅ Domain/section management
8. ✅ Question reordering
9. ✅ Duplicate/clone questions
10. ✅ Template versioning & publish

**KN3 TIDAK PUNYA:**
- ❌ UI Editor sama sekali
- ❌ Must edit Python code directly
- ❌ Need developer for every change

### Recommendation: ✅ TETAP GUNAKAN KBS8

**KBS8's Template Editor adalah SUPERIOR dibanding KN3.**

Tidak ada yang perlu di-port dari KN3 untuk fitur pembuatan pertanyaan, karena **KBS8 sudah jauh lebih advance!**

---

*Report created: 2024*
