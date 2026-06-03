import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Send, Loader2, Clock, CheckCircle2,
  LayoutDashboard, FileText, Download,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { DomainNavigator } from "./components/DomainNavigator";
import { AssessmentProgress } from "./components/AssessmentProgress";
import { QuestionField } from "./components/QuestionField";
import { AssessmentDashboard } from "./components/AssessmentDashboard";
import { AssessmentSummary } from "./components/AssessmentSummary";
import { filterVisibleQuestions } from "@/utils/assessmentBranching";

const loc = (obj, lang = "id") => {
  if (typeof obj === "string") return obj;
  return obj?.[lang] || obj?.id || obj?.en || "";
};

// View modes: "dashboard" | "domain" | "summary"
const VIEWS = { DASHBOARD: "dashboard", DOMAIN: "domain", SUMMARY: "summary" };

export default function AssessmentTaking() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "id";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [template, setTemplate] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [attachmentsByQuestion, setAttachmentsByQuestion] = useState({});
  const [progress, setProgress] = useState(null);

  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [changedAnswers, setChangedAnswers] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const saveTimerRef = useRef(null);
  // pendingRef: always holds the latest changed answers without stale-closure risk
  const pendingRef = useRef({});

  const isLocked = session?.status === "submitted";

  const loadSessionDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/assessment/sessions/${sessionId}/detail`);
      const data = res.data?.data;
      if (!data) throw new Error("Session tidak ditemukan");
      setSession(data);
      setTemplate(data.template);
      setAnswersMap(data.answers_map || {});
      setAttachmentsByQuestion(data.attachments_by_question || {});
      setProgress(data.progress);
    } catch (err) {
      setError(apiError(err, "Gagal memuat session"));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { loadSessionDetail(); }, [loadSessionDetail]);

  // Auto-save (debounced 700ms) — reads pendingRef.current to avoid stale-closure data loss
  useEffect(() => {
    if (!isDirty || isLocked) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const snapshot = { ...pendingRef.current };           // capture at fire time
      if (Object.keys(snapshot).length === 0) { setIsDirty(false); return; }
      setSaving(true);
      try {
        await api.patch(`/assessment/sessions/${sessionId}/answers`, Object.values(snapshot));
        // Remove only the keys we just saved (new answers may have arrived during the await)
        pendingRef.current = Object.fromEntries(
          Object.entries(pendingRef.current).filter(([k]) => !(k in snapshot))
        );
        setChangedAnswers({ ...pendingRef.current });
        setIsDirty(Object.keys(pendingRef.current).length > 0);
        setLastSavedTime(new Date());
      } catch (err) {
        toast.error(apiError(err, "Gagal menyimpan jawaban"));
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [isDirty, changedAnswers, sessionId, isLocked]);

  const domains = useMemo(() => {
    if (!template) return [];
    return template.domains || template.sections || [];
  }, [template]);

  const currentDomain = useMemo(() => domains[currentDomainIndex], [domains, currentDomainIndex]);

  const visibleQuestions = useMemo(() => {
    if (!currentDomain) return [];
    return filterVisibleQuestions(currentDomain, answersMap);
  }, [currentDomain, answersMap]);

  const domainsWithProgress = useMemo(() => {
    if (!progress?.domains) return domains;
    const pMap = {};
    progress.domains.forEach((p) => { pMap[p.domain_id || p.id] = p; });
    return domains.map((d) => ({
      ...d,
      progress: pMap[d.id] || { answered: 0, total: d.questions?.length || 0, percent: 0, status: "not_started" },
    }));
  }, [domains, progress]);

  const handleAnswerChange = useCallback((questionId, value, options = {}) => {
    const newAnswer = {
      question_id: questionId,
      value,
      skipped: options.skipped || false,
      other_text: options.other_text ?? answersMap[questionId]?.other_text ?? null,
      note: options.note ?? answersMap[questionId]?.note ?? null,
    };
    setAnswersMap((prev) => ({ ...prev, [questionId]: newAnswer }));
    // Sync pendingRef BEFORE state update — ensures timeout callback reads the latest data
    pendingRef.current = { ...pendingRef.current, [questionId]: newAnswer };
    setChangedAnswers({ ...pendingRef.current });
    setIsDirty(true);
  }, [answersMap]);

  const handleOtherChange = useCallback((questionId, otherText) => {
    const ans = answersMap[questionId] || {};
    handleAnswerChange(questionId, ans.value, { ...ans, other_text: otherText });
  }, [answersMap, handleAnswerChange]);

  const handleNoteChange = useCallback((questionId, note) => {
    const ans = answersMap[questionId] || {};
    handleAnswerChange(questionId, ans.value, { ...ans, note });
  }, [answersMap, handleAnswerChange]);

  const handleSkip = useCallback((questionId) => {
    const ans = answersMap[questionId] || {};
    handleAnswerChange(questionId, ans.skipped ? ans.value : null, { skipped: !ans.skipped });
  }, [answersMap, handleAnswerChange]);

  const handleClear = useCallback((questionId) => {
    handleAnswerChange(questionId, null, { skipped: false, other_text: null, note: answersMap[questionId]?.note || null });
  }, [answersMap, handleAnswerChange]);

  const handleAttachmentUploaded = useCallback((att) => {
    setAttachmentsByQuestion((prev) => ({ ...prev, [att.question_id]: [...(prev[att.question_id] || []), att] }));
  }, []);

  const handleAttachmentDeleted = useCallback((attachmentId) => {
    setAttachmentsByQuestion((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((qid) => { updated[qid] = updated[qid].filter((a) => a.id !== attachmentId); });
      return updated;
    });
  }, []);

  // Force-save pending + submit
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      // Flush any pending answers before submit using pendingRef (not stale closure)
      const pending = pendingRef.current;
      if (Object.keys(pending).length > 0) {
        await api.patch(`/assessment/sessions/${sessionId}/answers`, Object.values(pending));
        pendingRef.current = {};
        setChangedAnswers({});
        setIsDirty(false);
      }
      await api.post(`/assessment/sessions/${sessionId}/submit`);
      toast.success("Assessment berhasil disubmit!");
      await loadSessionDetail();
      setView(VIEWS.DASHBOARD);
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || "Gagal submit");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, loadSessionDetail]);

  const handleExportPdf = useCallback(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
    const token = localStorage.getItem("kti_token");
    const url = `${backendUrl}/api/assessment/sessions/${sessionId}/detail`;
    // Use the export endpoint
    const exportUrl = `${backendUrl}/api/assessment/${session?.token || sessionId}/export`;
    window.open(exportUrl, "_blank");
  }, [sessionId, session]);

  const openDomain = (idx) => {
    setCurrentDomainIndex(idx);
    setView(VIEWS.DOMAIN);
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadSessionDetail} />;
  if (!session || !template) return <ErrorView message="Session tidak ditemukan" />;

  return (
    <div className="min-h-screen" data-testid="assessment-taking-page">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#05060A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/portal/assessments")}
              data-testid="back-to-list"
              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white">{loc(template.name, lang)}</h1>
              <p className="text-xs text-[color:var(--kti-text-faint)]">
                {session.client_name} · {session.project_name || "—"}
              </p>
            </div>
          </div>

          {/* View tabs */}
          <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:flex">
            {[
              { id: VIEWS.DASHBOARD, icon: LayoutDashboard, label: "Overview" },
              { id: VIEWS.DOMAIN, icon: FileText, label: "Pengisian" },
              { id: VIEWS.SUMMARY, icon: CheckCircle2, label: "Ringkasan" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                data-testid={`tab-${id}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  view === id
                    ? "bg-[rgba(124,104,225,0.25)] text-[color:var(--kti-indigo)]"
                    : "text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Save indicator */}
            {saving ? (
              <div className="flex items-center gap-1.5 text-xs text-[color:var(--kti-text-dim)]">
                <Loader2 className="size-3.5 animate-spin" /> Menyimpan...
              </div>
            ) : lastSavedTime ? (
              <div className="hidden text-xs text-[color:var(--kti-text-faint)] sm:block">
                ✓ Tersimpan {lastSavedTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            ) : null}

            {/* Export PDF */}
            <Button
              onClick={handleExportPdf}
              data-testid="header-export-pdf"
              variant="outline"
              size="sm"
              className="border-[rgba(115,209,173,0.3)] text-[color:var(--kti-teal)] hover:bg-[rgba(115,209,173,0.1)]"
            >
              <Download className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>

            {isLocked ? (
              <div className="flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.15)] px-4 py-2 text-sm font-medium text-[color:var(--kti-teal)]">
                <CheckCircle2 className="size-4" /> Sudah Disubmit
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── DASHBOARD VIEW ── */}
        {view === VIEWS.DASHBOARD && (
          <AssessmentDashboard
            session={session}
            template={template}
            domains={domainsWithProgress}
            progress={progress}
            lang={lang}
            onOpenDomain={openDomain}
            onGoSummary={() => setView(VIEWS.SUMMARY)}
            onExportPdf={handleExportPdf}
            isLocked={isLocked}
          />
        )}

        {/* ── DOMAIN FILLING VIEW ── */}
        {view === VIEWS.DOMAIN && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Sidebar */}
            <aside className="space-y-4 lg:col-span-3">
              <div className="sticky top-20 space-y-4">
                {/* Back to overview */}
                <button
                  type="button"
                  onClick={() => setView(VIEWS.DASHBOARD)}
                  data-testid="domain-back-overview"
                  className="inline-flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <LayoutDashboard className="size-4" /> Lihat Overview
                </button>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <AssessmentProgress progress={progress} domains={progress?.domains || []} />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <DomainNavigator
                    domains={domainsWithProgress}
                    currentIndex={currentDomainIndex}
                    onSelectDomain={setCurrentDomainIndex}
                    lang={lang}
                  />
                </div>
              </div>
            </aside>

            {/* Questions */}
            <div className="lg:col-span-9">
              <div className="space-y-5">
                {/* Domain Header */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--kti-text-faint)]">
                        Domain {String(currentDomain?.number || currentDomainIndex + 1).padStart(2, "0")} / {domains.length}
                      </p>
                      <h2 className="text-xl font-semibold text-white">{loc(currentDomain?.title, lang)}</h2>
                      {currentDomain?.description && (
                        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{loc(currentDomain.description, lang)}</p>
                      )}
                      {currentDomain?.recommended_pic?.length > 0 && (
                        <p className="mt-2 text-xs text-[color:var(--kti-text-faint)]">
                          PIC yang direkomendasikan: {currentDomain.recommended_pic.join(", ")}
                        </p>
                      )}
                    </div>
                    {currentDomain?.estimated_minutes && (
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[color:var(--kti-text-dim)]">
                        <Clock className="size-3.5" /> ~{currentDomain.estimated_minutes} menit
                      </div>
                    )}
                  </div>
                </div>

                {/* Questions */}
                {visibleQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
                    <p className="text-[color:var(--kti-text-dim)]">Tidak ada pertanyaan di domain ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleQuestions.map((q, idx) => (
                      <QuestionField
                        key={q.id}
                        index={idx + 1}
                        question={q}
                        answer={answersMap[q.id]}
                        onChange={(val) => handleAnswerChange(q.id, val)}
                        onOtherChange={(txt) => handleOtherChange(q.id, txt)}
                        onNoteChange={(note) => handleNoteChange(q.id, note)}
                        onSkip={() => handleSkip(q.id)}
                        onClear={() => handleClear(q.id)}
                        locked={isLocked}
                        sessionId={sessionId}
                        attachments={attachmentsByQuestion[q.id] || []}
                        onAttachmentUploaded={handleAttachmentUploaded}
                        onAttachmentDeleted={handleAttachmentDeleted}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                  <Button
                    onClick={() => currentDomainIndex > 0 ? setCurrentDomainIndex(currentDomainIndex - 1) : setView(VIEWS.DASHBOARD)}
                    data-testid="prev-domain-button"
                    variant="outline"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white hover:bg-white/[0.08]"
                  >
                    <ChevronLeft className="size-4" />
                    {currentDomainIndex === 0 ? "Overview" : "Domain Sebelumnya"}
                  </Button>

                  {currentDomainIndex < domains.length - 1 ? (
                    <Button
                      onClick={() => setCurrentDomainIndex(currentDomainIndex + 1)}
                      data-testid="next-domain-button"
                      className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
                    >
                      Domain Selanjutnya <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setView(VIEWS.SUMMARY)}
                      data-testid="go-to-summary-button"
                      className="inline-flex items-center gap-2 rounded-xl border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.32)]"
                    >
                      <CheckCircle2 className="size-4" /> Lihat Ringkasan &amp; Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY VIEW ── */}
        {view === VIEWS.SUMMARY && (
          <AssessmentSummary
            session={session}
            template={template}
            domains={domainsWithProgress}
            answersMap={answersMap}
            attachmentsByQuestion={attachmentsByQuestion}
            progress={progress}
            isLocked={isLocked}
            lang={lang}
            onBack={() => setView(VIEWS.DASHBOARD)}
            onSubmit={handleSubmit}
            onExportPdf={handleExportPdf}
          />
        )}
      </div>
    </div>
  );
}
