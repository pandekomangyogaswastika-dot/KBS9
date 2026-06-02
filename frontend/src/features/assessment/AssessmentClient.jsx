import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Send, Download, Globe, Loader2, CheckCircle2,
  Building2, AlertTriangle, Workflow, Network, Users, ShieldCheck, Wallet, MessageSquarePlus, ClipboardList,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { KubusMark } from "@/components/decor";
import ProgressRing from "@/features/assessment/ProgressRing";
import AssessmentQuestion from "@/features/assessment/AssessmentQuestion";
import {
  loadSession, saveAnswers, submitSession, uploadAttachment, deleteAttachment, pdfUrl, loc, OTHER,
} from "@/features/assessment/assessmentApi";
import { ASSESS } from "@/constants/testIds";

const ICONS = { Building2, AlertTriangle, Workflow, Network, Users, ShieldCheck, Wallet, MessageSquarePlus };

function evaluateShowIf(showIf, answersMap) {
  if (!showIf || !showIf.question_id) return true;
  const ans = answersMap[showIf.question_id];
  if (!ans || ans.skipped) return true;
  const actual = ans.value;
  if (actual === null || actual === undefined || actual === "" || (Array.isArray(actual) && actual.length === 0)) return true;
  const op = (showIf.operator || "equals").toLowerCase();
  if (op === "equals") return actual === showIf.value;
  if (op === "not_equals") return actual !== showIf.value;
  if (op === "in") return (showIf.values || []).includes(actual);
  if (op === "not_in") return !(showIf.values || []).includes(actual);
  return true;
}

export default function AssessmentClient() {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [session, setSession] = useState(null);
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [progress, setProgress] = useState(null);
  const [attachments, setAttachments] = useState({});
  const [locale, setLocale] = useState("id");
  const [view, setView] = useState("dashboard"); // 'dashboard' | domainIndex(number) | 'summary'
  const [saving, setSaving] = useState(false);
  const pendingRef = useRef({});
  const timerRef = useRef(null);

  const locked = session?.status !== "draft";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await loadSession(token);
        if (!alive) return;
        setSession(d.session); setTemplate(d.template); setAnswers(d.answers || {});
        setProgress(d.progress); setAttachments(d.attachments || {});
        setLocale(d.session.locale || "id");
        setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const flush = useCallback(async () => {
    const items = Object.values(pendingRef.current);
    if (!items.length) return;
    pendingRef.current = {};
    setSaving(true);
    try {
      const res = await saveAnswers(token, items);
      if (res?.progress) setProgress(res.progress);
    } catch {
      toast.error(t("assess.saveError"));
    } finally {
      setSaving(false);
    }
  }, [token, t]);

  const onChange = (qid, ans) => {
    setAnswers((prev) => ({ ...prev, [qid]: ans }));
    pendingRef.current[qid] = { question_id: qid, value: ans.value, skipped: !!ans.skipped, other_text: ans.other_text || null, note: ans.note || null };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 700);
  };

  const onUpload = async (qid, file) => {
    try {
      const att = await uploadAttachment(token, qid, file);
      setAttachments((prev) => ({ ...prev, [qid]: [att, ...(prev[qid] || [])] }));
      toast.success(t("media.uploaded"));
    } catch (e) {
      toast.error(e?.response?.data?.error?.message || t("media.uploadError"));
    }
  };

  const onDeleteAttachment = async (qid, attId) => {
    try {
      await deleteAttachment(token, attId);
      setAttachments((prev) => ({ ...prev, [qid]: (prev[qid] || []).filter((a) => a.id !== attId) }));
    } catch (e) { toast.error(e?.response?.data?.error?.message || "Error"); }
  };

  const doSubmit = async () => {
    await flush();
    try {
      await submitSession(token);
      setSession((s) => ({ ...s, status: "submitted" }));
      setView("dashboard");
      toast.success(t("assess.submittedTitle"));
    } catch (e) {
      toast.error(e?.response?.data?.error?.message || "Error");
    }
  };

  const toggleLocale = () => setLocale((l) => (l.startsWith("en") ? "id" : "en"));

  if (status === "loading") {
    return <Shell><div className="grid min-h-[60vh] place-items-center"><Loader2 className="size-8 animate-spin text-[#7C68E1]" /></div></Shell>;
  }
  if (status === "error") {
    return (
      <Shell>
        <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center text-center">
          <div>
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.04]"><AlertTriangle className="size-6 text-[#ff96aa]" /></div>
            <h1 className="font-display text-2xl font-semibold text-white">{t("assess.invalidTitle")}</h1>
            <p className="mt-2 text-sm text-[color:var(--kti-text-dim)]">{t("assess.invalidDesc")}</p>
          </div>
        </div>
      </Shell>
    );
  }

  const domains = template.domains || [];
  const answersMap = answers;
  const visibleOf = (d) => (d.questions || []).filter((q) => evaluateShowIf(q.show_if, answersMap));
  const domainProgress = (d) => (progress?.domains || []).find((x) => x.domain_id === d.id) || { answered: 0, total: visibleOf(d).length, percent: 0, status: "not_started" };

  return (
    <Shell>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[rgba(5,6,10,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2"><KubusMark height={24} /><span className="hidden font-mono-kti text-[10px] uppercase tracking-[0.2em] text-[color:var(--kti-text-dim)] sm:inline">Discovery</span></div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[11px] text-[color:var(--kti-text-dim)] sm:inline-flex">{saving ? <><Loader2 className="size-3 animate-spin" /> {t("assess.saving")}</> : <><CheckCircle2 className="size-3 text-[#73D1AD]" /> {t("assess.saved")}</>}</span>
            <button onClick={toggleLocale} data-testid={ASSESS.localeToggle} className="kti-focus inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.06]"><Globe className="size-3.5 text-[#73D1AD]" />{locale.startsWith("en") ? "EN" : "ID"}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8" data-testid={ASSESS.client}>
        {locked ? <SubmittedBanner t={t} token={token} locale={locale} /> : null}

        {view === "dashboard" && (
          <Dashboard
            t={t} locale={locale} session={session} template={template} progress={progress}
            domains={domains} domainProgress={domainProgress} setView={setView} locked={locked}
            onSubmit={doSubmit}
          />
        )}

        {typeof view === "number" && domains[view] && (
          <DomainView
            t={t} locale={locale} domain={domains[view]} index={view} total={domains.length}
            visible={visibleOf(domains[view])} answers={answers} attachments={attachments} locked={locked}
            onChange={onChange} onUpload={onUpload} onDeleteAttachment={onDeleteAttachment}
            setView={setView} domainProgress={domainProgress}
          />
        )}

        {view === "summary" && (
          <Summary
            t={t} locale={locale} domains={domains} visibleOf={visibleOf} answers={answers}
            attachments={attachments} progress={progress} setView={setView} onSubmit={doSubmit} locked={locked} token={token}
          />
        )}
      </main>
      <Toaster position="top-center" theme="dark" richColors />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--kti-space-975, #03040A)" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: "var(--kti-aurora-accent)", opacity: 0.5 }} />
      <div className="relative">{children}</div>
    </div>
  );
}

function SubmittedBanner({ t, token, locale }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--kti-radius-card)] border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.08)] p-4">
      <div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[#73D1AD]" /><div><p className="text-sm font-semibold text-white">{t("assess.submittedTitle")}</p><p className="text-xs text-[color:var(--kti-text-dim)]">{t("assess.submittedDesc")}</p></div></div>
      <a href={pdfUrl(token, locale)} target="_blank" rel="noreferrer" data-testid={ASSESS.pdfBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white hover:bg-white/[0.06]"><Download className="size-4" /> {t("assess.downloadPdf")}</a>
    </div>
  );
}

