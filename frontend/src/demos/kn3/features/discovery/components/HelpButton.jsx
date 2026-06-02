import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

export const HelpButton = ({ helpText, testId }) => {
  if (!helpText) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-discovery-muted hover:bg-discovery-soft hover:text-discovery-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-discovery-primary/40"
          aria-label="Penjelasan tambahan"
        >
          <HelpCircle size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border border-discovery-border bg-white text-sm text-discovery-text shadow-discovery-lg"
        side="top"
        sideOffset={6}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-md bg-discovery-soft p-1.5 text-discovery-primary">
            <HelpCircle size={14} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-discovery-primary mb-1">Penjelasan</p>
            <p className="leading-relaxed text-discovery-muted">{helpText}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
