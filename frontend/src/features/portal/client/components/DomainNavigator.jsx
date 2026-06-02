import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const loc = (obj, lang = "id") => {
  if (typeof obj === "string") return obj;
  return obj?.[lang] || obj?.id || obj?.en || "";
};

export const DomainNavigator = ({ domains = [], currentIndex, onSelectDomain, lang = "id" }) => {
  return (
    <div className="space-y-2" data-testid="domain-navigator">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[color:var(--kti-text-dim)]">
        Domain ({domains.length})
      </p>
      {domains.map((domain, idx) => {
        const isActive = idx === currentIndex;
        const isCurrent = idx === currentIndex;
        const isPast = idx < currentIndex;
        const status = domain.progress?.status || "not_started";
        const isCompleted = status === "completed";
        
        return (
          <button
            key={domain.id || idx}
            onClick={() => onSelectDomain(idx)}
            data-testid={`domain-nav-${domain.id || idx}`}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
              isActive
                ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.15)] shadow-md"
                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                {isCompleted ? (
                  <Check className="size-4 text-[color:var(--kti-teal)]" />
                ) : (
                  <Circle
                    className={`size-4 ${
                      isActive ? "text-[color:var(--kti-indigo)]" : "text-white/30"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-[color:var(--kti-text-dim)]"
                    }`}
                  >
                    {loc(domain.title, lang)}
                  </span>
                  {isCompleted && (
                    <Badge className="border-0 bg-[rgba(115,209,173,0.15)] text-[10px] text-[color:var(--kti-teal)]">
                      Selesai
                    </Badge>
                  )}
                </div>
                {domain.description && (
                  <p className="text-xs text-[color:var(--kti-text-faint)] line-clamp-2">
                    {loc(domain.description, lang)}
                  </p>
                )}
                {domain.progress && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[color:var(--kti-teal)] transition-all"
                        style={{ width: `${domain.progress.percent || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-white">
                      {domain.progress.answered || 0}/{domain.progress.total || 0}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
