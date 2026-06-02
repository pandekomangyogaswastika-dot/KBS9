import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Send, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DomainNavigator } from "./components/DomainNavigator";
import { AssessmentProgress } from "./components/AssessmentProgress";
import { QuestionField } from "./components/QuestionField";
import { filterVisibleQuestions } from "@/utils/assessmentBranching";

const loc = (obj, lang = "id") => {
  if (typeof obj === "string") return obj;
  return obj?.[lang] || obj?.id || obj?.en || "";
};

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
  
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [changedAnswers, setChangedAnswers] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef(null);

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

  useEffect(() => {
    loadSessionDetail();
  }, [loadSessionDetail]);

  // Auto-save logic (debounced 3 seconds)
  useEffect(() => {
    if (!isDirty || isLocked) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      if (Object.keys(changedAnswers).length === 0) {
        setIsDirty(false);
        return;
      }

      setSaving(true);
      try {
        const payload = Object.values(changedAnswers);
        await api.patch(`/assessment/sessions/${sessionId}/answers`, payload);
        setChangedAnswers({});
        setIsDirty(false);
      } catch (err) {
        toast.error(apiError(err, "Gagal menyimpan jawaban"));
      } finally {
        setSaving(false);
      }
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, changedAnswers, sessionId, isLocked]);

  const domains = useMemo(() => {
    if (!template) return [];
    return template.domains || template.sections || [];
  }, [template]);

  const currentDomain = useMemo(() => {
    return domains[currentDomainIndex];
  }, [domains, currentDomainIndex]);

  const visibleQuestions = useMemo(() => {
    if (!currentDomain) return [];
    return filterVisibleQuestions(currentDomain, answersMap);
  }, [currentDomain, answersMap]);

  const domainsWithProgress = useMemo(() => {
    if (!progress?.domains) return domains;
    return domains.map((d, idx) => ({
      ...d,
      progress: progress.domains[idx] || { answered: 0, total: 0, percent: 0, status: "not_started" },
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
    setChangedAnswers((prev) => ({ ...prev, [questionId]: newAnswer }));
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
    const nowSkipped = ans.skipped === true;
    handleAnswerChange(questionId, nowSkipped ? null : ans.value, { skipped: !nowSkipped });
  }, [answersMap, handleAnswerChange]);

  const handleClear = useCallback((questionId) => {
    handleAnswerChange(questionId, null, { skipped: false, other_text: null, note: answersMap[questionId]?.note || null });
  }, [answersMap, handleAnswerChange]);

  const handleAttachmentUploaded = useCallback((newAttachment) => {
    setAttachmentsByQuestion((prev) => {
      const qid = newAttachment.question_id;
      return { ...prev, [qid]: [...(prev[qid] || []), newAttachment] };
    });
  }, []);

  const handleAttachmentDeleted = useCallback((attachmentId) => {
    setAttachmentsByQuestion((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((qid) => {
        updated[qid] = updated[qid].filter((a) => a.id !== attachmentId);
      });
      return updated;
    });
  }, []);

  const handlePrevDomain = () => {
    if (currentDomainIndex > 0) setCurrentDomainIndex(currentDomainIndex - 1);
  };

  const handleNextDomain = () => {
    if (currentDomainIndex < domains.length - 1) setCurrentDomainIndex(currentDomainIndex + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Force save pending changes first
      if (Object.keys(changedAnswers).length > 0) {
        const payload = Object.values(changedAnswers);
        await api.patch(`/assessment/sessions/${sessionId}/answers`, payload);
        setChangedAnswers({});
        setIsDirty(false);
      }

      await api.post(`/assessment/sessions/${sessionId}/submit`);
      toast.success("Assessment berhasil disubmit!");
      setShowSubmitDialog(false);
      // Reload to update status
      await loadSessionDetail();
    } catch (err) {
      const errMsg = err.response?.data?.detail?.message || "Gagal submit";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadSessionDetail} />;
  if (!session || !template) return <ErrorView message="Session tidak ditemukan" />;

  return (
    <div className="min-h-screen" data-testid="assessment-taking-page">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#05060A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/portal/assessments")}
              data-testid="back-to-list"
              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{loc(template.name, lang)}</h1>
              <p className="text-xs text-[color:var(--kti-text-faint)]">
                {session.client_name} · {session.project_name || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-xs text-[color:var(--kti-text-dim)]">
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan...</span>
              </div>
            )}
            {isLocked ? (
              <div className="flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.15)] px-4 py-2 text-sm font-medium text-[color:var(--kti-teal)]">
                <CheckCircle2 className="size-4" />
                Sudah Disubmit
              </div>
            ) : (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                data-testid="submit-assessment-button"
                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
              >
                <Send className="size-4" />
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar (Domain Navigator + Progress) */}
          <aside className="space-y-6 lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <AssessmentProgress progress={progress} domains={progress?.domains || []} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
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
            <div className="space-y-6">
              {/* Domain Header */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white">
                      {loc(currentDomain?.title, lang)}
                    </h2>
                    {currentDomain?.description && (
                      <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">
                        {loc(currentDomain.description, lang)}
                      </p>
                    )}
                  </div>
                  {currentDomain?.estimated_minutes && (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[color:var(--kti-text-dim)]">
                      <Clock className="size-3.5" />
                      <span>~{currentDomain.estimated_minutes} menit</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions List */}
              {visibleQuestions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
                  <p className="text-[color:var(--kti-text-dim)]">
                    Tidak ada pertanyaan yang ditampilkan di domain ini.
                  </p>
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

              {/* Domain Navigation Buttons */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={handlePrevDomain}
                  disabled={currentDomainIndex === 0}
                  data-testid="prev-domain-button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                  Domain Sebelumnya
                </Button>
                {currentDomainIndex < domains.length - 1 ? (
                  <Button
                    onClick={handleNextDomain}
                    data-testid="next-domain-button"
                    className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
                  >
                    Domain Selanjutnya
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={isLocked}
                    data-testid="submit-final-button"
                    className="inline-flex items-center gap-2 rounded-xl border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.32)] disabled:opacity-40"
                  >
                    <Send className="size-4" />
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent
          className="max-w-md rounded-2xl border border-white/10 bg-[#0D0F1A]"
          data-testid="submit-dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Konfirmasi Submit
            </DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--kti-text-dim)]">
              Setelah disubmit, Anda tidak dapat mengubah jawaban lagi. Pastikan semua pertanyaan
              sudah diisi dengan benar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white hover:bg-white/[0.08]"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              data-testid="confirm-submit-button"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Ya, Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
