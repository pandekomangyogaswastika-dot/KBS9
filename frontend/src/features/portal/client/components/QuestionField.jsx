import { useState } from "react";
import { HelpButton } from "./HelpButton";
import { AttachmentUploader } from "./AttachmentUploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, SkipForward, Eraser, StickyNote, X } from "lucide-react";

const toArray = (val) => (Array.isArray(val) ? val : []);
const OTHER_VALUE = "__other__";

const SkipPill = ({ active, onToggle, locked, testId }) => (
  <button
    type="button"
    data-testid={testId}
    disabled={locked}
    onClick={onToggle}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
      active
        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
        : "border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] hover:border-white/20 hover:text-white"
    }`}
  >
    <SkipForward size={12} />
    {active ? "Dilewati" : "Lewati"}
  </button>
);

const ScaleSelector = ({ value, onChange, labels = {}, disabled, testIdBase }) => {
  const numbers = [1, 2, 3, 4, 5];
  const currentLabel = value ? labels[String(value)] : null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {numbers.map((n) => {
          const active = String(value) === String(n);
          return (
            <button
              key={n}
              type="button"
              data-testid={`${testIdBase}-scale-${n}`}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`flex h-12 min-w-[3rem] flex-col items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.2)] text-white shadow-md"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              <span>{n}</span>
              {labels[String(n)] ? (
                <span className={`mt-0.5 text-[10px] font-medium ${active ? "text-white/85" : "text-[color:var(--kti-text-faint)]"}`}>
                  {n === 1 ? "min" : n === 5 ? "max" : ""}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {labels && (labels["1"] || labels["3"] || labels["5"]) ? (
        <div className="flex justify-between text-[11px] text-[color:var(--kti-text-dim)]">
          <span>1 — {labels["1"] || ""}</span>
          <span className="text-center">{labels["3"] ? `3 — ${labels["3"]}` : ""}</span>
          <span>5 — {labels["5"] || ""}</span>
        </div>
      ) : null}
      {currentLabel ? (
        <p data-testid={`${testIdBase}-scale-feedback`} className="text-xs italic text-[color:var(--kti-teal)]">
          Pilihan Anda: <span className="font-semibold">{value}/5 — {currentLabel}</span>
        </p>
      ) : null}
    </div>
  );
};

