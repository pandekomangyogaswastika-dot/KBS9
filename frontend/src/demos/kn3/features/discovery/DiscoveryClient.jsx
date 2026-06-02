import { useEffect, useMemo, useRef, useState } from "react";
import { discoveryApi } from "./api";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryDashboard } from "./components/DiscoveryDashboard";
import { DomainQuestionnaire } from "./components/DomainQuestionnaire";
import { DiscoverySummary } from "./components/DiscoverySummary";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SAVE_DEBOUNCE_MS = 700;

export const DiscoveryClient = ({ sessionId }) => {
  const [bootstrap, setBootstrap] = useState({ loading: true, error: null });
  const [questionsPayload, setQuestionsPayload] = useState({ domains: [], summary: [], total_questions: 0 });
  const [session, setSession] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [attachmentsByQuestion, setAttachmentsByQuestion] = useState({});
  const [progress, setProgress] = useState({ answered: 0, total: 0, percent: 0, domains: [] });
  const [view, setView] = useState({ kind: "dashboard" });
  const [saving, setSaving] = useState({ pending: 0, lastSavedAt: null });

  // Pending answers queue for debounced save
  const pendingRef = useRef(new Map()); // question_id -> {value, skipped, other_text, note}
  const timerRef = useRef(null);
  const answersRef = useRef({}); // selalu sinkron dengan answersMap (hindari stale closure saat merge patch)

  // ─── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [questions, sess] = await Promise.all([
          discoveryApi.fetchQuestions(),
          discoveryApi.fetchSession(sessionId),
        ]);
        if (!alive) return;
        setQuestionsPayload(questions);
        setSession(sess.session);
        setAnswersMap(sess.answers || {});
        setAttachmentsByQuestion(sess.attachments || {});
        setProgress(sess.progress);
        setBootstrap({ loading: false, error: null });
      } catch (e) {
        if (!alive) return;
        const detail = e?.response?.data?.detail || "Gagal memuat session.";
        setBootstrap({ loading: false, error: detail });
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  // Keep answersRef in sync supaya patch (merge partial) selalu pakai data terbaru
  useEffect(() => {
    answersRef.current = answersMap;
  }, [answersMap]);

  // ─── Debounced auto-save ──────────────────────────────────────────────────
  const flush = async () => {
    if (pendingRef.current.size === 0) return;
    const batch = Array.from(pendingRef.current.entries()).map(([question_id, payload]) => ({
      question_id,
      value: payload.value ?? null,
      skipped: payload.skipped === true,
      other_text: payload.other_text ?? null,
      note: payload.note ?? null,
    }));
    pendingRef.current.clear();
    try {
      const resp = await discoveryApi.saveAnswers(sessionId, batch);
      setProgress(resp.progress);
      setSaving((s) => ({ pending: pendingRef.current.size, lastSavedAt: new Date() }));
    } catch (e) {
      const detail = e?.response?.data?.detail || "Gagal menyimpan jawaban.";
      toast({ title: "Gagal autosave", description: detail, variant: "destructive" });
    }
  };

  const patchAnswer = (question_id, patch) => {
    const existing = answersRef.current[question_id] || {};
    const merged = {
      value: existing.value ?? null,
      skipped: existing.skipped === true,
      other_text: existing.other_text ?? null,
      note: existing.note ?? null,
      ...patch,
    };
    const next = {
      ...answersRef.current,
      [question_id]: { question_id, ...merged, updated_at: new Date().toISOString() },
    };
    answersRef.current = next;
    setAnswersMap(next);
    pendingRef.current.set(question_id, {
      value: merged.value ?? null,
      skipped: merged.skipped === true,
      other_text: merged.other_text ?? null,
      note: merged.note ?? null,
    });
    setSaving((s) => ({ ...s, pending: pendingRef.current.size }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  };

  // Force flush on unmount or before submit
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Actions exposed to children ──────────────────────────────────────────────
  const setAnswer = (question_id, value) => patchAnswer(question_id, { value, skipped: false });
  const setOtherText = (question_id, other_text) => patchAnswer(question_id, { other_text, skipped: false });
  const setNote = (question_id, note) => patchAnswer(question_id, { note });
  const setSkip = (question_id, skipped = true) =>
    patchAnswer(question_id, { skipped, value: skipped ? null : (answersRef.current[question_id]?.value ?? null) });
  const clearAnswer = (question_id) => patchAnswer(question_id, { value: null, other_text: null, skipped: false });

  const handleAttachmentUploaded = (questionId, att) => {
    setAttachmentsByQuestion((prev) => ({
      ...prev,
      [questionId]: [att, ...(prev[questionId] || [])],
    }));
  };
  const handleAttachmentDeleted = (questionId, attId) => {
    setAttachmentsByQuestion((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((a) => a.id !== attId),
    }));
  };

  const openDomain = (domainId) => setView({ kind: "domain", domainId });
  const goDashboard = () => setView({ kind: "dashboard" });
  const goSummary = () => setView({ kind: "summary" });

  const handleSubmit = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await flush();
    try {
      await discoveryApi.submitSession(sessionId);
      const sess = await discoveryApi.fetchSession(sessionId);
      setSession(sess.session);
      toast({
        title: "Submission berhasil",
        description: "Terima kasih sudah mengisi Discovery Questionnaire. Tim vendor IT akan follow up.",
      });
    } catch (e) {
      const detail = e?.response?.data?.detail || "Gagal submit. Coba lagi.";
      toast({ title: "Gagal submit", description: detail, variant: "destructive" });
    }
  };

  const handleExportPdf = () => {
    const url = discoveryApi.exportPdfUrl(sessionId);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const domainsById = useMemo(() => {
    const map = {};
    questionsPayload.domains.forEach((d) => { map[d.id] = d; });
    return map;
  }, [questionsPayload]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (bootstrap.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-discovery-muted">
          <Loader2 size={20} className="animate-spin" />
          <span>Memuat questionnaire…</span>
        </div>
      </div>
    );
  }

  if (bootstrap.error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-discovery-danger/30 bg-white p-8 text-center shadow-discovery-lg">
          <h2 className="mb-2 text-xl font-bold text-discovery-danger">Tidak dapat membuka link</h2>
          <p className="text-sm text-discovery-muted">{bootstrap.error}</p>
        </div>
      </div>
    );
  }

  const locked = session?.status !== "draft";

  return (
    <div className="min-h-screen pb-16" data-testid="discovery-client-root">
      <DiscoveryHeader
        session={session}
        progress={progress}
        saving={saving}
        locked={locked}
        onGoDashboard={goDashboard}
        onGoSummary={goSummary}
        onExportPdf={handleExportPdf}
        currentView={view.kind}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        {view.kind === "dashboard" && (
          <DiscoveryDashboard
            domains={questionsPayload.domains}
            progress={progress}
            onOpenDomain={openDomain}
            onGoSummary={goSummary}
          />
        )}
        {view.kind === "domain" && domainsById[view.domainId] && (
          <DomainQuestionnaire
            domain={domainsById[view.domainId]}
            allDomains={questionsPayload.domains}
            answersMap={answersMap}
            domainProgress={progress.domains.find((p) => p.domain_id === view.domainId)}
            locked={locked}
            onChange={setAnswer}
            onOtherChange={setOtherText}
            onNoteChange={setNote}
            onSkip={setSkip}
            onClear={clearAnswer}
            onBack={goDashboard}
            onOpenDomain={openDomain}
            sessionId={sessionId}
            attachmentsByQuestion={attachmentsByQuestion}
            onAttachmentUploaded={handleAttachmentUploaded}
            onAttachmentDeleted={handleAttachmentDeleted}
          />
        )}
        {view.kind === "summary" && (
          <DiscoverySummary
            session={session}
            domains={questionsPayload.domains}
            answersMap={answersMap}
            progress={progress}
            attachmentsByQuestion={attachmentsByQuestion}
            locked={locked}
            onBack={goDashboard}
            onSubmit={handleSubmit}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>
    </div>
  );
};
