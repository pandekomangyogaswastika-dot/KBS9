/**
 * SessionDetailModal — Admin view: full session responses + AI report generator.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  X, Loader2, FileText, Sparkles, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Paperclip, RefreshCw, Clock,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView } from "@/components/StateViews";

const loc = (val, lang = "id") => {
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

function renderAnswerText(q, ans) {
  if (!ans) return <span className="italic text-white/25">Belum diisi</span>;
  if (ans.skipped) return <span className="italic text-[rgba(255,180,60,0.7)]">Dilewati</span>;
  const val = ans.value;
  const type = normalizeType(q.type || "");
  const opts = Object.fromEntries((q.options || []).map((o) => [o.value, o]));
  if (val === null || val === undefined || val === "") return <span className="italic text-white/25">Belum diisi</span>;
  if (type === "yes_no" || type === "yesno") {
    if (val === true || val === "yes") return <span className="text-[#73D1AD] font-semibold">Ya</span>;
    if (val === false || val === "no") return <span className="text-[#ff96aa] font-semibold">Tidak</span>;
  }
  if (type === "single_choice") {
    const opt = opts[val];
    return <span className="font-medium text-white">{opt ? loc(opt.label) : String(val)}</span>;
  }
  if (type === "multi_choice") {
    if (!Array.isArray(val) || !val.length) return <span className="italic text-white/25">Belum diisi</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {val.map((v) => {
          const opt = opts[v];
          return <span key={v} className="rounded-full border border-[rgba(124,104,225,0.35)] bg-[rgba(124,104,225,0.1)] px-2.5 py-0.5 text-xs text-white">{opt ? loc(opt.label) : String(v)}</span>;
        })}
      </div>
    );
  }
  if (type === "scale_1_5") return <span className="font-bold text-[#7C68E1]">{val} / 5</span>;
  return <span className="text-white">{String(val)}</span>;
}

function AnswerCard({ q, ans, index, lang = "id", attachments = [] }) {
  const filled = ans && !ans.skipped && ans.value !== null && ans.value !== undefined && ans.value !== "";
  const prompt = loc(q.prompt || q.text, lang);
  return (
    <div className={`rounded-xl border p-4 ${ filled ? "border-white/12 bg-white/[0.03]" : "border-white/6 bg-white/[0.01]" }`}>
      <div className="mb-2 flex items-start gap-2">
        <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/40">Q{String(index).padStart(2, "0")}</span>
        <p className={`text-xs leading-snug ${ q.required ? "font-semibold text-white/80" : "text-white/60" }`}>
          {prompt}{q.required && <span className="ml-1 text-[#ff96aa]">*</span>}
        </p>
      </div>
      <div className="ml-7 text-sm">{renderAnswerText(q, ans)}</div>
      {ans?.note && <p className="ml-7 mt-1.5 text-xs text-white/40 italic">📝 {ans.note}</p>}
      {attachments.length > 0 && (
        <div className="ml-7 mt-2 flex flex-wrap gap-1.5">
          {attachments.map((att) => (
            <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/50 hover:text-white">
              <Paperclip className="size-2.5" /> {att.filename}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function AIReportSection({ sessionId, initialReport }) {
  const [report, setReport] = useState(initialReport);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/assessment/sessions/${sessionId}/generate-report`);
      setReport(res.data?.data);
      toast.success("Laporan AI berhasil digenerate!");
    } catch (err) { toast.error(apiError(err)); }
    finally { setGenerating(false); }
  };

  const content = report?.content || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#7C68E1]" />
          <h3 className="font-semibold text-white">Laporan AI</h3>
          {report?.generated_at && (
            <span className="text-[11px] text-white/35 flex items-center gap-1">
              <Clock className="size-3" /> {new Date(report.generated_at).toLocaleString("id")}
            </span>
          )}
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.1)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.2)] disabled:opacity-60">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {report ? "Regenerate" : "Generate Laporan AI"}
        </button>
      </div>

      {generating && (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(124,104,225,0.2)] bg-[rgba(124,104,225,0.06)] px-5 py-4">
          <Loader2 className="size-5 animate-spin text-[#7C68E1]" />
          <div>
            <p className="font-medium text-white">Menganalisis jawaban…</p>
            <p className="text-xs text-white/40">Claude sedang memproses. Biasanya 15-30 detik.</p>
          </div>
        </div>
      )}

      {!report && !generating && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-10">
          <Sparkles className="size-8 text-white/20" />
          <p className="text-sm text-white/40">Klik tombol di atas untuk generate laporan AI dari jawaban assessment.</p>
        </div>
      )}

      {report && !generating && (
        <div className="space-y-4">
          {/* Executive Summary */}
          {content.executive_summary && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7C68E1]">Ringkasan Eksekutif</h4>
              <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{content.executive_summary}</p>
            </div>
          )}

          {/* Key Insights */}
          {content.key_insights?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7C68E1]">Temuan Kunci</h4>
              <ul className="space-y-2">
                {content.key_insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 shrink-0 text-[#7C68E1]">&#x2022;</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {content.recommendations?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7C68E1]">Rekomendasi</h4>
              <div className="space-y-3">
                {content.recommendations.map((rec, i) => {
                  const pColor = { high: "text-[#ff96aa] border-[rgba(255,92,122,0.3)] bg-[rgba(255,92,122,0.08)]", medium: "text-[rgba(255,180,60,0.9)] border-[rgba(255,180,60,0.3)] bg-[rgba(255,180,60,0.06)]", low: "text-[#73D1AD] border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.06)]" }[rec.priority?.toLowerCase()] || "text-white/50 border-white/10 bg-white/[0.03]";
                  const pLabel = { high: "Tinggi", medium: "Sedang", low: "Rendah" }[rec.priority?.toLowerCase()] || rec.priority;
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${pColor}`}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${pColor}`}>{pLabel}</span>
                        <span className="font-semibold text-white text-sm">{rec.title}</span>
                      </div>
                      {rec.description && <p className="text-xs text-white/60">{rec.description}</p>}
                      {rec.expected_impact && <p className="mt-1 text-[11px] text-white/40">🎯 {rec.expected_impact}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {content.risk_assessment?.risks?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7C68E1]">Risiko</h4>
              <div className="space-y-2">
                {content.risk_assessment.risks.map((risk, i) => {
                  const sColor = { high: "text-[#ff96aa]", medium: "text-[rgba(255,180,60,0.9)]", low: "text-[#73D1AD]" }[risk.severity?.toLowerCase()] || "text-white/50";
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-white/8 p-3">
                      <AlertTriangle className={`size-4 shrink-0 mt-0.5 ${sColor}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{risk.risk}</p>
                        {risk.impact && <p className="text-xs text-white/50">{risk.impact}</p>}
                        {risk.mitigation && <p className="mt-1 text-[11px] text-[#73D1AD]">→ {risk.mitigation}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {content.opportunities?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7C68E1]">Peluang</h4>
              <div className="space-y-2">
                {content.opportunities.map((opp, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-white/8 p-3">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-[#73D1AD]" />
                    <div>
                      <p className="text-sm font-semibold text-white">{opp.opportunity}</p>
                      {opp.description && <p className="text-xs text-white/50">{opp.description}</p>}
                      {opp.timeline && <p className="mt-1 text-[11px] text-white/35">⏱ {opp.timeline}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionDetailModal({ sessionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("responses"); // responses | report

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [detailRes, reportRes] = await Promise.all([
        api.get(`/assessment/sessions/${sessionId}/detail`),
        api.get(`/assessment/sessions/${sessionId}/report`),
      ]);
      setData(detailRes.data?.data);
      setReport(reportRes.data?.data);
    } catch (err) { toast.error(apiError(err)); }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const template = data?.template;
  const answersMap = data?.answers_map || {};
  const attachmentsByQ = data?.attachments_by_question || {};
  const progress = data?.progress;
  const domains = template ? (template.domains || template.sections || []) : [];

  return (
    <Dialog open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden flex flex-col border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-white">
            {loading ? "Memuat…" : data ? `${data.client_name} — ${loc(template?.name)}` : "Detail Sesi"}
          </DialogTitle>
          {data && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className={`inline-flex items-center gap-1.5 text-xs ${ data.status === "submitted" ? "text-[#73D1AD]" : "text-white/50" }`}>
                <span className={`size-1.5 rounded-full ${ data.status === "submitted" ? "bg-[#73D1AD]" : "bg-white/30" }`} />
                {data.status === "submitted" ? "Submitted" : "Draft"}
              </span>
              <span className="text-xs text-white/40">{progress?.answered || 0}/{progress?.total || 0} terjawab · {progress?.percent || 0}%</span>
              {data.project_name && <span className="text-xs text-white/40">{data.project_name}</span>}
              {data.status === "submitted" && (
                <a href={`/api/assessment/${data.token}/export`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1 text-xs text-white/60 hover:text-white">
                  <FileText className="size-3" /> Unduh PDF
                </a>
              )}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10"><LoadingView /></div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit shrink-0">
              <button onClick={() => setActiveTab("responses")} data-testid="tab-responses"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${ activeTab === "responses" ? "bg-white/[0.09] text-white border border-white/12" : "text-white/40 hover:text-white" }`}>
                Jawaban
              </button>
              {data?.status === "submitted" && (
                <button onClick={() => setActiveTab("report")} data-testid="tab-ai-report"
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${ activeTab === "report" ? "bg-white/[0.09] text-white border border-white/12" : "text-white/40 hover:text-white" }`}>
                  <Sparkles className="size-3.5" /> Laporan AI
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === "responses" && (
                <Accordion type="multiple" defaultValue={domains.map((d) => d.id)} className="space-y-3">
                  {domains.map((d, di) => {
                    const dp = (progress?.domains || []).find((x) => x.domain_id === d.id);
                    const visibleQs = (d.questions || []).filter((q) => {
                      // Simple visibility — show all in admin view
                      return true;
                    });
                    return (
                      <AccordionItem key={d.id || di} value={d.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <AccordionTrigger className="px-5 py-3.5 hover:no-underline hover:bg-white/[0.03]">
                          <div className="flex w-full items-center justify-between gap-3 pr-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-white/40">D{di + 1}</span>
                              <span className="font-semibold text-white text-sm">{loc(d.title)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                                <div className="h-full rounded-full bg-[#7C68E1]" style={{ width: `${dp?.percent || 0}%` }} />
                              </div>
                              <span className="text-xs text-white/35">{dp?.answered || 0}/{dp?.total || visibleQs.length}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 px-5 pb-5">
                          {visibleQs.map((q, qi) => (
                            <AnswerCard key={q.id} q={q} ans={answersMap[q.id]} index={qi + 1}
                              attachments={attachmentsByQ[q.id] || []} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}

              {activeTab === "report" && (
                <AIReportSection sessionId={sessionId} initialReport={report} />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
