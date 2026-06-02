import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ClipboardList, CheckCircle2, Clock, AlertCircle, Play, Sparkles } from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { loc } from "@/features/assessment/assessmentApi";
import { AIReportDialog } from "./components/AIReportDialog";

const statusCfg = {
  draft: { label: "Belum Dimulai", color: "text-white/50", bg: "bg-white/[0.05] border-white/10", icon: Clock },
  submitted: { label: "Selesai", color: "text-[#73D1AD]", bg: "bg-[rgba(115,209,173,0.12)] border-[rgba(115,209,173,0.3)]", icon: CheckCircle2 },
};

export default function ClientAssessments() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith("en") ? "en" : "id";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiReportDialog, setAiReportDialog] = useState({ open: false, sessionId: null });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/assessment/my");
      setItems(res.data?.data || []);
    } catch (err) {
      setError(apiError(err, "Gagal memuat daftar assessment"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const origin = window.location.origin;

  return (
    <div data-testid="client-assessments-page">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">Assessment Saya</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">Daftar assessment yang perlu Anda isi</p>
      </div>

      {loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={load} /> : (
        <>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] py-20">
              <ClipboardList className="size-12 text-white/20" />
              <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada assessment yang di-assign ke Anda.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const cfg = statusCfg[item.status] || statusCfg.draft;
                const Icon = cfg.icon;
                const percent = item.progress?.percent || 0;
                return (
                  <div key={item.id} data-testid={`assessment-card-${item.id}`} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl hover:border-white/20 transition-colors">
                    {/* Status badge */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="size-3.5" />{cfg.label}
                      </span>
                      {item.due_date && (
                        <span className="text-xs text-[color:var(--kti-text-dim)]">
                          Tenggat: {new Date(item.due_date).toLocaleDateString("id")}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-white">
                      {item.template_name ? loc(item.template_name, lang) : "Assessment"}
                    </h3>
                    {item.project_name && (
                      <p className="mt-0.5 text-sm text-[color:var(--kti-text-dim)]">{item.project_name}</p>
                    )}

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[color:var(--kti-text-dim)]">Progress</span>
                        <span className="font-medium text-white">{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7C68E1] to-[#73D1AD] transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    {/* Description */}
                    {item.template_description && (
                      <p className="mt-3 text-xs text-[color:var(--kti-text-dim)] line-clamp-2">
                        {loc(item.template_description, lang)}
                      </p>
                    )}

                    {/* Action */}
                    <div className="mt-4 flex gap-2">
                      {item.status === "submitted" ? (
                        <div className="flex flex-1 flex-wrap gap-2">
                          <a
                            href={`/api/assessment/${item.token}/export?locale=${lang}`}
                            target="_blank" rel="noreferrer"
                            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] py-2.5 text-sm text-white/70 hover:bg-white/[0.08]"
                            data-testid={`download-pdf-${item.id}`}
                          >
                            Unduh PDF
                          </a>
                          <button
                            onClick={() => setAiReportDialog({ open: true, sessionId: item.id })}
                            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.25)]"
                            data-testid={`ai-report-${item.id}`}
                          >
                            <Sparkles className="size-4" />
                            AI Report
                          </button>
                          <button
                            onClick={() => navigate(`/portal/assessments/${item.id}`)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.08]"
                            data-testid={`review-assessment-${item.id}`}
                          >
                            Review
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/portal/assessments/${item.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.25)]"
                          data-testid={`start-assessment-${item.id}`}
                        >
                          <Play className="size-4" />
                          {percent > 0 ? "Lanjutkan" : "Mulai Isi"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AIReportDialog
        open={aiReportDialog.open}
        onOpenChange={(open) => setAiReportDialog({ open, sessionId: null })}
        sessionId={aiReportDialog.sessionId}
        locale={lang}
      />
    </div>
  );
}