function Dashboard({ t, locale, session, template, progress, domains, domainProgress, setView, locked, onSubmit }) {
  return (
    <div>
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono-kti text-[11px] uppercase tracking-[0.2em] text-[color:var(--kti-text-faint)]">{loc(template.name, locale)}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">{session.client_name}</h1>
          {session.project_name ? <p className="text-sm text-[color:var(--kti-text-dim)]">{session.project_name}</p> : null}
          <p className="mt-2 max-w-xl text-sm text-[color:var(--kti-text-dim)]">{t("assess.intro")}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <ProgressRing percent={progress?.percent || 0} size={56} stroke={5} />
          <div><p className="text-xs text-[color:var(--kti-text-dim)]">{t("assess.overallProgress")}</p><p className="text-sm font-semibold text-white">{t("assess.answeredOf", { a: progress?.answered || 0, t: progress?.total || 0 })}</p></div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {domains.map((d, i) => {
          const dp = domainProgress(d);
          const Icon = ICONS[d.icon] || ClipboardList;
          return (
            <button key={d.id} onClick={() => setView(i)} data-testid={ASSESS.domainCard} className="kti-focus group flex items-center gap-4 rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-white/25">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.04]"><Icon className="size-5 text-[#73D1AD]" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{d.number}. {loc(d.title, locale)}</p>
                <p className="truncate text-xs text-[color:var(--kti-text-dim)]">{dp.answered}/{dp.total} · {dp.status === "completed" ? t("assess.completed") : dp.status === "in_progress" ? t("assess.inProgress") : t("assess.notStarted")}</p>
              </div>
              <ProgressRing percent={dp.percent} size={40} stroke={4} />
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={() => setView("summary")} data-testid={ASSESS.reviewBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-6 py-3 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)]"><ArrowRight className="size-4" /> {t("assess.review")}</button>
      </div>
    </div>
  );
}

function DomainView({ t, locale, domain, index, total, visible, answers, attachments, locked, onChange, onUpload, onDeleteAttachment, setView }) {
  return (
    <div>
      <button onClick={() => setView("dashboard")} data-testid={ASSESS.backDashboard} className="kti-focus mb-4 inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white"><ArrowLeft className="size-4" /> {t("assess.backDashboard")}</button>
      <div className="mb-5">
        <p className="font-mono-kti text-[11px] uppercase tracking-[0.2em] text-[color:var(--kti-text-faint)]">{t("assess.domain")} {domain.number}/{total}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">{loc(domain.title, locale)}</h2>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{loc(domain.description, locale)}</p>
      </div>
      <div className="space-y-3">
        {visible.map((q, qi) => (
          <AssessmentQuestion
            key={q.id} index={qi + 1} question={q} answer={answers[q.id]} lang={locale} locked={locked}
            onChange={(ans) => onChange(q.id, ans)} attachments={attachments[q.id] || []}
            onUpload={(file) => onUpload(q.id, file)} onDeleteAttachment={(attId) => onDeleteAttachment(q.id, attId)}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setView(index > 0 ? index - 1 : "dashboard")} data-testid={ASSESS.prevBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm text-white hover:bg-white/[0.06]"><ArrowLeft className="size-4" /> {t("assess.prev")}</button>
        {index < total - 1 ? (
          <button onClick={() => setView(index + 1)} data-testid={ASSESS.nextBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)]">{t("assess.next")} <ArrowRight className="size-4" /></button>
        ) : (
          <button onClick={() => setView("summary")} data-testid={ASSESS.reviewBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)]">{t("assess.review")} <ArrowRight className="size-4" /></button>
        )}
      </div>
    </div>
  );
}

function Summary({ t, locale, domains, visibleOf, answers, attachments, progress, setView, onSubmit, locked, token }) {
  const renderVal = (q) => {
    const a = answers[q.id];
    if (!a || a.skipped) return <span className="text-white/35">—</span>;
    const v = a.value;
    if (q.type === "single_choice") {
      if (v === OTHER) return `${t("assess.other")}: ${a.other_text || ""}`;
      const o = (q.options || []).find((x) => x.value === v); return o ? loc(o.label, locale) : (v ?? "—");
    }
    if (q.type === "multi_choice") {
      const arr = Array.isArray(v) ? v : [];
      return arr.map((val) => val === OTHER ? `${t("assess.other")}: ${a.other_text || ""}` : (loc((q.options || []).find((x) => x.value === val)?.label, locale) || val)).join(", ") || "—";
    }
    if (q.type === "yes_no") return v === true ? t("assess.yes") : v === false ? t("assess.no") : "—";
    if (q.type === "scale_1_5") return v ? `${v} / 5` : "—";
    return v ?? "—";
  };
  return (
    <div>
      <button onClick={() => setView("dashboard")} data-testid={ASSESS.backDashboard} className="kti-focus mb-4 inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white"><ArrowLeft className="size-4" /> {t("assess.backDashboard")}</button>
      <h2 className="mb-5 font-display text-2xl font-semibold text-white">{t("assess.reviewTitle")}</h2>
      <div className="space-y-5">
        {domains.map((d) => {
          const vq = visibleOf(d);
          return (
            <div key={d.id} className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.035] p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">{d.number}. {loc(d.title, locale)}</h3>
              <dl className="space-y-2.5">
                {vq.map((q) => (
                  <div key={q.id} className="grid gap-1 border-b border-white/6 pb-2.5 last:border-0 sm:grid-cols-2">
                    <dt className="text-xs text-[color:var(--kti-text-dim)]">{loc(q.prompt, locale)}</dt>
                    <dd className="text-sm text-white">{renderVal(q)}{(attachments[q.id] || []).length ? <span className="ml-2 text-xs text-[#73D1AD]">📎 {(attachments[q.id] || []).length}</span> : null}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      {!locked ? (
        <div className="mt-8 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button data-testid={ASSESS.submitBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.5)] bg-[rgba(115,209,173,0.18)] px-6 py-3 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.28)]"><Send className="size-4" /> {t("assess.submit")}</button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
              <AlertDialogHeader><AlertDialogTitle>{t("assess.submit")}</AlertDialogTitle><AlertDialogDescription className="text-[color:var(--kti-text-dim)]">{t("assess.submitConfirm")}</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]">{t("admin.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onSubmit} data-testid={ASSESS.confirmSubmit} className="border border-[rgba(115,209,173,0.5)] bg-[rgba(115,209,173,0.22)] text-white hover:bg-[rgba(115,209,173,0.32)]">{t("assess.submit")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="mt-8 flex justify-end">
          <a href={pdfUrl(token, locale)} target="_blank" rel="noreferrer" className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm text-white hover:bg-white/[0.06]"><Download className="size-4" /> {t("assess.downloadPdf")}</a>
        </div>
      )}
    </div>
  );
}
