import { useState } from "react";
import { ProgressRing } from "./ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { filterVisibleQuestions } from "@/utils/assessmentBranching";
import { Download, CheckCircle2, Lock, ChevronLeft, FileCheck, AlertTriangle, Send } from "lucide-react";

const OTHER_VALUE = "__other__";

const loc = (obj, lang = "id") => {
  if (typeof obj === "string") return obj;
  return obj?.[lang] || obj?.id || obj?.en || "";
};

const formatAnswer = (q, ans, lang = "id") => {
  if (!ans) return { kind: "empty", text: "Belum dijawab" };
  if (ans.skipped) return { kind: "skipped", text: "Dilewati" };
  const otherText = (ans.other_text || "").trim();
  const otherLabel = otherText ? `Lainnya: ${otherText}` : "Lainnya (belum diisi)";
  if (
    ans.value === null ||
    ans.value === "" ||
    (Array.isArray(ans.value) && ans.value.length === 0)
  ) {
    return { kind: "empty", text: "Belum dijawab" };
  }
  const prompt = loc(q.prompt || q.text, lang);
  if (q.type === "single_choice") {
    if (ans.value === OTHER_VALUE) return { kind: "answered", text: otherLabel };
    const opt = q.options?.find((x) => x.value === ans.value);
    return { kind: "answered", text: opt?.label || String(ans.value) };
  }
  if (q.type === "multi_choice") {
    const arr = Array.isArray(ans.value) ? ans.value : [];
    const labels = arr.map((v) =>
      v === OTHER_VALUE
        ? otherLabel
        : q.options?.find((x) => x.value === v)?.label || v
    );
    return { kind: "answered", text: labels.join(" • ") };
  }
  if (q.type === "yes_no")
    return {
      kind: "answered",
      text: ans.value === true ? "Ya" : ans.value === false ? "Tidak" : String(ans.value),
    };
  if (q.type === "scale_1_5") {
    const label = q.scale_labels?.[String(ans.value)];
    return { kind: "answered", text: `${ans.value}/5${label ? `  —  ${label}` : ""}` };
  }
  return { kind: "answered", text: String(ans.value) };
};

