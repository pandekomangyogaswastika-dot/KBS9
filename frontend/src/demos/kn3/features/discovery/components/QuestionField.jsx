import { useState } from "react";
import { HelpButton } from "./HelpButton";
import { AttachmentUploader } from "./AttachmentUploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        ? "border-discovery-warn bg-discovery-warn/10 text-discovery-warn"
        : "border-discovery-border bg-white text-discovery-muted hover:border-discovery-primary hover:text-discovery-primary"
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
                  ? "border-discovery-primary bg-discovery-primary text-white shadow-discovery"
                  : "border-discovery-border bg-white text-discovery-text hover:border-discovery-primary hover:bg-discovery-soft"
              }`}
            >
              <span>{n}</span>
              {labels[String(n)] ? (
                <span className={`mt-0.5 text-[10px] font-medium ${active ? "text-white/85" : "text-discovery-muted"}`}>
                  {n === 1 ? "min" : n === 5 ? "max" : ""}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {labels && (labels["1"] || labels["3"] || labels["5"]) ? (
        <div className="flex justify-between text-[11px] text-discovery-muted">
          <span>1 — {labels["1"] || ""}</span>
          <span className="text-center">{labels["3"] ? `3 — ${labels["3"]}` : ""}</span>
          <span>5 — {labels["5"] || ""}</span>
        </div>
      ) : null}
      {currentLabel ? (
        <p data-testid={`${testIdBase}-scale-feedback`} className="text-xs italic text-discovery-primary">
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
}) => {
  const skipped = answer?.skipped === true;
  const hasValue = answer && !skipped && answer.value !== null && answer.value !== "" && !(Array.isArray(answer.value) && answer.value.length === 0);
  const [touched, setTouched] = useState(false);
  const [showNote, setShowNote] = useState(() => Boolean(answer?.note));
  const testIdBase = `question-${question.id}`;

  const renderOtherInput = () => (
    <Input
      data-testid={`${testIdBase}-other-input`}
      value={answer?.other_text ?? ""}
      onChange={(e) => onOtherChange?.(e.target.value)}
      onBlur={() => setTouched(true)}
      disabled={locked}
      placeholder="Tulis pilihan Anda sendiri…"
      className="border-discovery-warn/50 bg-discovery-warn/5 focus:border-discovery-primary focus-visible:ring-discovery-primary/30"
    />
  );

  const renderInput = () => {
    if (skipped) {
      return (
        <div className="rounded-lg border border-dashed border-discovery-warn/60 bg-discovery-warn/5 px-4 py-3 text-sm italic text-discovery-warn">
          Pertanyaan ini ditandai “dilewati”. Klik tombol Lewati lagi untuk mengisi.
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
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all hover:border-discovery-primary hover:bg-discovery-soft ${
                    answer?.value === opt.value
                      ? "border-discovery-primary bg-discovery-soft text-discovery-primary shadow-discovery"
                      : "border-discovery-border bg-white text-discovery-text"
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} className="shrink-0" />
                  <span className="flex-1 leading-snug">{opt.label}</span>
                </Label>
              ))}
              <Label
                htmlFor={`${question.id}-${OTHER_VALUE}`}
                data-testid={`${testIdBase}-opt-other`}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-all hover:border-discovery-primary hover:bg-discovery-soft ${
                  isOther
                    ? "border-discovery-primary bg-discovery-soft text-discovery-primary shadow-discovery"
                    : "border-discovery-border bg-white text-discovery-text"
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
              <p className="text-xs text-discovery-muted">
                Maks {max} pilihan. Terpilih: <span className="font-semibold text-discovery-primary">{selectedReal.length}/{max}</span>
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
                      reachedMax ? "cursor-not-allowed opacity-50" : "hover:border-discovery-primary hover:bg-discovery-soft"
                    } ${
                      checked
                        ? "border-discovery-primary bg-discovery-soft text-discovery-primary shadow-discovery"
                        : "border-discovery-border bg-white text-discovery-text"
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
                className={`flex cursor-pointer items-start gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-all hover:border-discovery-primary hover:bg-discovery-soft ${
                  otherChecked
                    ? "border-discovery-primary bg-discovery-soft text-discovery-primary shadow-discovery"
                    : "border-discovery-border bg-white text-discovery-text"
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
                  className={`flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-all hover:border-discovery-primary hover:bg-discovery-soft ${
                    active
                      ? "border-discovery-primary bg-discovery-primary text-white shadow-discovery"
                      : "border-discovery-border bg-white text-discovery-text"
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
            data-testid={`${testIdBase}-input"`}
            value={answer?.value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={locked}
            placeholder="Tulis jawaban Anda..."
            className="border-discovery-border focus:border-discovery-primary focus-visible:ring-discovery-primary/30"
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
            placeholder="Tulis jawaban Anda di sini... (opsional)"
            rows={4}
            className="border-discovery-border focus:border-discovery-primary focus-visible:ring-discovery-primary/30"
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
            className="border-discovery-border focus:border-discovery-primary focus-visible:ring-discovery-primary/30"
          />
        );

      default:
        return <p className="text-sm italic text-discovery-muted">Tipe pertanyaan tidak dikenal: {question.type}</p>;
    }
  };

  return (
    <div
      data-testid={`${testIdBase}-card`}
      className={`rounded-2xl border bg-white p-5 transition-all ${
        hasValue
          ? "border-discovery-accent/50 shadow-discovery"
          : skipped
          ? "border-discovery-warn/40"
          : "border-discovery-border hover:border-discovery-primary/40"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-discovery-primary/20 bg-discovery-soft text-[10px] font-bold uppercase tracking-wider text-discovery-primary"
            >
              Q{String(index).padStart(2, "0")} · {question.id}
            </Badge>
            {hasValue ? (
              <Badge className="border-0 bg-discovery-accent/10 text-[10px] font-semibold text-discovery-accent">
                <Check size={11} className="mr-1" /> Terisi
              </Badge>
            ) : null}
          </div>
          <p className="text-[15px] font-semibold leading-snug text-discovery-text">
            {question.prompt}
          </p>
        </div>
        <HelpButton helpText={question.help} testId={`${testIdBase}-help`} />
      </div>

      <div className="mt-4">{renderInput()}</div>

      {!skipped ? (
        <div className="mt-3" data-testid={`${testIdBase}-note-section`}>
          {showNote || answer?.note ? (
            <div className="rounded-lg border border-discovery-border bg-discovery-bg/40 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-discovery-muted">
                  <StickyNote size={12} /> Catatan tambahan (opsional)
                </Label>
                {!answer?.note ? (
                  <button
                    type="button"
                    data-testid={`${testIdBase}-note-close`}
                    onClick={() => setShowNote(false)}
                    disabled={locked}
                    className="text-discovery-muted transition-colors hover:text-discovery-danger disabled:opacity-50"
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
                className="border-discovery-border bg-white text-sm focus:border-discovery-primary focus-visible:ring-discovery-primary/30"
              />
            </div>
          ) : (
            <button
              type="button"
              data-testid={`${testIdBase}-add-note`}
              onClick={() => setShowNote(true)}
              disabled={locked}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-discovery-border bg-white px-3 py-1 text-xs font-medium text-discovery-muted transition-all hover:border-discovery-primary hover:text-discovery-primary disabled:opacity-50"
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

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-discovery-border pt-3">
        <p className="text-[11px] text-discovery-muted">
          {touched ? <em>Tersimpan otomatis</em> : <span>Boleh diisi nanti atau dilewati</span>}
        </p>
        <div className="flex items-center gap-2">
          {hasValue && !skipped ? (
            <button
              type="button"
              data-testid={`${testIdBase}-clear`}
              disabled={locked}
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-discovery-border bg-white px-3 py-1 text-xs font-medium text-discovery-muted transition-all hover:border-discovery-danger hover:text-discovery-danger disabled:opacity-50"
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
