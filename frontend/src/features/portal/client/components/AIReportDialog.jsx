import { useState } from "react";
import { Sparkles, Loader2, ChevronRight, AlertCircle, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/apiClient";
import { toast } from "sonner";

export const AIReportDialog = ({ open, onOpenChange, sessionId, locale = "id" }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await api.post(`/assessment/sessions/${sessionId}/generate-report?locale=${locale}`);
      setReport(res.data?.data);
      toast.success(locale === "en" ? "AI Report generated successfully" : "AI Report berhasil di-generate");
    } catch (err) {
      const errMsg = apiError(err, locale === "en" ? "Failed to generate AI report" : "Gagal generate AI report");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReport(null);
    setError(null);
    onOpenChange(false);
  };

  const downloadPDFWithAI = () => {
    const url = `/api/assessment/${sessionId}/export?locale=${locale}&include_ai=true`;
    window.open(url, "_blank");
    toast.success(locale === "en" ? "Downloading PDF with AI insights..." : "Mengunduh PDF dengan AI insights...");
  };

  const MaturityBadge = ({ score, label }) => {
    const colors = {
      1: "bg-red-500/20 text-red-400 border-red-500/30",
      2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      3: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      4: "bg-green-500/20 text-green-400 border-green-500/30",
      5: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    const colorClass = colors[score] || colors[3];
    return (
      <Badge className={`${colorClass} border text-xs font-semibold`}>
        {score}/5 — {label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0D0F1A]"
        data-testid="ai-report-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="size-5 text-[color:var(--kti-indigo)]" />
            {locale === "en" ? "AI Analysis Report" : "Laporan Analisis AI"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[color:var(--kti-text-dim)]">
            {locale === "en"
              ? "AI-powered insights generated using Claude 3.5 Sonnet"
              : "Wawasan bertenaga AI menggunakan Claude 3.5 Sonnet"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {!report && !loading && !error && (
            <div className="text-center py-8">
              <Sparkles className="mx-auto size-12 text-[color:var(--kti-indigo)] opacity-60" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {locale === "en" ? "Generate AI Insights" : "Generate Wawasan AI"}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--kti-text-dim)]">
                {locale === "en"
                  ? "Click the button below to analyze your assessment responses with AI"
                  : "Klik tombol di bawah untuk menganalisis jawaban assessment Anda dengan AI"}
              </p>
              <Button
                onClick={generateReport}
                data-testid="generate-ai-report-button"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-6 py-3 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
              >
                <Sparkles className="size-4" />
                {locale === "en" ? "Generate AI Report" : "Generate Laporan AI"}
              </Button>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto size-10 animate-spin text-[color:var(--kti-indigo)]" />
              <p className="mt-4 text-sm text-[color:var(--kti-text-dim)]">
                {locale === "en" ? "Analyzing your responses..." : "Menganalisis jawaban Anda..."}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kti-text-faint)]">
                {locale === "en" ? "This may take 30-60 seconds" : "Ini mungkin memerlukan waktu 30-60 detik"}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-red-400">
                    {locale === "en" ? "Error" : "Error"}
                  </p>
                  <p className="text-sm text-red-300">{error}</p>
                  <Button
                    onClick={generateReport}
                    size="sm"
                    className="mt-3 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
                  >
                    {locale === "en" ? "Try Again" : "Coba Lagi"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {report && (
            <div className="space-y-6">
              {/* Overall Summary */}
              {report.overall_summary?.summary && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--kti-indigo)]">
                    {locale === "en" ? "Executive Summary" : "Ringkasan Eksekutif"}
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
                    {report.overall_summary.summary}
                  </p>
                </div>
              )}

              {/* Key Findings */}
              {report.overall_summary?.key_findings && report.overall_summary.key_findings.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--kti-teal)]">
                    {locale === "en" ? "Key Findings" : "Temuan Kunci"}
                  </h3>
                  <ul className="space-y-2">
                    {report.overall_summary.key_findings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--kti-teal)]" />
                        <span className="text-sm text-white">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Domain Insights */}
              {report.domain_insights && report.domain_insights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--kti-text-dim)]">
                    {locale === "en" ? "Domain Analysis" : "Analisis Per Domain"}
                  </h3>
                  {report.domain_insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
                      data-testid={`domain-insight-${idx}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-base font-semibold text-white">{insight.domain}</h4>
                        {insight.maturity_score && (
                          <MaturityBadge score={insight.maturity_score} label={insight.maturity_label} />
                        )}
                      </div>

                      {/* Strengths */}
                      {insight.strengths && insight.strengths.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400">
                            <TrendingUp className="size-3.5" />
                            {locale === "en" ? "Strengths" : "Kekuatan"}
                          </p>
                          <ul className="space-y-1">
                            {insight.strengths.map((strength, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                <span className="text-green-400">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {insight.concerns && insight.concerns.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                            <AlertTriangle className="size-3.5" />
                            {locale === "en" ? "Areas for Improvement" : "Area Perbaikan"}
                          </p>
                          <ul className="space-y-1">
                            {insight.concerns.map((concern, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                <span className="text-yellow-400">⚠</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-indigo)]">
                            <Lightbulb className="size-3.5" />
                            {locale === "en" ? "Recommendations" : "Rekomendasi"}
                          </p>
                          <ul className="space-y-1">
                            {insight.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-[color:var(--kti-indigo)]" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Next Steps */}
              {report.overall_summary?.next_steps && report.overall_summary.next_steps.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--kti-indigo)]">
                    {locale === "en" ? "Strategic Next Steps" : "Langkah Strategis Selanjutnya"}
                  </h3>
                  <ol className="space-y-2">
                    {report.overall_summary.next_steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.15)] text-xs font-semibold text-white">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-white">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 border-t border-white/10 pt-4">
                <Button
                  onClick={downloadPDFWithAI}
                  data-testid="download-pdf-with-ai"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.22)] px-5 py-3 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.32)]"
                >
                  <Sparkles className="size-4" />
                  {locale === "en" ? "Download PDF with AI Insights" : "Unduh PDF dengan AI Insights"}
                </Button>
                <Button
                  onClick={handleClose}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white hover:bg-white/[0.08]"
                >
                  {locale === "en" ? "Close" : "Tutup"}
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-xs text-[color:var(--kti-text-faint)] italic">
                {locale === "en"
                  ? "AI analysis should be reviewed by qualified professionals"
                  : "Analisis AI sebaiknya ditinjau oleh profesional yang berkualifikasi"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
