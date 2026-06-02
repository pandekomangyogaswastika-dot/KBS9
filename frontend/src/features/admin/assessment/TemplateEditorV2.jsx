/**
 * TemplateEditorV2 — Full visual assessment template editor.
 * Features: domain/section management, question editor, options builder,
 * show_if conditional logic, hint, scale labels, reorder up/down.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  X, Plus, Trash2, ChevronUp, ChevronDown, Copy, Loader2,
  Pencil, Check, GripVertical, Eye, EyeOff, Settings2,
  List, AlignLeft, ToggleLeft, Star, Type, Hash, HelpCircle,
  ChevronRight, Palette, AlertCircle, Layers, BookOpen,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { v4 as uuidv4 } from "uuid";

// ── helpers ──────────────────────────────────────────────────────────────────
const newId = () => uuidv4();
const loc = (v, lang = "id") => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v[lang] || v.id || v.en || "";
};

const QUESTION_TYPES = [
  { value: "text", label: "Teks Pendek", icon: Type },
  { value: "textarea", label: "Teks Panjang", icon: AlignLeft },
  { value: "select", label: "Pilih Satu", icon: List },
  { value: "multiselect", label: "Pilih Banyak", icon: Layers },
  { value: "yesno", label: "Ya / Tidak", icon: ToggleLeft },
  { value: "scale", label: "Skala 1-5", icon: Star },
  { value: "number", label: "Angka", icon: Hash },
];

const OPERATORS = [
  { value: "equals", label: "sama dengan" },
  { value: "not_equals", label: "tidak sama dengan" },
  { value: "in", label: "termasuk dalam" },
  { value: "not_in", label: "tidak termasuk dalam" },
  { value: "is_truthy", label: "diisi (Ya)" },
  { value: "is_falsy", label: "kosong / Tidak" },
];

const DOMAIN_COLORS = [
  "#5B49C9", "#1D7874", "#E63946", "#F4A261", "#2A9D8F",
  "#E9C46A", "#6D4C7D", "#457B9D", "#2B9348", "#C77DFF",
];

const fieldCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[rgba(124,104,225,0.6)] focus:bg-white/[0.06]";
const labelCls = "mb-1 block text-xs font-semibold text-white/50";

// ── Question type icon ────────────────────────────────────────────────────────
function TypeIcon({ type, className = "size-4" }) {
  const T = QUESTION_TYPES.find((t) => t.value === type)?.icon || HelpCircle;
  return <T className={className} />;
}

// ── Options Editor ────────────────────────────────────────────────────────────
function OptionsEditor({ options = [], onChange }) {
  const addOption = () => {
    onChange([...options, { value: newId().slice(0, 8), label: { id: "", en: "" } }]);
  };
  const updateOpt = (i, field, langOrVal, val) => {
    const next = options.map((o, idx) => {
      if (idx !== i) return o;
      if (field === "value") return { ...o, value: val };
      return { ...o, label: { ...(o.label || {}), [langOrVal]: val } };
    });
    onChange(next);
  };
  const removeOpt = (i) => onChange(options.filter((_, idx) => idx !== i));
  const moveOpt = (i, dir) => {
    const next = [...options];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Pilihan Jawaban</label>
        <button type="button" onClick={addOption}
          className="flex items-center gap-1.5 rounded-full border border-[rgba(124,104,225,0.35)] px-2.5 py-1 text-[11px] text-[#7C68E1] hover:bg-[rgba(124,104,225,0.1)]">
          <Plus className="size-3" /> Tambah pilihan
        </button>
      </div>
      {options.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 py-4 text-center text-xs text-white/30">
          Belum ada pilihan. Klik "+ Tambah pilihan".
        </p>
      )}
      {options.map((opt, i) => (
        <div key={opt.value || i} className="group flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="flex flex-col gap-1 mt-0.5">
            <button type="button" onClick={() => moveOpt(i, -1)} disabled={i === 0}
              className="rounded p-0.5 text-white/25 hover:text-white/60 disabled:opacity-0"><ChevronUp className="size-3.5" /></button>
            <button type="button" onClick={() => moveOpt(i, 1)} disabled={i === options.length - 1}
              className="rounded p-0.5 text-white/25 hover:text-white/60 disabled:opacity-0"><ChevronDown className="size-3.5" /></button>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-0.5 block text-[10px] text-white/30">Value (key)</label>
              <input value={opt.value || ""} onChange={(e) => updateOpt(i, "value", null, e.target.value)}
                className={`${fieldCls} py-1.5 text-xs font-mono`} placeholder="value_key" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-white/30">Label (ID)</label>
              <input value={(opt.label || {}).id || ""} onChange={(e) => updateOpt(i, "label", "id", e.target.value)}
                className={`${fieldCls} py-1.5 text-xs`} placeholder="Label Indonesia" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-white/30">Label (EN)</label>
              <input value={(opt.label || {}).en || ""} onChange={(e) => updateOpt(i, "label", "en", e.target.value)}
                className={`${fieldCls} py-1.5 text-xs`} placeholder="English label" />
            </div>
          </div>
          <button type="button" onClick={() => removeOpt(i)}
            className="mt-1 rounded-lg p-1.5 text-[#ff96aa] opacity-0 hover:bg-[rgba(255,92,122,0.1)] group-hover:opacity-100">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Show-If Builder ───────────────────────────────────────────────────────────
function ShowIfBuilder({ showIf, onChange, allQuestions, currentQId }) {
  const others = allQuestions.filter((q) => q.id !== currentQId);
  const target = showIf?.question_id ? others.find((q) => q.id === showIf.question_id) : null;
  const targetType = target?.type || "";
  const targetOptions = target?.options || [];
  const needsValue = !["is_truthy", "is_falsy"].includes(showIf?.operator);
  const isMultiOp = ["in", "not_in"].includes(showIf?.operator);

  const update = (patch) => onChange(showIf ? { ...showIf, ...patch } : { question_id: "", operator: "equals", value: null, ...patch });
  const clear = () => onChange(null);

  if (!showIf) {
    return (
      <button type="button" onClick={() => onChange({ question_id: others[0]?.id || "", operator: "equals", value: null })}
        className="flex items-center gap-2 rounded-full border border-dashed border-white/15 px-3 py-1.5 text-xs text-white/40 hover:border-[rgba(124,104,225,0.4)] hover:text-[#7C68E1]">
        <Plus className="size-3.5" /> Tambah kondisi tampil (show_if)
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(124,104,225,0.25)] bg-[rgba(124,104,225,0.06)] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#7C68E1]">Tampilkan jika:</span>
        <button type="button" onClick={clear} className="rounded-lg p-1 text-white/30 hover:text-[#ff96aa]"><X className="size-3.5" /></button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {/* Target question */}
        <div>
          <label className={labelCls}>Pertanyaan target</label>
          <select value={showIf.question_id || ""} onChange={(e) => update({ question_id: e.target.value, value: null })}
            className={`${fieldCls} py-2`}>
            <option value="">-- pilih pertanyaan --</option>
            {others.map((q) => (
              <option key={q.id} value={q.id}>{loc(q.text || q.prompt, "id") || q.id}</option>
            ))}
          </select>
        </div>
        {/* Operator */}
        <div>
          <label className={labelCls}>Kondisi</label>
          <select value={showIf.operator || "equals"} onChange={(e) => update({ operator: e.target.value, value: null })}
            className={`${fieldCls} py-2`}>
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Value */}
      {needsValue && target && (
        <div>
          <label className={labelCls}>Nilai</label>
          {(targetType === "select" || targetType === "multiselect") && targetOptions.length > 0 ? (
            isMultiOp ? (
              <div className="flex flex-wrap gap-2">
                {targetOptions.map((opt) => {
                  const vals = Array.isArray(showIf.values) ? showIf.values : [];
                  const checked = vals.includes(opt.value);
                  return (
                    <label key={opt.value} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${ checked ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white" : "border-white/10 text-white/50" }`}>
                      <input type="checkbox" className="sr-only" checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked ? [...vals, opt.value] : vals.filter((v) => v !== opt.value);
                          update({ values: next, value: next });
                        }} />
                      {loc(opt.label, "id") || opt.value}
                    </label>
                  );
                })}
              </div>
            ) : (
              <select value={showIf.value || ""} onChange={(e) => update({ value: e.target.value })}
                className={`${fieldCls} py-2`}>
                <option value="">-- pilih nilai --</option>
                {targetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{loc(opt.label, "id") || opt.value}</option>
                ))}
              </select>
            )
          ) : targetType === "yesno" ? (
            <div className="flex gap-2">
              {[{v: "yes", l: "Ya"}, {v: "no", l: "Tidak"}].map(({v, l}) => (
                <button key={v} type="button" onClick={() => update({ value: v })}
                  className={`rounded-lg border px-4 py-1.5 text-xs ${ showIf.value === v ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white" : "border-white/10 text-white/50" }`}>
                  {l}
                </button>
              ))}
            </div>
          ) : (
            <input value={showIf.value || ""} onChange={(e) => update({ value: e.target.value })}
              className={fieldCls} placeholder="Nilai yang harus cocok..." />
          )}
        </div>
      )}
    </div>
  );
}

