import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, SlidersHorizontal } from "lucide-react";

export default function FilterRail({
  filters = {},
  onFilterChange,
  filterGroups = [],
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}) {
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === filters[key] ? null : value };
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs font-medium text-white">
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </span>
          <button
            onClick={handleReset}
            className="kti-focus text-xs text-[color:var(--kti-teal)] hover:underline"
            data-testid="filters-reset-button"
          >
            Reset
          </button>
        </div>
      )}

      {/* Filter Groups */}
      <Accordion type="multiple" defaultValue={filterGroups.map(g => g.key)} className="space-y-4">
        {filterGroups.map((group) => (
          <AccordionItem
            key={group.key}
            value={group.key}
            className="rounded-xl border border-white/10 bg-white/5 px-4"
            data-testid={group.testid}
          >
            <AccordionTrigger className="py-3 text-xs font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] hover:text-white">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(group.key, option.value)}
                  className={`kti-focus w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    filters[group.key] === option.value
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-[color:var(--kti-text-dim)] hover:bg-white/5 hover:text-white'
                  }`}
                  data-testid={`filter-option-${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="right" className="overflow-y-auto border-white/10 p-6 w-[90vw] sm:w-[400px]" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
          <SheetTitle className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <SlidersHorizontal className="size-5" />
            Filters
          </SheetTitle>
          <FilterContent />
          <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-white/10 bg-[#0B0D17] pt-4">
            <button
              onClick={handleReset}
              className="kti-focus flex-1 rounded-full border border-white/15 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Reset
            </button>
            <button
              onClick={onMobileClose}
              className="kti-focus flex-1 rounded-full border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.18)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.28)]"
            >
              Apply
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <aside className="hidden lg:block w-80 shrink-0" data-testid="filters-desktop-sidebar">
      <div className="sticky top-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-hud text-xs uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center size-6 rounded-full bg-[rgba(115,209,173,0.18)] border border-[rgba(115,209,173,0.35)] text-[10px] font-bold text-[color:var(--kti-teal)]">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <FilterContent />
      </div>
    </aside>
  );
}
