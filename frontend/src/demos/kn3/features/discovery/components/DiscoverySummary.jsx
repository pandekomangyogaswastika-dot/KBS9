import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./ProgressRing";
import { filterVisibleQuestions } from "../branching";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Download, CheckCircle2, Lock, ChevronLeft, FileCheck, AlertTriangle } from "lucide-react";

const OTHER_VALUE = "__other__";

const formatAnswer = (q, ans) => {
  if (!ans) return { kind: "empty", text: "Belum dijawab" };
  if (ans.skipped) return { kind: "skipped", text: "Dilewati klien" };
  const otherText = (ans.other_text || "").trim();
  const otherLabel = otherText ? `Lainnya: ${otherText}` : "Lainnya (belum diisi)";
  if (ans.value === null || ans.value === "" || (Array.isArray(ans.value) && ans.value.length === 0)) {
    return { kind: "empty", text: "Belum dijawab" };
  }
  if (q.type === "single_choice") {
    if (ans.value === OTHER_VALUE) return { kind: "answered", text: otherLabel };
    const o = q.options?.find((x) => x.value === ans.value);
    return { kind: "answered", text: o?.label || String(ans.value) };
  }
  if (q.type === "multi_choice") {
    const arr = Array.isArray(ans.value) ? ans.value : [];
    const labels = arr.map((v) => (v === OTHER_VALUE ? otherLabel : (q.options?.find((x) => x.value === v)?.label || v)));
    return { kind: "answered", text: labels.join(" • ") };
  }
  if (q.type === "yes_no") return { kind: "answered", text: ans.value === true ? "Ya" : ans.value === false ? "Tidak" : String(ans.value) };
  if (q.type === "scale_1_5") {
    const label = q.scale_labels?.[String(ans.value)];
    return { kind: "answered", text: `${ans.value}/5${label ? `  —  ${label}` : ""}` };
  }
  return { kind: "answered", text: String(ans.value) };
};

export const DiscoverySummary = ({
  session, domains, answersMap, progress, locked,
  onBack, onSubmit, onExportPdf,
  attachmentsByQuestion = {},
}) => {
  const [submitting, setSubmitting] = useState(false);
  const overallPercent = progress.percent;
  const allAnswered = progress.answered === progress.total;
  const progressMap = {};
  progress.domains.forEach((p) => { progressMap[p.domain_id] = p; });

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onSubmit(); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        data-testid="summary-back"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-discovery-muted transition-colors hover:text-discovery-primary"
      >
        <ChevronLeft size={14} /> Kembali ke Dashboard
      </button>

      <Card className="border-discovery-border bg-gradient-to-br from-discovery-soft via-white to-white p-6 shadow-discovery">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Badge className="mb-2 border-0 bg-discovery-primary/10 text-[10px] font-bold uppercase tracking-widest text-discovery-primary">
              <FileCheck size={11} className="mr-1" /> Ringkasan Pengisian
            </Badge>
            <h2 className="mb-1 text-2xl font-bold text-discovery-text">Ringkasan Jawaban &amp; Submit Final</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-discovery-muted">
              Cek kembali jawaban Anda di bawah. Tombol <strong>Submit Final</strong> akan mengunci jawaban
              — setelah submit, Anda tidak bisa mengubah jawaban lagi. PDF bisa di-export kapan saja, bahkan tanpa submit.
            </p>
          </div>
          <ProgressRing percent={overallPercent} size={96} stroke={8} testId="summary-progress-ring" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            data-testid="summary-export-pdf"
            onClick={onExportPdf}
            variant="outline"
            className="border-discovery-accent/50 text-discovery-accent hover:border-discovery-accent hover:bg-discovery-accent/10"
          >
            <Download size={14} className="mr-1.5" /> Export PDF
          </Button>
          {!locked ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-testid="summary-submit-trigger"
                  disabled={progress.answered === 0}
                  className="bg-discovery-primary text-white hover:bg-discovery-primary-hover disabled:opacity-50"
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Submit Final
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-discovery-border bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-discovery-text">Kunci jawaban &amp; kirim ke vendor?</AlertDialogTitle>
                  <AlertDialogDescription className="text-discovery-muted">
                    Setelah submit, jawaban tidak bisa diubah lagi. Anda masih bisa mengisi sekarang jika ada
                    yang kurang.<br /><br />
                    {!allAnswered ? (
                      <span className="inline-flex items-start gap-2 rounded-lg bg-discovery-warn/10 p-3 text-xs text-discovery-warn">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Anda masih punya <strong>{progress.total - progress.answered}</strong> pertanyaan belum dijawab.
                          Ini tetap bisa di-submit dan akan ditampilkan sebagai “Belum dijawab” di PDF.
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-start gap-2 rounded-lg bg-discovery-success/10 p-3 text-xs text-discovery-success">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        <span>Semua pertanyaan sudah dijawab. Siap submit!</span>
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="summary-submit-cancel">Batal</AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="summary-submit-confirm"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
                  >
                    {submitting ? "Mengirim…" : "Ya, Submit Final"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Badge className="border-0 bg-discovery-success/15 text-xs font-semibold text-discovery-success">
              <Lock size={11} className="mr-1" /> Sudah ter-submit — tidak bisa diubah
            </Badge>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {domains.map((d) => {
          const dp = progressMap[d.id] || { answered: 0, total: d.questions.length, percent: 0 };
          const visibleQs = filterVisibleQuestions(d, answersMap);
          return (
            <Card key={d.id} data-testid={`summary-domain-${d.id}`} className="border-discovery-border bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-discovery-border pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-discovery-muted">
                    Domain {String(d.number).padStart(2, "0")}
                  </p>
                  <h3 className="text-base font-semibold text-discovery-text">{d.title}</h3>
                </div>
                <Badge className="border-0 bg-discovery-soft text-xs font-semibold text-discovery-primary">
                  {dp.answered}/{dp.total} terjawab
                </Badge>
              </div>
              <ul className="space-y-3">
                {visibleQs.map((q, idx) => {
                  const ans = answersMap[q.id];
                  const r = formatAnswer(q, ans);
                  const qAtts = attachmentsByQuestion[q.id] || [];
                  const note = (ans?.note || "").trim();
                  return (
                    <li key={q.id} className="grid gap-1 sm:grid-cols-[1fr_2fr] sm:gap-3 sm:items-start">
                      <div className="text-sm font-medium text-discovery-text">
                        <span className="mr-1 font-mono text-[10px] text-discovery-muted">Q{String(idx + 1).padStart(2, "0")}</span>
                        {q.prompt}
                      </div>
                      <div>
                        <div
                          className={
                            r.kind === "answered"
                              ? "text-sm text-discovery-success"
                              : r.kind === "skipped"
                              ? "text-sm italic text-discovery-warn"
                              : "text-sm italic text-discovery-muted"
                          }
                        >
                          {r.text}
                        </div>
                        {note ? (
                          <div
                            data-testid={`summary-note-${q.id}`}
                            className="mt-1 rounded-md border-l-2 border-discovery-primary/40 bg-discovery-soft/60 px-2 py-1 text-xs italic text-discovery-muted"
                          >
                            <span className="font-semibold not-italic text-discovery-primary">Catatan: </span>
                            {note}
                          </div>
                        ) : null}
                        {qAtts.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]" data-testid={`summary-attachments-${q.id}`}>
                            {qAtts.map((a) => (
                              <Badge
                                key={a.id}
                                variant="outline"
                                className="border-discovery-accent/30 bg-discovery-accent/5 font-normal text-discovery-accent"
                              >
                                {a.original_name}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