// ── Scale Labels ──────────────────────────────────────────────────────────────
function ScaleLabelsEditor({ labels = {}, onChange }) {
  const update = (key, val) => onChange({ ...labels, [key]: val });
  return (
    <div>
      <label className={labelCls}>Label Skala (opsional)</label>
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5].map((n) => (
          <div key={n}>
            <label className="mb-0.5 block text-[10px] text-white/30">{n}</label>
            <input value={labels[String(n)] || ""} onChange={(e) => update(String(n), e.target.value)}
              className={`${fieldCls} py-1.5 text-xs`} placeholder={`Label ${n}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Question Editor Panel ─────────────────────────────────────────────────────
function QuestionEditor({ q, allQuestions, onChange, onClose }) {
  if (!q) return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <BookOpen className="size-8 text-white/15" />
      <p className="text-xs text-white/30">Pilih pertanyaan untuk diedit</p>
    </div>
  );

  const upd = (patch) => onChange({ ...q, ...patch });
  const updText = (lang, val) => upd({ text: { ...(q.text || {}), [lang]: val } });
  const updHint = (lang, val) => upd({ hint: { ...(q.hint || {}), [lang]: val } });
  const hasOptions = q.type === "select" || q.type === "multiselect";
  const isScale = q.type === "scale";

  return (
    <div className="space-y-5 overflow-y-auto pr-1">
      {/* Type selector */}
      <div>
        <label className={labelCls}>Tipe Pertanyaan</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {QUESTION_TYPES.map((t) => {
            const active = q.type === t.value;
            const Icon = t.icon;
            return (
              <button key={t.value} type="button" onClick={() => upd({ type: t.value })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${ active ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white" : "border-white/8 bg-white/[0.02] text-white/40 hover:border-white/18 hover:text-white/70" }`}>
                <Icon className="size-3.5 shrink-0" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question text */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Teks Pertanyaan (ID) <span className="text-[#ff96aa]">*</span></label>
          <textarea value={(q.text || {}).id || ""} onChange={(e) => updText("id", e.target.value)}
            rows={3} className={fieldCls} placeholder="Tulis pertanyaan dalam Bahasa Indonesia..." />
        </div>
        <div>
          <label className={labelCls}>Teks Pertanyaan (EN)</label>
          <textarea value={(q.text || {}).en || ""} onChange={(e) => updText("en", e.target.value)}
            rows={3} className={fieldCls} placeholder="Question text in English..." />
        </div>
      </div>

      {/* Hint */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Hint (ID) <span className="text-white/25">opsional</span></label>
          <input value={(q.hint || {}).id || ""} onChange={(e) => updHint("id", e.target.value)}
            className={fieldCls} placeholder="Teks bantuan (Bahasa Indonesia)..." />
        </div>
        <div>
          <label className={labelCls}>Hint (EN)</label>
          <input value={(q.hint || {}).en || ""} onChange={(e) => updHint("en", e.target.value)}
            className={fieldCls} placeholder="Helper text (English)..." />
        </div>
      </div>

      {/* Options for select/multiselect */}
      {hasOptions && (
        <OptionsEditor
          options={q.options || []}
          onChange={(opts) => upd({ options: opts })}
        />
      )}

      {/* Scale labels */}
      {isScale && (
        <ScaleLabelsEditor
          labels={q.scale_labels || {}}
          onChange={(sl) => upd({ scale_labels: sl })}
        />
      )}

      {/* Show if */}
      <div>
        <label className={`${labelCls} mb-2`}>Logika Kondisional</label>
        <ShowIfBuilder
          showIf={q.show_if || null}
          onChange={(si) => upd({ show_if: si })}
          allQuestions={allQuestions}
          currentQId={q.id}
        />
      </div>

      {/* Required + Weight */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Wajib Diisi</p>
            <p className="text-[11px] text-white/35">Harus dijawab sebelum submit</p>
          </div>
          <Switch checked={q.required !== false} onCheckedChange={(v) => upd({ required: v })} />
        </div>
        <div>
          <label className={labelCls}>Bobot (Weight)</label>
          <input type="number" min={0} max={10} step={0.5} value={q.weight ?? 1}
            onChange={(e) => upd({ weight: parseFloat(e.target.value) || 1 })}
            className={fieldCls} />
        </div>
      </div>
    </div>
  );
}

// ── Domain Item ───────────────────────────────────────────────────────────────
function DomainItem({ domain, active, onClick, onMoveUp, onMoveDown, onDelete, index, total, questionCount }) {
  const title = loc(domain.title, "id") || `Domain ${index + 1}`;
  const color = domain.color || DOMAIN_COLORS[index % DOMAIN_COLORS.length];

  return (
    <div
      onClick={onClick}
      data-testid={`domain-item-${domain.id}`}
      className={`group cursor-pointer rounded-xl border p-3 transition-all ${ active ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.1)]" : "border-white/8 bg-white/[0.02] hover:border-white/18 hover:bg-white/[0.04]" }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm font-semibold ${ active ? "text-white" : "text-white/70" }`}>{title}</p>
          <p className="text-[10px] text-white/35">{questionCount} pertanyaan</p>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}
            className="rounded p-0.5 text-white/30 hover:text-white/70 disabled:opacity-0"><ChevronUp className="size-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1}
            className="rounded p-0.5 text-white/30 hover:text-white/70 disabled:opacity-0"><ChevronDown className="size-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-0.5 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Question Row ──────────────────────────────────────────────────────────────
function QuestionRow({ q, index, active, onClick, onMoveUp, onMoveDown, onDelete, onDuplicate }) {
  const text = loc(q.text || q.prompt, "id") || `Pertanyaan ${index + 1}`;
  const filled = q.type && (loc(q.text || q.prompt, "id") || "").trim().length > 0;
  return (
    <div onClick={onClick} data-testid={`q-row-${q.id}`}
      className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${ active ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.08)]" : "border-white/8 bg-white/[0.02] hover:border-white/18" }`}>
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 rounded-lg border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/30">Q{String(index + 1).padStart(2, "0")}</span>
        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm ${ filled ? (active ? "font-semibold text-white" : "font-medium text-white/80") : "italic text-white/30" }`}>
            {filled ? text : "(belum diisi)"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <TypeIcon type={q.type} className="size-3 text-white/30" />
            <span className="text-[10px] text-white/30">{QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}</span>
            {q.required && <span className="text-[10px] text-[#ff96aa]">*wajib</span>}
            {q.show_if && <span className="text-[10px] text-[#7C68E1]">⬦ kondisional</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}
            className="rounded p-0.5 text-white/30 hover:text-white/70 disabled:opacity-0"><ChevronUp className="size-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={false}
            className="rounded p-0.5 text-white/30 hover:text-white/70"><ChevronDown className="size-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="rounded p-0.5 text-white/30 hover:text-white/60"><Copy className="size-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-0.5 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TemplateEditorV2({ template, onClose, onSaved }) {
  // Template meta
  const [name, setName] = useState(() => ({ id: loc(template?.name, "id") || "", en: loc(template?.name, "en") || "" }));
  const [category, setCategory] = useState(() => template?.description || "");
  const [published, setPublished] = useState(() => template?.published ?? false);

  // Domains = sections
  const [domains, setDomains] = useState(() => {
    const src = template?.domains || template?.sections || [];
    return src.map((d) => ({
      ...d,
      id: d.id || newId(),
      questions: (d.questions || []).map((q) => ({ ...q, id: q.id || newId() })),
    }));
  });

  const [activeDomainIdx, setActiveDomainIdx] = useState(0);
  const [activeQId, setActiveQId] = useState(null);
  const [saving, setSaving] = useState(false);

  const activeDomain = domains[activeDomainIdx] || null;
  const allQuestions = domains.flatMap((d) => d.questions);
  const activeQ = activeDomain ? (activeDomain.questions.find((q) => q.id === activeQId) || null) : null;

  // ── Domain CRUD ────────────────────────────────────────────────────────────
  const addDomain = () => {
    const color = DOMAIN_COLORS[domains.length % DOMAIN_COLORS.length];
    const d = { id: newId(), title: { id: "", en: "" }, description: null, color, questions: [] };
    const next = [...domains, d];
    setDomains(next);
    setActiveDomainIdx(next.length - 1);
    setActiveQId(null);
  };

  const updateDomain = (patch) => {
    setDomains((prev) => prev.map((d, i) => i === activeDomainIdx ? { ...d, ...patch } : d));
  };

  const deleteDomain = (idx) => {
    const next = domains.filter((_, i) => i !== idx);
    setDomains(next);
    setActiveDomainIdx(Math.min(idx, next.length - 1));
    setActiveQId(null);
  };

  const moveDomain = (idx, dir) => {
    const next = [...domains];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setDomains(next);
    setActiveDomainIdx(j);
  };

  // ── Question CRUD ──────────────────────────────────────────────────────────
  const addQuestion = () => {
    if (!activeDomain) return;
    const q = { id: newId(), text: { id: "", en: "" }, type: "text", required: true, weight: 1 };
    setDomains((prev) => prev.map((d, i) => i === activeDomainIdx ? { ...d, questions: [...d.questions, q] } : d));
    setActiveQId(q.id);
  };

  const updateQuestion = useCallback((updated) => {
    setDomains((prev) => prev.map((d, i) => {
      if (i !== activeDomainIdx) return d;
      return { ...d, questions: d.questions.map((q) => q.id === updated.id ? updated : q) };
    }));
  }, [activeDomainIdx]);

  const deleteQuestion = (qId) => {
    setDomains((prev) => prev.map((d, i) => {
      if (i !== activeDomainIdx) return d;
      return { ...d, questions: d.questions.filter((q) => q.id !== qId) };
    }));
    if (activeQId === qId) setActiveQId(null);
  };

  const duplicateQuestion = (qId) => {
    setDomains((prev) => prev.map((d, i) => {
      if (i !== activeDomainIdx) return d;
      const idx = d.questions.findIndex((q) => q.id === qId);
      if (idx < 0) return d;
      const copy = { ...d.questions[idx], id: newId() };
      const qs = [...d.questions];
      qs.splice(idx + 1, 0, copy);
      return { ...d, questions: qs };
    }));
  };

  const moveQuestion = (qId, dir) => {
    setDomains((prev) => prev.map((d, i) => {
      if (i !== activeDomainIdx) return d;
      const idx = d.questions.findIndex((q) => q.id === qId);
      const j = idx + dir;
      if (j < 0 || j >= d.questions.length) return d;
      const qs = [...d.questions];
      [qs[idx], qs[j]] = [qs[j], qs[idx]];
      return { ...d, questions: qs };
    }));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.id.trim()) { toast.error("Nama template (ID) wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = {
        name: { id: name.id.trim(), en: name.en.trim() || name.id.trim() },
        description: category.trim() || null,
        published,
        sections: domains.map((d) => ({
          id: d.id, title: d.title, description: d.description, color: d.color, icon: d.icon,
          questions: d.questions.map((q) => ({
            id: q.id,
            text: q.text || q.prompt || { id: "", en: "" },
            type: q.type,
            options: q.options || null,
            required: q.required !== false,
            weight: q.weight || 1,
            hint: q.hint || null,
            show_if: q.show_if || null,
            scale_labels: q.scale_labels || null,
          })),
        })),
      };
      if (template?.id) {
        await api.put(`/assessment/templates/${template.id}`, payload);
        toast.success("Template diperbarui");
      } else {
        await api.post("/assessment/templates", payload);
        toast.success("Template dibuat");
      }
      onSaved?.();
      onClose();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex max-h-[95vh] w-full max-w-[1200px] flex-col overflow-hidden border-white/10 p-0"
        style={{ background: "#0B0D17", color: "#E8EAF2" }}
        data-testid="template-editor-v2"
      >
        {/* ── Header */}
        <DialogHeader className="shrink-0 border-b border-white/8 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white text-lg">
                {template?.id ? "Edit Template" : "Buat Template Baru"}
              </DialogTitle>
              <p className="text-xs text-white/40">{domains.length} domain · {allQuestions.length} pertanyaan</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Publish</span>
                <Switch checked={published} onCheckedChange={setPublished} data-testid="template-published-switch" />
              </div>
              <button onClick={handleSave} disabled={saving} data-testid="template-save-btn"
                className="flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Simpan
              </button>
              <button onClick={onClose} className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white">
                <X className="size-5" />
              </button>
            </div>
          </div>
          {/* Meta fields */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nama Template (ID) <span className="text-[#ff96aa]">*</span></label>
              <input value={name.id} onChange={(e) => setName((p) => ({ ...p, id: e.target.value }))}
                className={fieldCls} placeholder="Nama template dalam Bahasa Indonesia" data-testid="template-name-id" />
            </div>
            <div>
              <label className={labelCls}>Kategori / Deskripsi</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                className={fieldCls} placeholder="Contoh: IT Maturity" />
            </div>
          </div>
          <div className="mt-2">
            <label className={labelCls}>Nama Template (EN)</label>
            <input value={name.en} onChange={(e) => setName((p) => ({ ...p, en: e.target.value }))}
              className={fieldCls} placeholder="Template name in English (optional)" />
          </div>
        </DialogHeader>

        {/* ── Body: 3-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Col 1: Domain list */}
          <div className="flex w-60 shrink-0 flex-col border-r border-white/8 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between border-b border-white/8 px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Domain</span>
              <button type="button" onClick={addDomain} data-testid="add-domain-btn"
                className="flex items-center gap-1 rounded-full border border-[rgba(124,104,225,0.35)] px-2 py-0.5 text-[11px] text-[#7C68E1] hover:bg-[rgba(124,104,225,0.1)]">
                <Plus className="size-3" /> Tambah
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 p-3">
              {domains.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Layers className="size-7 text-white/15" />
                  <p className="text-[11px] text-white/30">Belum ada domain.<br />Klik "+ Tambah".</p>
                </div>
              )}
              {domains.map((d, idx) => (
                <DomainItem
                  key={d.id} domain={d} index={idx} total={domains.length}
                  questionCount={d.questions.length}
                  active={activeDomainIdx === idx}
                  onClick={() => { setActiveDomainIdx(idx); setActiveQId(null); }}
                  onMoveUp={() => moveDomain(idx, -1)}
                  onMoveDown={() => moveDomain(idx, 1)}
                  onDelete={() => deleteDomain(idx)}
                />
              ))}
            </div>
          </div>

          {/* Col 2: Domain config + Question list */}
          <div className="flex w-72 shrink-0 flex-col border-r border-white/8 overflow-hidden">
            {activeDomain ? (
              <>
                {/* Domain config */}
                <div className="shrink-0 space-y-3 border-b border-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Konfigurasi Domain</p>
                  <div>
                    <label className={labelCls}>Judul (ID)</label>
                    <input value={loc(activeDomain.title, "id")} onChange={(e) => updateDomain({ title: { ...(activeDomain.title || {}), id: e.target.value } })}
                      className={fieldCls} placeholder="Nama domain (ID)" />
                  </div>
                  <div>
                    <label className={labelCls}>Judul (EN)</label>
                    <input value={loc(activeDomain.title, "en")} onChange={(e) => updateDomain({ title: { ...(activeDomain.title || {}), en: e.target.value } })}
                      className={fieldCls} placeholder="Domain title (EN)" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className={labelCls}>Warna Domain</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {DOMAIN_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => updateDomain({ color: c })}
                            className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${ activeDomain.color === c ? "border-white" : "border-transparent" }`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question list */}
                <div className="shrink-0 flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Pertanyaan ({activeDomain.questions.length})
                  </span>
                  <button type="button" onClick={addQuestion} data-testid="add-question-btn"
                    className="flex items-center gap-1 rounded-full border border-[rgba(124,104,225,0.35)] px-2 py-0.5 text-[11px] text-[#7C68E1] hover:bg-[rgba(124,104,225,0.1)]">
                    <Plus className="size-3" /> Tambah
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 p-3">
                  {activeDomain.questions.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <HelpCircle className="size-7 text-white/15" />
                      <p className="text-[11px] text-white/30">Belum ada pertanyaan.<br />Klik "+ Tambah".</p>
                    </div>
                  )}
                  {activeDomain.questions.map((q, qi) => (
                    <QuestionRow
                      key={q.id} q={q} index={qi}
                      active={activeQId === q.id}
                      onClick={() => setActiveQId(q.id)}
                      onMoveUp={() => moveQuestion(q.id, -1)}
                      onMoveDown={() => moveQuestion(q.id, 1)}
                      onDelete={() => deleteQuestion(q.id)}
                      onDuplicate={() => duplicateQuestion(q.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 flex-1 px-6 text-center">
                <Layers className="size-8 text-white/15" />
                <p className="text-xs text-white/30">Pilih atau buat domain di panel kiri</p>
              </div>
            )}
          </div>

          {/* Col 3: Question detail editor */}
          <div className="flex-1 min-w-0 overflow-y-auto p-5">
            {activeQ ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Detail Pertanyaan</p>
                  <button type="button" onClick={() => setActiveQId(null)} className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.05] hover:text-white/70">
                    <X className="size-4" />
                  </button>
                </div>
                <QuestionEditor
                  q={activeQ}
                  allQuestions={allQuestions}
                  onChange={updateQuestion}
                  onClose={() => setActiveQId(null)}
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Settings2 className="size-10 text-white/10" />
                <p className="text-sm text-white/25">Pilih pertanyaan dari panel tengah untuk mengedit detail, opsi, kondisi, dan hint.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