export const QuestionField = ({
  index,
  question,
  answer,
  onChange,
  onOtherChange,
  onNoteChange,
  onSkip,
  onClear,
  locked = false,
  sessionId,
  attachments = [],
  onAttachmentUploaded,
  onAttachmentDeleted,
  lang = "id",
}) => {
  const skipped = answer?.skipped === true;
  const hasValue = answer && !skipped && answer.value !== null && answer.value !== "" && !(Array.isArray(answer.value) && answer.value.length === 0);
  const [touched, setTouched] = useState(false);
  const [showNote, setShowNote] = useState(() => Boolean(answer?.note));
  const testIdBase = `question-${question.id}`;

  const loc = (obj) => {
    if (typeof obj === "string") return obj;
    return obj?.[lang] || obj?.id || obj?.en || "";
  };

  const renderOtherInput = () => (
    <Input
      data-testid={`${testIdBase}-other-input`}
      value={answer?.other_text ?? ""}
      onChange={(e) => onOtherChange?.(e.target.value)}
      onBlur={() => setTouched(true)}
      disabled={locked}
      placeholder="Tulis pilihan Anda sendiri…"
      className="border-yellow-500/30 bg-yellow-500/5 focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
    />
  );

  const renderInput = () => {
    if (skipped) {
      return (
        <div className="rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/5 px-4 py-3 text-sm italic text-yellow-400">
          Pertanyaan ini ditandai "dilewati". Klik tombol Lewati lagi untuk mengisi.
        </div>
      );
    }
    switch (question.type) {
      case "single_choice": {
        const isOther = answer?.value === OTHER_VALUE;
        return (
          <div className="space-y-3">
            <RadioGroup
              data-testid={`${testIdBase}-radio`}
              value={answer?.value ?? ""}
              onValueChange={(v) => onChange(v)}
              disabled={locked}
              className="grid gap-2"
            >
              {question.options?.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`${question.id}-${opt.value}`}
                  data-testid={`${testIdBase}-opt-${opt.value}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all hover:border-white/20 hover:bg-white/[0.04] ${
                    answer?.value === opt.value
                      ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white shadow-md"
                      : "border-white/10 bg-white/[0.02] text-[color:var(--kti-text-dim)]"
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} className="shrink-0" />
                  <span className="flex-1 leading-snug">{opt.label}</span>
                </Label>
              ))}
              <Label
                htmlFor={`${question.id}-${OTHER_VALUE}`}
                data-testid={`${testIdBase}-opt-other`}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-all hover:border-white/20 hover:bg-white/[0.04] ${
                  isOther
                    ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white shadow-md"
                    : "border-white/10 bg-white/[0.02] text-[color:var(--kti-text-dim)]"
                }`}
              >
                <RadioGroupItem value={OTHER_VALUE} id={`${question.id}-${OTHER_VALUE}`} className="shrink-0" />
                <span className="flex-1 leading-snug">Lainnya…</span>
              </Label>
            </RadioGroup>
            {isOther ? renderOtherInput() : null}
          </div>
        );
      }

      case "multi_choice": {
        const arrVal = toArray(answer?.value);
        const max = question.max_select;
        const selectedReal = arrVal.filter((v) => v !== OTHER_VALUE);
        const otherChecked = arrVal.includes(OTHER_VALUE);
        return (
          <div className="space-y-2">
            {max ? (
              <p className="text-xs text-[color:var(--kti-text-dim)]">
                Maks {max} pilihan. Terpilih: <span className="font-semibold text-[color:var(--kti-teal)]">{selectedReal.length}/{max}</span>
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options?.map((opt) => {
                const checked = arrVal.includes(opt.value);
                const reachedMax = max && selectedReal.length >= max && !checked;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`${question.id}-${opt.value}`}
                    data-testid={`${testIdBase}-opt-${opt.value}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-all ${
                      reachedMax ? "cursor-not-allowed opacity-50" : "hover:border-white/20 hover:bg-white/[0.04]"
                    } ${
                      checked
                        ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white shadow-md"
                        : "border-white/10 bg-white/[0.02] text-[color:var(--kti-text-dim)]"
                    }`}
                  >
                    <Checkbox
                      id={`${question.id}-${opt.value}`}
                      checked={checked}
                      disabled={locked || reachedMax}
                      onCheckedChange={(c) => {
                        const next = c ? [...arrVal, opt.value] : arrVal.filter((v) => v !== opt.value);
                        onChange(next);
                      }}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="flex-1 leading-snug">{opt.label}</span>
                  </Label>
                );
              })}
              <Label
                htmlFor={`${question.id}-${OTHER_VALUE}`}
                data-testid={`${testIdBase}-opt-other`}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-all hover:border-white/20 hover:bg-white/[0.04] ${
                  otherChecked
                    ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] text-white shadow-md"
                    : "border-white/10 bg-white/[0.02] text-[color:var(--kti-text-dim)]"
                }`}
              >
                <Checkbox
                  id={`${question.id}-${OTHER_VALUE}`}
                  checked={otherChecked}
                  disabled={locked}
                  onCheckedChange={(c) => {
                    const next = c ? [...arrVal, OTHER_VALUE] : arrVal.filter((v) => v !== OTHER_VALUE);
                    onChange(next);
                  }}
                  className="mt-0.5 shrink-0"
                />
                <span className="flex-1 leading-snug">Lainnya…</span>
              </Label>
            </div>
            {otherChecked ? renderOtherInput() : null}
          </div>
        );
      }

      case "yes_no":
        return (
          <RadioGroup
            data-testid={`${testIdBase}-yesno`}
            value={answer?.value === true ? "yes" : answer?.value === false ? "no" : ""}
            onValueChange={(v) => onChange(v === "yes")}
            disabled={locked}
            className="flex flex-wrap gap-2"
          >
            {[
              { v: "yes", label: "Ya" },
              { v: "no", label: "Tidak" },
            ].map((opt) => {
              const active = (opt.v === "yes" && answer?.value === true) || (opt.v === "no" && answer?.value === false);
              return (
                <Label
                  key={opt.v}
                  htmlFor={`${question.id}-${opt.v}`}
                  data-testid={`${testIdBase}-yesno-${opt.v}`}
                  className={`flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/[0.04] ${
                    active
                      ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.2)] text-white shadow-md"
                      : "border-white/10 bg-white/[0.02] text-[color:var(--kti-text-dim)]"
                  }`}
                >
                  <RadioGroupItem value={opt.v} id={`${question.id}-${opt.v}`} className="sr-only" />
                  {opt.label}
                </Label>
              );
            })}
          </RadioGroup>
        );

      case "scale_1_5":
        return (
          <ScaleSelector
            value={answer?.value}
            onChange={onChange}
            labels={question.scale_labels || {}}
            disabled={locked}
            testIdBase={testIdBase}
          />
        );

      case "text_short":
        return (
          <Input
            data-testid={`${testIdBase}-input`}
            value={answer?.value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={locked}
            placeholder="Tulis jawaban Anda..."
            className="border-white/10 focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
          />
        );

      case "text_long":
        return (
          <Textarea
            data-testid={`${testIdBase}-textarea`}
            value={answer?.value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={locked}
            placeholder="Tulis jawaban Anda di sini..."
            rows={4}
            className="border-white/10 focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            data-testid={`${testIdBase}-number`}
            value={answer?.value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            onBlur={() => setTouched(true)}
            disabled={locked}
            placeholder="Isi angka..."
            className="border-white/10 focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
          />
        );

      default:
        return <p className="text-sm italic text-[color:var(--kti-text-dim)]">Tipe pertanyaan tidak dikenal: {question.type}</p>;
    }
  };

  return (
    <div
      data-testid={`${testIdBase}-card`}
      className={`rounded-2xl border bg-white/[0.04] p-5 backdrop-blur-xl transition-all ${
        hasValue
          ? "border-[rgba(115,209,173,0.5)] shadow-lg"
          : skipped
          ? "border-yellow-500/40"
          : "border-white/10 hover:border-white/15"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.15)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--kti-indigo)]"
            >
              Q{String(index).padStart(2, "0")} · {question.id}
            </Badge>
            {hasValue ? (
              <Badge className="border-0 bg-[rgba(115,209,173,0.15)] text-[10px] font-semibold text-[color:var(--kti-teal)]">
                <Check size={11} className="mr-1" /> Terisi
              </Badge>
            ) : null}
          </div>
          <p className="text-[15px] font-semibold leading-snug text-white">
            {loc(question.prompt || question.text)}
          </p>
        </div>
        <HelpButton helpText={loc(question.help || question.hint)} testId={`${testIdBase}-help`} />
      </div>

      <div className="mt-4">{renderInput()}</div>

      {!skipped ? (
        <div className="mt-3" data-testid={`${testIdBase}-note-section`}>
          {showNote || answer?.note ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--kti-text-dim)]">
                  <StickyNote size={12} /> Catatan tambahan (opsional)
                </Label>
                {!answer?.note ? (
                  <button
                    type="button"
                    data-testid={`${testIdBase}-note-close`}
                    onClick={() => setShowNote(false)}
                    disabled={locked}
                    className="text-[color:var(--kti-text-dim)] transition-colors hover:text-red-400 disabled:opacity-50"
                    aria-label="Tutup catatan"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>
              <Textarea
                data-testid={`${testIdBase}-note`}
                value={answer?.note ?? ""}
                onChange={(e) => onNoteChange?.(e.target.value)}
                disabled={locked}
                rows={2}
                placeholder="Tambahkan konteks, asumsi, atau penjelasan tambahan…"
                className="border-white/10 bg-white/[0.02] text-sm focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
              />
            </div>
          ) : (
            <button
              type="button"
              data-testid={`${testIdBase}-add-note`}
              onClick={() => setShowNote(true)}
              disabled={locked}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-medium text-[color:var(--kti-text-dim)] transition-all hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <StickyNote size={12} /> Tambah catatan
            </button>
          )}
        </div>
      ) : null}

      {sessionId ? (
        <AttachmentUploader
          sessionId={sessionId}
          questionId={question.id}
          attachments={attachments}
          locked={locked}
          onUploaded={onAttachmentUploaded}
          onDeleted={onAttachmentDeleted}
        />
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
        <p className="text-[11px] text-[color:var(--kti-text-dim)]">
          {touched ? <em>Tersimpan otomatis</em> : <span>Boleh diisi nanti atau dilewati</span>}
        </p>
        <div className="flex items-center gap-2">
          {hasValue && !skipped ? (
            <button
              type="button"
              data-testid={`${testIdBase}-clear`}
              disabled={locked}
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-medium text-[color:var(--kti-text-dim)] transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              <Eraser size={12} /> Hapus
            </button>
          ) : null}
          <SkipPill active={skipped} onToggle={onSkip} locked={locked} testId={`${testIdBase}-skip`} />
        </div>
      </div>
    </div>
  );
};
