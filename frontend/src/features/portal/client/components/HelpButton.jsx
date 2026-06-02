import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const HelpButton = ({ helpText, testId }) => {
  if (!helpText) return null;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid={testId}
            className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            aria-label="Help"
          >
            <HelpCircle className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="max-w-xs rounded-xl border border-white/10 bg-[#0D0F1A] p-3 text-xs leading-relaxed text-[color:var(--kti-text-dim)] shadow-xl"
        >
          {helpText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