export const AssessmentSummary = ({
  session,
  template,
  domains,
  answersMap,
  attachmentsByQuestion,
  progress,
  isLocked,
  lang = "id",
  onBack,
  onSubmit,
  onExportPdf,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const overallPercent = progress?.percent || 0;
  const totalAnswered = progress?.answered || 0;
  const totalQ = progress?.total || 0;
  const allAnswered = totalAnswered === totalQ && totalQ > 0;

  const progressMap = {};
  (progress?.domains || []).forEach((p) => { progressMap[p.domain_id] = p; });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        data-testid="summary-back"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--kti-text-dim)] transition-colors hover:text-white"
      >
        <ChevronLeft size={14} /> Kembali ke Dashboard
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(124,104,225,0.12)] via-white/[0.02] to-[rgba(115,209,173,0.07)] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Badge className="mb-2 border-0 bg-[rgba(124,104,225,0.2)] text-[10px] font-bold uppercase tracking-widest text-[color:var(--kti-indigo)]">
              <FileCheck size={11} className="mr-1" /> Ringkasan Pengisian
            </Badge>
            <h2 className="mb-1 text-2xl font-bold text-white">Ringkasan Jawaban &amp; Submit Final</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--kti-text-dim)]">
              Cek kembali jawaban Anda di bawah. Tombol <strong className="text-white">Submit Final</strong> akan
              mengunci jawaban — setelah submit, Anda tidak bisa mengubah lagi.
              PDF bisa di-export kapan saja.
            </p>
          </div>
          <ProgressRing percent={overallPercent} size={96} stroke={8} testId="summary-progress-ring" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              data-testid="summary-export-pdf"
              variant="outline"
              size="sm"
              className="border-[rgba(115,209,173,0.35)] text-[color:var(--kti-teal)] hover:bg-[rgba(115,209,173,0.1)]"
            >
              <Download size={14} className="mr-1.5" /> Export PDF
            </Button>
          )}

          {!isLocked ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-testid="summary-submit-trigger"
                  disabled={totalAnswered === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-40"
                >
                  <CheckCircle2 size={14} /> Submit Final
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md rounded-2xl border border-white/10 bg-[#0D0F1A]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold text-white">
                    Kunci jawaban &amp; kirim?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-[color:var(--kti-text-dim)]">
                    Setelah submit, jawaban tidak bisa diubah lagi.
                    <br /><br />
                    {!allAnswered ? (
                      <span className="inline-flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-400">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Masih ada <strong>{totalQ - totalAnswered}</strong> pertanyaan belum dijawab.
                          Tetap bisa di-submit dan akan tampil sebagai "Belum dijawab" di laporan.
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-start gap-2 rounded-lg border border-[rgba(115,209,173,0.2)] bg-[rgba(115,209,173,0.1)] p-3 text-xs text-[color:var(--kti-teal)]">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        <span>Semua pertanyaan sudah dijawab. Siap submit!</span>
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-testid="summary-submit-cancel"
                    className="rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  >
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="summary-submit-confirm"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : (
                      <><Send size={14} /> Ya, Submit Final</>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Badge className="border-0 bg-[rgba(115,209,173,0.15)] text-sm font-semibold text-[color:var(--kti-teal)]">
              <Lock size={12} className="mr-1" /> Sudah ter-submit
            </Badge>
          )}
        </div>
      </div>

      {/* Per-domain answer review */}
      <div className="space-y-4">
        {domains.map((d) => {
          const dp = progressMap[d.id] || { answered: 0, total: d.questions?.length || 0, percent: 0 };
          const visibleQs = filterVisibleQuestions(d, answersMap);
          return (
            <div
              key={d.id}
              data-testid={`summary-domain-${d.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--kti-text-faint)]">
                    Domain {String(d.number || "").padStart(2, "0")}
                  </p>
                  <h3 className="text-base font-semibold text-white">{loc(d.title, lang)}</h3>
                </div>
                <Badge className="border-0 bg-[rgba(124,104,225,0.15)] text-xs font-semibold text-[color:var(--kti-indigo)]">
                  {dp.answered}/{dp.total} terjawab
                </Badge>
              </div>

              <ul className="space-y-3">
                {visibleQs.map((q, idx) => {
                  const ans = answersMap[q.id];
                  const r = formatAnswer(q, ans, lang);
                  const qAtts = attachmentsByQuestion?.[q.id] || [];
                  const note = (ans?.note || "").trim();
                  return (
                    <li key={q.id} className="grid gap-1 sm:grid-cols-[1fr_2fr] sm:gap-3 sm:items-start">
                      <div className="text-sm font-medium text-[color:var(--kti-text-dim)]">
                        <span className="mr-1 font-mono text-[10px] text-[color:var(--kti-text-faint)]">
                          Q{String(idx + 1).padStart(2, "0")}
                        </span>
                        {loc(q.prompt || q.text, lang)}
                      </div>
                      <div>
                        <div
                          className={
                            r.kind === "answered"
                              ? "text-sm text-[color:var(--kti-teal)]"
                              : r.kind === "skipped"
                              ? "text-sm italic text-yellow-400"
                              : "text-sm italic text-[color:var(--kti-text-faint)]"
                          }
                        >
                          {r.text}
                        </div>
                        {note && (
                          <div
                            data-testid={`summary-note-${q.id}`}
                            className="mt-1 rounded-md border-l-2 border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.08)] px-2 py-1 text-xs italic text-[color:var(--kti-text-dim)]"
                          >
                            <span className="font-semibold not-italic text-[color:var(--kti-indigo)]">Catatan: </span>
                            {note}
                          </div>
                        )}
                        {qAtts.length > 0 && (
                          <div
                            className="mt-1.5 flex flex-wrap gap-1 text-[11px]"
                            data-testid={`summary-attachments-${q.id}`}
                          >
                            {qAtts.map((a) => (
                              <Badge
                                key={a.id}
                                variant="outline"
                                className="border-white/10 bg-white/[0.04] font-normal text-[color:var(--kti-text-dim)]"
                              >
                                {a.original_name || a.filename}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
