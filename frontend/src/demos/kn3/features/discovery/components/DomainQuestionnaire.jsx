import { useMemo } from "react";
import { QuestionField } from "./QuestionField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ChevronLeft, UserCircle2, Clock, EyeOff } from "lucide-react";
import { filterVisibleQuestions, getHiddenQuestionIds } from "../branching";

export const DomainQuestionnaire = ({
  domain,
  allDomains,
  answersMap,
  domainProgress,
  locked,
  onChange,
  onOtherChange,
  onNoteChange,
  onSkip,
  onClear,
  onBack,
  onOpenDomain,
  sessionId,
  attachmentsByQuestion = {},
  onAttachmentUploaded,
  onAttachmentDeleted,
}) => {
  const { prevDomain, nextDomain } = useMemo(() => {
    const idx = allDomains.findIndex((d) => d.id === domain.id);
    return {
      prevDomain: idx > 0 ? allDomains[idx - 1] : null,
      nextDomain: idx < allDomains.length - 1 ? allDomains[idx + 1] : null,
    };
  }, [domain.id, allDomains]);

  const visibleQuestions = useMemo(
    () => filterVisibleQuestions(domain, answersMap),
    [domain, answersMap],
  );
  const hiddenCount = (domain.questions?.length || 0) - visibleQuestions.length;

  return (
    <div className="space-y-5">
      <button
        type="button"
        data-testid="domain-back-to-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-discovery-muted transition-colors hover:text-discovery-primary"
      >
        <ChevronLeft size={14} /> Kembali ke Dashboard
      </button>

      <Card className="border-discovery-border bg-white p-6 shadow-discovery-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <Badge className="mb-2 border-0 bg-discovery-soft text-[10px] font-bold uppercase tracking-widest text-discovery-primary">
              Domain {String(domain.number).padStart(2, "0")} · {domain.id}
            </Badge>
            <h2 className="mb-1 text-2xl font-bold text-discovery-text">{domain.title}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-discovery-muted">{domain.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-discovery-muted">
              <span className="flex items-center gap-1.5">
                <UserCircle2 size={13} className="text-discovery-accent" />
                Direkomendasikan diisi oleh: <strong className="text-discovery-text">{domain.recommended_pic.join(", ")}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> ~{domain.estimated_minutes} menit
              </span>
              <span>
                <strong className="text-discovery-text">{domainProgress?.answered ?? 0}</strong>
                /{domainProgress?.total ?? domain.questions.length} terjawab
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {hiddenCount > 0 ? (
          <div
            data-testid="branching-info-banner"
            className="flex items-start gap-2 rounded-xl border border-discovery-accent/30 bg-discovery-accent/5 p-3 text-xs text-discovery-accent"
          >
            <EyeOff size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>{hiddenCount}</strong> pertanyaan otomatis disembunyikan karena tidak relevan berdasarkan jawaban Anda di domain lain.
              Ubah jawaban dependensi untuk memunculkan kembali.
            </span>
          </div>
        ) : null}
        {visibleQuestions.map((q, idx) => (
          <QuestionField
            key={q.id}
            index={idx + 1}
            question={q}
            answer={answersMap[q.id]}
            locked={locked}
            onChange={(v) => onChange(q.id, v)}
            onOtherChange={(v) => onOtherChange(q.id, v)}
            onNoteChange={(v) => onNoteChange(q.id, v)}
            onSkip={() => {
              const currentlySkipped = answersMap[q.id]?.skipped === true;
              onSkip(q.id, !currentlySkipped);
            }}
            onClear={() => onClear(q.id)}
            sessionId={sessionId}
            attachments={attachmentsByQuestion[q.id] || []}
            onAttachmentUploaded={(att) => onAttachmentUploaded?.(q.id, att)}
            onAttachmentDeleted={(attId) => onAttachmentDeleted?.(q.id, attId)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-discovery-border pt-5">
        {prevDomain ? (
          <Button
            variant="outline"
            data-testid="domain-prev"
            onClick={() => onOpenDomain(prevDomain.id)}
            className="border-discovery-border text-discovery-text hover:border-discovery-primary hover:text-discovery-primary"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Sebelumnya: {prevDomain.title}
          </Button>
        ) : <span />}
        {nextDomain ? (
          <Button
            data-testid="domain-next"
            onClick={() => onOpenDomain(nextDomain.id)}
            className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
          >
            Berikutnya: {nextDomain.title} <ArrowRight size={14} className="ml-1.5" />
          </Button>
        ) : (
          <Button
            data-testid="domain-finish"
            onClick={onBack}
            className="bg-discovery-accent text-white hover:bg-discovery-accent-hover"
          >
            Selesai Domain Terakhir <ArrowRight size={14} className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
