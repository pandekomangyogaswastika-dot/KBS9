/**
 * AssessmentV2Taking — Full-featured assessment taking page (Portal Client).
 * KTI glassmorphism dark design, adapted from KN3 Discovery UX.
 * Route: /portal/assessments/:sessionId
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send,
  FileText, StickyNote, X, Paperclip, Trash2, SkipForward,
  RotateCcw, AlertTriangle, Check, Eye, EyeOff,
  Download, Upload, FileSpreadsheet,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

// ── helpers ──────────────────────────────────────────────────────────────────
const loc = (val, lang) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.id || val.en || "";
};

const TYPE_ALIASES = {
  select: "single_choice", multiselect: "multi_choice",
  yesno: "yes_no", scale: "scale_1_5",
  text: "text_short", textarea: "text_long",
};
const normalizeType = (t) => TYPE_ALIASES[t] || t;

const OTHER_VALUE = "__other__";

const isAnswerFilled = (ans) => {
  if (!ans || ans.skipped) return false;
  const v = ans.value;
  if (v === null || v === undefined || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  if (v === false) return true;
  return true;
};

const shouldShowQ = (q, answersMap) => {
  const rule = q?.show_if;
  if (!rule) return true;
  const tid = rule.question_id;
  if (!tid) return true;
  const ans = (answersMap || {})[tid];
  if (!ans || ans.skipped) return true;
  const actual = ans.value;
  if (actual === null || actual === undefined || actual === "" || (Array.isArray(actual) && actual.length === 0)) return true;
  const op = (rule.operator || "equals").toLowerCase();
  const exp = rule.value;
  const exps = rule.values || [];
  const asList = (x) => (Array.isArray(x) ? x : [x]);
  if (op === "equals") return actual === exp;
  if (op === "not_equals") return actual !== exp;
  if (op === "in") return exps.includes(actual);
  if (op === "not_in") return !exps.includes(actual);
  if (op === "includes") return exps.some((v) => asList(actual).includes(v));
  if (op === "not_includes") return !exps.some((v) => asList(actual).includes(v));
  if (op === "is_truthy") return Boolean(actual);
  if (op === "is_falsy") return !actual;
  return true;
};

// ── Question Field ────────────────────────────────────────────────────────────
function QuestionInput({ q, answer, onChange, locked, lang }) {
  const type = normalizeType(q.type || "text_short");
  const skipped = answer?.skipped;
  const value = answer?.value;
  const arrVal = Array.isArray(value) ? value : [];
  const inputCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[rgba(124,104,225,0.6)] focus:bg-white/[0.06]";
  const optionCls = (active) => `flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
    active ? "border-[rgba(124,104,225,0.6)] bg-[rgba(124,104,225,0.15)] text-white" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/[0.06]"
  }`;

  if (skipped) {
    return (
      <div className="rounded-xl border border-dashed border-[rgba(255,180,60,0.4)] bg-[rgba(255,180,60,0.06)] px-4 py-3 text-sm italic text-[rgba(255,180,60,0.8)]">
        Pertanyaan ini dilewati. Klik tombol Lewati untuk mengisi kembali.
      </div>
    );
  }

  if (type === "single_choice") {
    const isOther = value === OTHER_VALUE;
    return (
      <div className="space-y-2.5">
        <div className="space-y-2">
          {(q.options || []).map((opt) => {
            const label = loc(opt.label, lang) || loc(opt.label, "id") || opt.value;
            const active = value === opt.value;
            return (
              <label key={opt.value} className={optionCls(active)}>
                <input type="radio" name={q.id} value={opt.value} checked={active}
                  disabled={locked} onChange={() => onChange({ value: opt.value })} className="sr-only" />
                <span className={`size-4 shrink-0 rounded-full border-2 flex items-center justify-center ${ active ? "border-[#7C68E1] bg-[#7C68E1]" : "border-white/30" }`}>
                  {active && <span className="size-1.5 rounded-full bg-white" />}
                </span>
                <span className="flex-1 leading-snug">{label}</span>
              </label>
            );
          })}
        </div>
        {isOther && (
          <input value={answer?.other_text || ""} onChange={(e) => onChange({ other_text: e.target.value })}
            className={inputCls} placeholder="Tulis pilihan Anda…" disabled={locked} />
        )}
      </div>
    );
  }

  if (type === "multi_choice") {
    const max = q.max_select;
    const hasOther = arrVal.includes(OTHER_VALUE);
    return (
      <div className="space-y-2.5">
        {max && <p className="text-xs text-white/40">Maks {max} pilihan · Terpilih: {arrVal.filter((v) => v !== OTHER_VALUE).length}/{max}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {(q.options || []).map((opt) => {
            const checked = arrVal.includes(opt.value);
            const label = loc(opt.label, lang) || opt.value;
            const reachedMax = max && !checked && arrVal.filter((v) => v !== OTHER_VALUE).length >= max;
            return (
              <label key={opt.value} className={`${optionCls(checked)} ${reachedMax ? "cursor-not-allowed opacity-50" : ""}` }>
                <input type="checkbox" checked={checked} disabled={locked || reachedMax}
                  onChange={(e) => {
                    const next = e.target.checked ? [...arrVal, opt.value] : arrVal.filter((v) => v !== opt.value);
                    onChange({ value: next });
                  }} className="sr-only" />
                <span className={`size-4 shrink-0 rounded flex items-center justify-center border-2 ${ checked ? "border-[#7C68E1] bg-[#7C68E1]" : "border-white/30" }`}>
                  {checked && <Check className="size-2.5 text-white" />}
                </span>
                <span className="flex-1 leading-snug">{label}</span>
              </label>
            );
          })}
        </div>
        {hasOther && (
          <input value={answer?.other_text || ""} onChange={(e) => onChange({ other_text: e.target.value })}
            className={inputCls} placeholder="Tulis pilihan Anda…" disabled={locked} />
        )}
      </div>
    );
  }

  if (type === "yes_no") {
    const isYes = value === true || value === "yes";
    const isNo = value === false || value === "no";
    return (
      <div className="flex gap-3">
        {[{v: true, label: "Ya"}, {v: false, label: "Tidak"}].map(({ v, label }) => {
          const active = v === true ? isYes : isNo;
          return (
            <button key={label} type="button" disabled={locked} onClick={() => onChange({ value: v })}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                active ? "border-[rgba(124,104,225,0.6)] bg-[rgba(124,104,225,0.2)] text-white" : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25"
              }`}>
              {active ? <Check className="size-4" /> : null}
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "scale_1_5") {
    const labels = q.scale_labels || {};
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5].map((n) => {
            const active = String(value) === String(n);
            return (
              <button key={n} type="button" disabled={locked} onClick={() => onChange({ value: n })}
                className={`flex h-12 min-w-[3rem] flex-col items-center justify-center rounded-xl border px-4 text-sm font-bold transition-all ${
                  active ? "border-[rgba(124,104,225,0.6)] bg-[rgba(124,104,225,0.2)] text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"
                }`}>
                <span>{n}</span>
              </button>
            );
          })}
        </div>
        {(labels["1"] || labels["5"]) && (
          <div className="flex justify-between text-[11px] text-white/40">
            <span>1 — {labels["1"] || "Sangat Rendah"}</span>
            <span>5 — {labels["5"] || "Sangat Tinggi"}</span>
          </div>
        )}
        {value && <p className="text-xs text-[#7C68E1]">Pilihan Anda: <strong>{value}/5{labels[String(value)] ? ` — ${labels[String(value)]}` : ""}</strong></p>}
      </div>
    );
  }

  if (type === "text_long" || type === "textarea") {
    return (
      <textarea value={value || ""} onChange={(e) => onChange({ value: e.target.value })}
        className={inputCls} rows={4} placeholder="Tulis jawaban Anda di sini…" disabled={locked} />
    );
  }

  if (type === "number") {
    return (
      <input type="number" value={value || ""} onChange={(e) => onChange({ value: e.target.value === "" ? "" : Number(e.target.value) })}
        className={inputCls} placeholder="Masukkan angka…" disabled={locked} />
    );
  }

  // text_short, default
  return (
    <input type="text" value={value || ""} onChange={(e) => onChange({ value: e.target.value })}
      className={inputCls} placeholder="Tulis jawaban Anda…" disabled={locked} />
  );
}

function QuestionCard({ q, answer, onChange, locked, lang, index, sessionId, attachments, onAttachmentUploaded, onAttachmentDeleted }) {
  const filled = isAnswerFilled(answer);
  const skipped = answer?.skipped;
  const [showNote, setShowNote] = useState(() => Boolean(answer?.note));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const prompt = loc(q.prompt || q.text, lang);
  const hint = loc(q.hint, lang);

  const handleAttach = async (files) => {
    if (!files?.[0] || !sessionId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("question_id", q.id);
      fd.append("file", files[0]);
      const res = await api.post(`/assessment/sessions/${sessionId}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onAttachmentUploaded?.(res.data?.data);
      toast.success("Lampiran diunggah");
    } catch (err) { toast.error(apiError(err)); } finally { setUploading(false); }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.delete(`/assessment/sessions/${sessionId}/attachments/${attId}`);
      onAttachmentDeleted?.(attId);
      toast.success("Lampiran dihapus");
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div data-testid={`q-card-${q.id}`}
      className={`rounded-2xl border bg-white/[0.03] p-5 backdrop-blur-sm transition-all ${
        filled ? "border-[rgba(124,104,225,0.4)] shadow-[0_0_12px_rgba(124,104,225,0.12)]" :
        skipped ? "border-[rgba(255,180,60,0.3)]" : "border-white/10 hover:border-white/20"
      }`}>
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-lg bg-white/[0.06] border border-white/12 px-2 py-1 text-[10px] font-bold text-white/50">Q{String(index).padStart(2, "0")}</span>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm font-semibold leading-snug text-white">{prompt}{q.required && <span className="ml-1 text-[#ff96aa]">*</span>}</p>
            {filled && <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#73D1AD]"><Check className="size-2.5" /> Terisi</span>}
          </div>
          {hint && <p className="mt-0.5 text-[11px] text-white/40">{hint}</p>}
        </div>
      </div>

      {/* Input */}
      <div className="mb-3">
        <QuestionInput q={q} answer={answer} onChange={(partial) => onChange(q.id, partial)} locked={locked} lang={lang} />
      </div>

      {/* Note */}
      {!skipped && (
        <div className="mb-2">
          {(showNote || answer?.note) ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] text-white/40"><StickyNote className="size-3" /> Catatan tambahan (opsional)</label>
                {!answer?.note && <button type="button" onClick={() => setShowNote(false)} className="text-white/30 hover:text-white/60"><X className="size-3.5" /></button>}
              </div>
              <textarea value={answer?.note || ""} onChange={(e) => onChange(q.id, { note: e.target.value })}
                rows={2} placeholder="Tambahkan konteks atau penjelasan…" disabled={locked}
                className="kti-focus w-full rounded-lg border border-white/8 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/25" />
            </div>
          ) : (
            <button type="button" onClick={() => setShowNote(true)} disabled={locked}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1 text-[11px] text-white/40 hover:border-white/30 hover:text-white/60">
              <StickyNote className="size-3" /> Tambah catatan
            </button>
          )}
        </div>
      )}

      {/* Attachments */}
      {sessionId && !locked && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {(attachments || []).map((att) => (
            <div key={att.id} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">
              <Paperclip className="size-3 text-white/40" />
              <span className="text-[11px] text-white/60 max-w-[120px] truncate">{att.filename}</span>
              <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="text-[#ff96aa] hover:text-[#ff6680]">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1 text-[11px] text-white/40 hover:border-white/30 hover:text-white/60">
            {uploading ? <Loader2 className="size-3 animate-spin" /> : <Paperclip className="size-3" />}
            Lampirkan file
          </button>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx" onChange={(e) => handleAttach(e.target.files)} />
        </div>
      )}

      {/* Footer: Skip/Clear */}
      <div className="flex items-center justify-end gap-2 border-t border-white/8 pt-2.5">
        {filled && !skipped && (
          <button type="button" disabled={locked} onClick={() => onChange(q.id, { value: null, other_text: "", note: "" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/40 hover:border-[rgba(255,92,122,0.4)] hover:text-[#ff96aa]">
            <RotateCcw className="size-3" /> Hapus jawaban
          </button>
        )}
        <button type="button" disabled={locked} onClick={() => onChange(q.id, { skipped: !skipped, value: skipped ? null : answer?.value })}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors ${
            skipped ? "border-[rgba(255,180,60,0.4)] bg-[rgba(255,180,60,0.1)] text-[rgba(255,180,60,0.9)]" : "border-white/10 text-white/40 hover:border-[rgba(255,180,60,0.4)] hover:text-[rgba(255,180,60,0.8)]"
          }`}>
          <SkipForward className="size-3" /> {skipped ? "Batalkan Lewat" : "Lewati"}
        </button>
      </div>
    </div>
  );
}

// ── Domain Nav Item ───────────────────────────────────────────────────────────
function DomainNavItem({ domain, progress, active, onClick }) {
  const p = progress?.percent || 0;
  const title = typeof domain.title === "string" ? domain.title : (domain.title?.id || domain.title?.en || "Domain");
  return (
    <button data-testid={`domain-nav-${domain.id}`} onClick={onClick}
      className={`group w-full rounded-xl border px-3 py-3 text-left transition-all ${
        active ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.12)]" : "border-white/8 bg-white/[0.02] hover:border-white/18 hover:bg-white/[0.04]"
      }`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate text-xs font-semibold ${ active ? "text-white" : "text-white/60 group-hover:text-white/80" }`}>{title}</span>
        <span className={`shrink-0 text-[10px] font-bold ${ p === 100 ? "text-[#73D1AD]" : active ? "text-[#7C68E1]" : "text-white/35" }`}>{p}%</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full transition-all ${ p === 100 ? "bg-[#73D1AD]" : "bg-[#7C68E1]" }`} style={{ width: `${p}%` }} />
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AssessmentV2Taking() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "id";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [template, setTemplate] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [attachmentsByQ, setAttachmentsByQ] = useState({});
  const [activeDomainIdx, setActiveDomainIdx] = useState(0);
  const [progress, setProgress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);
  const pendingSave = useRef([]);
  const importFileRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/assessment/sessions/${sessionId}/detail`);
      const data = res.data?.data;
      setSession(data);
      setTemplate(data.template);
      setAnswersMap(data.answers_map || {});
      setAttachmentsByQ(data.attachments_by_question || {});
      setProgress(data.progress);
    } catch (err) { setError(apiError(err, "Gagal memuat assessment")); }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const domains = template ? (template.domains || template.sections || []) : [];
  const locked = session?.status === "submitted";
  const currentDomain = domains[activeDomainIdx];

  // Auto-save with debounce
  const triggerSave = useCallback((pending) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!pending.length) return;
      setSaving(true);
      try {
        await api.patch(`/assessment/sessions/${sessionId}/answers`, pending);
        setLastSaved(new Date());
      } catch (err) {
        console.warn("Auto-save failed:", err);
      } finally { setSaving(false); }
    }, 1500);
  }, [sessionId]);

  const handleChange = useCallback((qId, partial) => {
    setAnswersMap((prev) => {
      const existing = prev[qId] || { question_id: qId, value: null };
      const updated = { ...existing, question_id: qId, ...partial };
      // Build save payload
      const saveItem = {
        question_id: qId,
        value: updated.value ?? null,
        other_text: updated.other_text || null,
        note: updated.note || null,
        skipped: updated.skipped || false,
      };
      pendingSave.current = [saveItem]; // Replace with latest per question
      triggerSave([saveItem]);
      // Recompute progress
      const next = { ...prev, [qId]: updated };
      // Lightweight progress update
      const allDomains = template?.domains || template?.sections || [];
      let answered = 0, total = 0;
      const domainProgress = allDomains.map((d) => {
        const visible = d.questions.filter((q) => shouldShowQ(q, next));
        const ans = visible.filter((q) => isAnswerFilled(next[q.id])).length;
        answered += ans; total += visible.length;
        return { domain_id: d.id, answered: ans, total: visible.length, percent: visible.length ? Math.round(ans / visible.length * 100) : 0 };
      });
      setProgress({ answered, total, percent: total ? Math.round(answered / total * 100) : 0, domains: domainProgress });
      return next;
    });
  }, [template, triggerSave]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/assessment/sessions/${sessionId}/submit`);
      toast.success("Assessment berhasil disubmit!");
      await load();
      setConfirmSubmit(false);
    } catch (err) { toast.error(apiError(err)); }
    finally { setSubmitting(false); }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/assessment/sessions/${sessionId}/export-pdf?locale=${lang}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment_${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh");
    } catch (err) { toast.error(apiError(err, "Gagal mengunduh PDF")); }
    finally { setExporting(false); }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/assessment/sessions/${sessionId}/export-answers-excel?locale=${lang}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment_jawaban_${sessionId.slice(0, 8)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel berhasil diunduh — isi kolom 'Jawaban Anda' lalu import kembali");
    } catch (err) { toast.error(apiError(err, "Gagal mengunduh Excel")); }
    finally { setExporting(false); }
  };

  const handleImportExcel = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/assessment/sessions/${sessionId}/import-answers-excel`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { saved, total_in_file } = res.data?.data || {};
      toast.success(`${saved} jawaban berhasil diimport dari ${total_in_file} baris`);
      await load();
    } catch (err) { toast.error(apiError(err, "Gagal import Excel")); }
    finally { setImporting(false); if (importFileRef.current) importFileRef.current.value = ""; }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0B0D17" }}>
      <LoadingView />
    </div>
  );
  if (error) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0B0D17" }}>
      <ErrorView message={error} onRetry={load} />
    </div>
  );
  if (!session || !template) return null;

  const overallPct = progress?.percent || 0;
  const templateName = loc(template.name, lang);
  const brandColor = session.brand_color || "#7C68E1";
  const companyLogoUrl = session.company_logo_url;
  const companyName = session.company_name || loc(template.name, lang);
  const domainProgressMap = Object.fromEntries((progress?.domains || []).map((d) => [d.domain_id, d]));
  const visibleQuestions = currentDomain ? currentDomain.questions.filter((q) => shouldShowQ(q, answersMap)) : [];
  const hiddenCount = currentDomain ? currentDomain.questions.length - visibleQuestions.length : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0B0D17" }} data-testid="assessment-v2-taking">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/8 bg-[#0B0D17]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/portal/assessments")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.05] hover:text-white">
            <ChevronLeft className="size-3.5" /> Kembali
          </button>
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt={companyName} className="h-7 max-w-[80px] object-contain opacity-80" />
          ) : (
            <div className="size-7 shrink-0 rounded-full" style={{ background: `${brandColor}40`, border: `2px solid ${brandColor}` }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{templateName}</p>
            <p className="text-[11px] text-white/40">{session.company_name || session.client_name} · {session.project_name || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="flex items-center gap-1 text-[11px] text-white/40"><Loader2 className="size-3 animate-spin" /> Menyimpan…</span>}
            {lastSaved && !saving && <span className="text-[11px] text-[#73D1AD]"><CheckCircle2 className="inline size-3 mr-1" />Tersimpan</span>}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${overallPct}%`, background: `linear-gradient(90deg, ${brandColor}, #73D1AD)` }} />
              </div>
              <span className="text-xs font-bold text-white">{overallPct}%</span>
            </div>

            {/* Export/Import Tools — selalu tersedia */}
            <div className="flex items-center gap-1.5">
              {/* PDF */}
              <button
                data-testid="btn-export-pdf"
                onClick={handleExportPdf}
                disabled={exporting}
                title="Unduh PDF"
                className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Export Excel */}
              <button
                data-testid="btn-export-excel"
                onClick={handleExportExcel}
                disabled={exporting || locked}
                title="Export jawaban ke Excel"
                className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                <span className="hidden sm:inline">Excel</span>
              </button>

              {/* Import Excel — hanya sebelum submit */}
              {!locked && (
                <>
                  <button
                    data-testid="btn-import-excel"
                    onClick={() => importFileRef.current?.click()}
                    disabled={importing}
                    title="Import jawaban dari Excel"
                    className="flex items-center gap-1.5 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.1)] px-3 py-2 text-xs text-[#7C68E1] hover:bg-[rgba(124,104,225,0.2)] disabled:opacity-50"
                  >
                    {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <input ref={importFileRef} type="file" accept=".xlsx" className="hidden"
                    onChange={(e) => handleImportExcel(e.target.files?.[0])} />
                </>
              )}
            </div>

            {!locked && (
              <button onClick={() => setConfirmSubmit(true)}
                disabled={submitting}
                data-testid="btn-submit-assessment"
                className="flex items-center gap-2 rounded-xl border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.12)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.2)]">
                <Send className="size-3.5" /> Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submitted banner */}
      {locked && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.08)] px-5 py-3 text-sm text-[#73D1AD]">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Assessment ini telah disubmit. Jawaban tidak bisa diubah lagi. Gunakan tombol <strong>PDF</strong> di atas untuk mengunduh hasil.</span>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar: Domain Navigator */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 space-y-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Navigasi Domain</p>
            {domains.map((d, idx) => (
              <DomainNavItem
                key={d.id || idx} domain={d}
                progress={domainProgressMap[d.id]}
                active={activeDomainIdx === idx}
                onClick={() => setActiveDomainIdx(idx)}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {currentDomain ? (
            <div className="space-y-5">
              {/* Domain header */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.1)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C68E1]">
                        Domain {activeDomainIdx + 1} / {domains.length}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{loc(currentDomain.title, lang)}</h2>
                    {currentDomain.description && <p className="mt-1 text-sm text-white/50">{loc(currentDomain.description, lang)}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/35">
                      <span>{visibleQuestions.length} pertanyaan</span>
                      {hiddenCount > 0 && (
                        <span className="flex items-center gap-1 text-[rgba(124,104,225,0.7)]"><EyeOff className="size-3" /> {hiddenCount} disembunyikan oleh branching</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#7C68E1]">{domainProgressMap[currentDomain.id]?.percent || 0}%</p>
                    <p className="text-[11px] text-white/35">{domainProgressMap[currentDomain.id]?.answered || 0}/{domainProgressMap[currentDomain.id]?.total || visibleQuestions.length} terjawab</p>
                  </div>
                </div>
              </div>

              {/* Mobile domain selector */}
              <div className="lg:hidden">
                <select value={activeDomainIdx} onChange={(e) => setActiveDomainIdx(Number(e.target.value))}
                  className="kti-focus w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3.5 py-2.5 text-sm text-white">
                  {domains.map((d, idx) => (
                    <option key={d.id || idx} value={idx}>{loc(d.title, lang)} ({domainProgressMap[d.id]?.percent || 0}%)</option>
                  ))}
                </select>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {visibleQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    q={q} answer={answersMap[q.id]}
                    onChange={handleChange}
                    locked={locked}
                    lang={lang}
                    index={idx + 1}
                    sessionId={!locked ? sessionId : null}
                    attachments={attachmentsByQ[q.id] || []}
                    onAttachmentUploaded={(att) => setAttachmentsByQ((prev) => ({ ...prev, [q.id]: [...(prev[q.id] || []), att] }))}
                    onAttachmentDeleted={(attId) => setAttachmentsByQ((prev) => ({ ...prev, [q.id]: (prev[q.id] || []).filter((a) => a.id !== attId) }))}
                  />
                ))}
              </div>

              {/* Domain navigation */}
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-5">
                {activeDomainIdx > 0 ? (
                  <button onClick={() => setActiveDomainIdx((i) => i - 1)}
                    data-testid="domain-prev"
                    className="flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.06]">
                    <ChevronLeft className="size-4" /> Sebelumnya
                  </button>
                ) : <span />}
                {activeDomainIdx < domains.length - 1 ? (
                  <button onClick={() => setActiveDomainIdx((i) => i + 1)}
                    data-testid="domain-next"
                    className="flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.25)]">
                    Berikutnya <ChevronRight className="size-4" />
                  </button>
                ) : (
                  !locked && (
                    <button onClick={() => setConfirmSubmit(true)}
                      data-testid="domain-finish-submit"
                      className="flex items-center gap-2 rounded-xl border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.12)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.2)]">
                      Selesai & Submit <Send className="size-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/12 py-20">
              <AlertTriangle className="size-10 text-white/20" />
              <p className="text-sm text-white/40">Template tidak memiliki domain/pertanyaan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Setelah disubmit, jawaban tidak bisa diubah lagi. Progress saat ini: <strong className="text-[#7C68E1]">{overallPct}%</strong> ({progress?.answered || 0}/{progress?.total || 0} pertanyaan terjawab).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]" disabled={submitting}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting} data-testid="confirm-submit-assessment"
              className="border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.18)] text-white hover:bg-[rgba(115,209,173,0.28)]">
              {submitting && <Loader2 className="size-4 animate-spin mr-2 inline" />}
              Ya, Submit Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
