import { CheckCircle2, Circle } from "lucide-react";

export const AssessmentProgress = ({ progress, domains = [] }) => {
  const percent = progress?.percent || 0;

  return (
    <div className="space-y-4" data-testid="assessment-progress">
      {/* Overall Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Progress Keseluruhan</span>
          <span className="text-sm font-semibold text-[color:var(--kti-teal)]">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C68E1] to-[#73D1AD] transition-all duration-500"
            style={{ width: `${percent}%` }}
            data-testid="overall-progress-bar"
          />
        </div>
      </div>

      {/* Per-Domain Progress */}
      {domains && domains.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--kti-text-dim)]">
            Per Domain
          </p>
          {domains.map((d, idx) => {
            const dp = d.percent || 0;
            const isDone = d.status === "completed";
            return (
              <div key={d.domain_id || idx} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="size-4 shrink-0 text-[color:var(--kti-teal)]" />
                ) : (
                  <Circle className="size-4 shrink-0 text-white/30" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-white">
                      {typeof d.title === "string" ? d.title : d.title?.id || d.title?.en || "—"}
                    </span>
                    <span className="text-[10px] text-[color:var(--kti-text-faint)]">
                      {d.answered}/{d.total}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[color:var(--kti-teal)] transition-all"
                      style={{ width: `${dp}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
