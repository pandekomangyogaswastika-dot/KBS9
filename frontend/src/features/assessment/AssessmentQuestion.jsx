import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, Trash2, HelpCircle, MessageSquarePlus, Loader2, Check } from "lucide-react";
import { OTHER, loc } from "@/features/assessment/assessmentApi";
import { ASSESS } from "@/constants/testIds";

const pill = "kti-focus rounded-xl border px-4 py-2.5 text-sm text-left transition-colors";
const pillOn = "border-[rgba(124,104,225,0.7)] bg-[rgba(124,104,225,0.18)] text-white";
const pillOff = "border-white/12 bg-white/[0.03] text-[color:var(--kti-text-dim)] hover:bg-white/[0.06]";
const inputCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30";

export default function AssessmentQuestion({ index, question, answer, lang, locked, onChange, attachments, onUpload, onDeleteAttachment }) {
  const { t } = useTranslation();
  const [showNote, setShowNote] = useState(!!answer?.note);
  const [showHelp, setShowHelp] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const a = answer || { value: null, skipped: false, other_text: "", note: "" };
  const update = (patch) => onChange({ ...a, ...patch });
  const opts = question.options || [];
  const type = question.type;

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try { await onUpload(f); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  let control = null;
  // Handle both old types (single_choice, multi_choice, yes_no, text_long) and
  // normalized types from TemplateEditorV2 (select, multiselect, yesno, textarea)
  if (type === "single_choice" || type === "select") {
    control = (
      <div className="grid gap-2 sm:grid-cols-2">
        {opts.map((o) => (
          <button key={o.value} type="button" disabled={locked} data-testid={`assessment-option-${question.id}-${o.value}`}
            onClick={() => update({ value: o.value, skipped: false })}
            className={`${pill} ${a.value === o.value ? pillOn : pillOff}`}>{loc(o.label, lang)}</button>
        ))}
      </div>
    );
  } else if (type === "multi_choice" || type === "multiselect") {
    const arr = Array.isArray(a.value) ? a.value : [];
    const toggle = (v) => {
      let next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
      if (question.max_select && next.length > question.max_select) return;
      update({ value: next, skipped: false });
    };
    control = (
      <div>
        {question.max_select ? <p className="mb-2 text-xs text-[color:var(--kti-text-faint)]">{t("assess.maxSelect", { n: question.max_select })}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {opts.map((o) => (
            <button key={o.value} type="button" disabled={locked} data-testid={`assessment-option-${question.id}-${o.value}`}
              onClick={() => toggle(o.value)}
              className={`${pill} flex items-center justify-between gap-2 ${arr.includes(o.value) ? pillOn : pillOff}`}>
              <span>{loc(o.label, lang)}</span>{arr.includes(o.value) ? <Check className="size-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (type === "yes_no" || type === "yesno") {
    control = (
      <div className="flex gap-2">
        <button type="button" disabled={locked} data-testid={`assessment-option-${question.id}-yes`} onClick={() => update({ value: true, skipped: false })} className={`${pill} flex-1 text-center ${a.value === true ? pillOn : pillOff}`}>{t("assess.yes")}</button>
        <button type="button" disabled={locked} data-testid={`assessment-option-${question.id}-no`} onClick={() => update({ value: false, skipped: false })} className={`${pill} flex-1 text-center ${a.value === false ? pillOn : pillOff}`}>{t("assess.no")}</button>
      </div>
    );
  } else if (type === "scale_1_5" || type === "scale") {
    control = (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" disabled={locked} data-testid={`assessment-option-${question.id}-${n}`} onClick={() => update({ value: n, skipped: false })} className={`${pill} flex-1 text-center ${a.value === n ? pillOn : pillOff}`}>{n}</button>
        ))}
      </div>
    );
  } else if (type === "number") {
    control = <input type="number" disabled={locked} value={a.value ?? ""} onChange={(e) => update({ value: e.target.value === "" ? null : Number(e.target.value), skipped: false })} className={inputCls} />;
  } else if (type === "text_long" || type === "textarea") {
    control = <textarea rows={3} disabled={locked} value={a.value ?? ""} onChange={(e) => update({ value: e.target.value, skipped: false })} className={inputCls} />;
  } else {
    // Default: text input (handles "text", "date", and any unknown types)
    control = <input disabled={locked} value={a.value ?? ""} onChange={(e) => update({ value: e.target.value, skipped: false })} className={inputCls} />;
  }

  const showOther = (type === "single_choice" || type === "select") && a.value === OTHER ||
    (type === "multi_choice" || type === "multiselect") && Array.isArray(a.value) && a.value.includes(OTHER);

  return (
    <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.035] p-5" data-testid={ASSESS.question} id={`q-${question.id}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-relaxed text-white"><span className="text-[color:var(--kti-text-faint)]">{index}. </span>{loc(question.text || question.prompt, lang)}</p>
        {loc(question.help, lang) ? (
          <button type="button" onClick={() => setShowHelp((s) => !s)} className="kti-focus shrink-0 text-white/40 hover:text-white" aria-label="help"><HelpCircle className="size-4" /></button>
        ) : null}
      </div>
      {showHelp && loc(question.help, lang) ? <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[color:var(--kti-text-dim)]">{loc(question.help, lang)}</p> : null}

      <div className={a.skipped ? "pointer-events-none opacity-40" : ""}>{control}</div>

      {showOther ? (
        <input disabled={locked} value={a.other_text || ""} onChange={(e) => update({ other_text: e.target.value })} placeholder={t("assess.otherPh")} data-testid={ASSESS.otherInput} className={`${inputCls} mt-2`} />
      ) : null}

      {showNote ? (
        <textarea rows={2} disabled={locked} value={a.note || ""} onChange={(e) => update({ note: e.target.value })} placeholder={t("assess.notePh")} data-testid={ASSESS.noteInput} className={`${inputCls} mt-3`} />
      ) : null}

      {/* attachments */}
      {(attachments && attachments.length > 0) ? (
        <ul className="mt-3 space-y-1.5">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-white/80"><Paperclip className="size-3.5 shrink-0" /><span className="truncate">{att.original_name}</span></span>
              {!locked ? <button type="button" onClick={() => onDeleteAttachment(att.id)} className="kti-focus shrink-0 text-[#ff96aa] hover:opacity-80"><Trash2 className="size-3.5" /></button> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!locked ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="kti-focus inline-flex items-center gap-1.5 text-[color:var(--kti-text-dim)] hover:text-white">
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />} {t("assess.addFile")}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx" className="hidden" data-testid={`${ASSESS.attachInput}-${question.id}`} onChange={handleFile} />
          <button type="button" onClick={() => setShowNote((s) => !s)} className="kti-focus inline-flex items-center gap-1.5 text-[color:var(--kti-text-dim)] hover:text-white"><MessageSquarePlus className="size-3.5" /> {t("assess.addNote")}</button>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[color:var(--kti-text-dim)]">
            <input type="checkbox" checked={!!a.skipped} onChange={(e) => update({ skipped: e.target.checked })} data-testid={`${ASSESS.skipToggle}-${question.id}`} className="size-3.5 accent-[#7C68E1]" /> {t("assess.skip")}
          </label>
        </div>
      ) : null}
    </div>
  );
}
