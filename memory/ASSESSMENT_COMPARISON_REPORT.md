# Laporan Perbandingan Assessment: KBS8 vs KN3

**Tanggal Analisis:** ${new Date().toISOString().split('T')[0]}
**Repositori yang Dibandingkan:**
- KBS8: `/app/` (Production)
- KN3: `/tmp/KN3_repo/` (Reference)

---

## RINGKASAN EKSEKUTIF

Assessment module di KBS8 **SUDAH mengimplementasikan** logika inti dan branching dari KN3, tetapi terdapat **PERBEDAAN SIGNIFIKAN** dalam:
1. State management pattern (auto-save mechanism)
2. Design system (dark theme vs light theme)
3. API response structure
4. Beberapa optimasi performa

---

## PERBEDAAN DETAIL

### 1. STATE MANAGEMENT & AUTO-SAVE ⚠️ CRITICAL

#### KBS8 (Current - Less Optimal)
```javascript
// AssessmentTaking.jsx (lines 45-93)
const [changedAnswers, setChangedAnswers] = useState({});
const [isDirty, setIsDirty] = useState(false);
const [saving, setSaving] = useState(false);

// Debounce: 3000ms (3 detik)
useEffect(() => {
  if (!isDirty || isLocked) return;
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(async () => {
    if (Object.keys(changedAnswers).length === 0) { setIsDirty(false); return; }
    setSaving(true);
    await api.patch(`/assessment/sessions/${sessionId}/answers`, Object.values(changedAnswers));
    setChangedAnswers({});
    setIsDirty(false);
    // ...
  }, 3000);
}, [isDirty, changedAnswers, sessionId, isLocked]);
```

**Masalah:**
- Multiple state variables untuk tracking (changedAnswers, isDirty, saving)
- Delay 3 detik terlalu lama → risk data loss jika user close tab
- Stale closure issues karena `answersMap` di-capture saat render

#### KN3 (Reference - More Robust)
```javascript
// DiscoveryClient.jsx (lines 22-104)
const pendingRef = useRef(new Map());
const answersRef = useRef({});

// Debounce: 700ms (lebih responsif)
const patchAnswer = (question_id, patch) => {
  const existing = answersRef.current[question_id] || {};
  const merged = { ...existing, ...patch };
  answersRef.current[question_id] = merged;
  setAnswersMap(answersRef.current);
  
  pendingRef.current.set(question_id, merged);
  setSaving({ pending: pendingRef.current.size });
  
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(flush, 700);
};

const flush = async () => {
  if (pendingRef.current.size === 0) return;
  const batch = Array.from(pendingRef.current.entries()).map(...);
  pendingRef.current.clear();
  await discoveryApi.saveAnswers(sessionId, batch);
};
```

**Keuntungan:**
- Single source of truth via `answersRef.current`
- Tidak ada stale closure issues
- Lebih cepat (700ms vs 3000ms)
- Explicit pending tracking via Map
- Force flush on unmount (data safety)

---

### 2. DESIGN SYSTEM & VISUAL

#### KBS8 (Dark Theme)
- Background: `bg-[#05060A]` (dark)
- Border: `border-white/10`
- Colors: `--kti-indigo`, `--kti-teal`, `--kti-text-dim`
- Card style: Dark glass-morphism dengan backdrop-blur

#### KN3 (Light Theme)
- Background: `bg-white`
- Border: `border-discovery-border`
- Colors: `discovery-primary`, `discovery-accent`, `discovery-muted`
- Card style: Light dengan subtle shadows

**Impact:** Visual appearance sangat berbeda, tetapi functionality sama.

---

### 3. API STRUCTURE

#### KBS8
```javascript
// Response wrapping
const res = await api.get(`/assessment/sessions/${sessionId}/detail`);
const data = res.data?.data; // Nested structure
```

#### KN3
```javascript
// Direct response
const sess = await discoveryApi.fetchSession(sessionId);
const data = sess.session; // Flat structure
```

---

### 4. COMPONENT DIFFERENCES

#### QuestionField.jsx

| Feature | KBS8 | KN3 | Status |
|---------|------|-----|--------|
| Question types | ✅ All supported | ✅ All supported | ✅ SAME |
| Branching logic | ✅ Implemented | ✅ Reference | ✅ SAME |
| Multi-language | ✅ `lang` prop | ❌ Hardcoded ID | ✅ KBS8 Better |
| Skip functionality | ✅ | ✅ | ✅ SAME |
| Note/Comment | ✅ | ✅ | ✅ SAME |
| Attachment upload | ✅ | ✅ | ✅ SAME |
| Scale labels | ✅ | ✅ | ✅ SAME |
| "Other" option | ✅ | ✅ | ✅ SAME |

**Perbedaan minor:**
- Line 283 di KBS8: `data-testid="${testIdBase}-input"` (typo extra quote)
- Line 103 di KN3: Missing `lang` prop support

---

### 5. BRANCHING LOGIC ✅ IDENTICAL

File comparison:
- `/app/frontend/src/utils/assessmentBranching.js` (59 lines)
- `/tmp/KN3_repo/frontend/src/features/discovery/branching.js` (58 lines)

