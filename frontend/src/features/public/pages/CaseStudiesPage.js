import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import FilterRail from "@/components/content/FilterRail";
import CaseStudyCard from "@/components/content/CaseStudyCard";

export default function CaseStudiesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterGroups = [
    {
      key: "industry",
      label: "Industry",
      testid: "filters-industry-group",
      options: [
        { value: "logistics", label: "Logistics & Supply Chain" },
        { value: "finance", label: "Finance & Banking" },
        { value: "healthcare", label: "Healthcare" },
        { value: "ecommerce", label: "E-Commerce" },
      ],
    },
    {
      key: "technology",
      label: "Technology",
      testid: "filters-technology-group",
      options: [
        { value: "React", label: "React" },
        { value: "Python", label: "Python" },
        { value: "AI/ML", label: "AI/ML" },
        { value: "Docker", label: "Docker" },
      ],
    },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.industry) params.industry = filters.industry;
      if (filters.technology) params.technology = filters.technology;

      const res = await api.get("/case-studies", { params });
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load case studies", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative pt-24" data-testid="case-studies-page">
      <div className="kti-container py-10 sm:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-[-0.04em] text-white">
            Case Studies
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[color:var(--kti-text-dim)] max-w-2xl">
            Deep-dive analysis dari proyek-proyek transformasi digital kami dengan hasil yang terukur.
          </p>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="kti-focus mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 lg:hidden"
            data-testid="mobile-filters-button"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {Object.values(filters).filter(v => v).length > 0 && (
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-[rgba(124,104,225,0.18)] text-xs font-bold text-[color:var(--kti-indigo)]">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
        </div>

        {/* Content + Filters */}
        <div className="flex gap-8 lg:gap-12">
          {/* Desktop Filter Rail */}
          <FilterRail
            filters={filters}
            onFilterChange={setFilters}
            filterGroups={filterGroups}
          />

          {/* Mobile Filter Sheet */}
          <FilterRail
            filters={filters}
            onFilterChange={setFilters}
            filterGroups={filterGroups}
            isMobile
            mobileOpen={mobileFiltersOpen}
            onMobileClose={() => setMobileFiltersOpen(false)}
          />

          {/* Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid min-h-[400px] place-items-center">
                <Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} />
              </div>
            ) : items.length === 0 ? (
              <div className="grid min-h-[400px] place-items-center text-center">
                <div>
                  <p className="text-[color:var(--kti-text-dim)]">No case studies found</p>
                  {Object.values(filters).filter(v => v).length > 0 && (
                    <button
                      onClick={() => setFilters({})}
                      className="kti-focus mt-4 text-sm text-[color:var(--kti-indigo)] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" data-testid="case-studies-grid">
                {items.map((item, idx) => (
                  <CaseStudyCard key={item.id} item={item} staggerIndex={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