**Hasil:** Logika branching **100% IDENTIK**, sudah di-port dengan benar.

Operators yang didukung:
- equals, not_equals
- in, not_in  
- includes, not_includes
- is_truthy, is_falsy

Default behavior: Show question jika dependency belum dijawab.

---

### 6. BACKEND API ENDPOINTS

#### KBS8 Endpoints
```
GET  /api/assessment/sessions/{sessionId}/detail
PATCH /api/assessment/sessions/{sessionId}/answers
POST  /api/assessment/sessions/{sessionId}/submit
GET  /api/assessment/{token}/export (PDF)
```

#### KN3 Endpoints
```
GET  /api/discovery/sessions/{sessionId}
POST /api/discovery/sessions/{sessionId}/answers
POST /api/discovery/sessions/{sessionId}/submit
GET  /api/discovery/sessions/{sessionId}/export (PDF)
```

**Perbedaan:**
- KBS8 menggunakan PATCH untuk update answers (RESTful)
- KN3 menggunakan POST untuk update answers
- URL path berbeda (/assessment vs /discovery)
- Functionality sama

---

## KESAMAAN (Already Ported to KBS8) ✅

1. ✅ Branching logic identik
2. ✅ Question types semua sudah support
3. ✅ Progress calculation algorithm sama
4. ✅ Attachment upload flow sama
5. ✅ Skip/Clear/Note functionality sama
6. ✅ Multi-domain navigation sama
7. ✅ Submit validation sama
8. ✅ PDF export sama

---

## ISSUE YANG PERLU DIPERBAIKI

### 🔴 Priority 1: State Management (CRITICAL)

**Problem:** Auto-save di KBS8 menggunakan pattern yang kurang optimal, risk data loss.

**Solution:** Port KN3's `pendingRef` + `answersRef` pattern ke KBS8.

**Files to update:**
- `/app/frontend/src/features/portal/client/AssessmentTaking.jsx`

**Estimated impact:** 
- Reduced auto-save delay: 3000ms → 700ms
- Eliminasi stale closure bugs
- Better data safety (force flush on unmount)

---

### 🟡 Priority 2: Minor Bugs

**1. Typo di test-id:**
```javascript
// Line 283 in KBS8's QuestionField.jsx
data-testid={`${testIdBase}-input"`}  // Extra quote
// Should be:
data-testid={`${testIdBase}-input`}
```

**2. Missing lang prop handling di beberapa komponen:**
- Need to verify all `loc()` calls handle undefined `lang` gracefully

---

### 🟢 Priority 3: Performance Optimizations (Optional)

**From KN3 that could benefit KBS8:**
1. More aggressive memoization of visible questions
2. Debounce user input di textarea (700ms vs langsung)
3. Lazy loading untuk domain yang belum dibuka

---

## REKOMENDASI

### Immediate Actions (P0)

1. **Port KN3's state management pattern ke KBS8** ✅ WAJIB
   - Replace multiple state variables dengan `pendingRef` + `answersRef`
   - Reduce debounce dari 3000ms → 700ms
   - Add force flush on unmount

2. **Fix typo di QuestionField test-id** ✅ Quick fix

### Short-term (P1)

3. **Testing comprehensive** setelah state management diubah
   - Test auto-save dengan rapid input
   - Test data persistence saat tab close
   - Test dengan slow network

### Long-term (P2)

4. **Consider design system unification**
   - Apakah tetap dark theme atau switch ke light?
   - User feedback needed

---

## KESIMPULAN

**Status Assessment KBS8:**
- ✅ Core functionality: COMPLETE
- ✅ Branching logic: IDENTICAL to KN3
- ⚠️ State management: SUBOPTIMAL (needs improvement)
- ✅ Features: ALL implemented

**Next Steps:**
1. Konfirmasi dengan user: Apa spesifik yang "belum memenuhi kebutuhan"?
2. Jika state management issue → implement KN3 pattern
3. Jika UI/UX issue → gather specific feedback
4. Jika performance issue → profiling needed

**Estimated Fix Time:**
- State management port: 2-3 jam
- Testing: 1-2 jam
- Minor bug fixes: 30 menit

---

## APPENDIX: File Mapping

| Feature | KBS8 Path | KN3 Path | Status |
|---------|-----------|----------|--------|
| Main Assessment Page | `/app/frontend/src/features/portal/client/AssessmentTaking.jsx` | `/tmp/KN3_repo/frontend/src/features/discovery/DiscoveryClient.jsx` | Similar |
| Question Field | `/app/frontend/src/features/portal/client/components/QuestionField.jsx` | `/tmp/KN3_repo/frontend/src/features/discovery/components/QuestionField.jsx` | ~99% same |
| Branching Logic | `/app/frontend/src/utils/assessmentBranching.js` | `/tmp/KN3_repo/frontend/src/features/discovery/branching.js` | Identical |
| Backend Router | `/app/backend/routers/assessment.py` | `/tmp/KN3_repo/backend/routers/discovery.py` | Similar |
| PDF Export | `/app/backend/assessment_pdf.py` | `/tmp/KN3_repo/backend/services/discovery_pdf.py` | Similar |

---

*Report generated: 2024*
