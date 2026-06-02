import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFetch } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";
import { ErrorView, EmptyView } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function ResourcesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { data: resources, loading, error, reload } = useFetch("/resources");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = [
    { value: "all", label: { id: "Semua", en: "All" } },
    { value: "whitepaper", label: { id: "Whitepaper", en: "Whitepaper" } },
    { value: "ebook", label: { id: "E-Book", en: "E-Book" } },
    { value: "template", label: { id: "Template", en: "Template" } },
    { value: "guide", label: { id: "Panduan", en: "Guide" } },
    { value: "case_study", label: { id: "Studi Kasus", en: "Case Study" } },
  ];

  const filtered = typeFilter === "all" ? resources : resources?.filter((r) => r.type === typeFilter);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div data-testid="resources-page">
      <SEOHead
        title="Resources & Downloads"
        description="Download whitepapers, e-books, templates, dan panduan gratis dari KTI. Insights dan best practices untuk transformasi digital."
        type="website"
      />
      <PageHeader
        eyebrow={t("sections.resources")}
        title={lang.startsWith("en") ? "Resources" : "Resources & Download"}
        intro={lang.startsWith("en") ? "Free downloads, guides, and insights" : "Download gratis panduan dan insights untuk bisnis Anda"}
      />
      
      <div className="kti-container pb-24">
        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {types.map((type) => (
            <Button
              key={type.value}
              variant={typeFilter === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type.value)}
            >
              {lang.startsWith("en") ? type.label.en : type.label.id}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="kti-card h-80 animate-pulse" />)}
          </div>
        )}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (!filtered || filtered.length === 0) && (
          <EmptyView message={lang.startsWith("en") ? "No resources found" : "Belum ada resources"} />
        )}
        
        {!loading && filtered && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((resource) => (
              <div
                key={resource.id}
                className="kti-card group cursor-pointer overflow-hidden"
                onClick={() => navigate(`/resources/${resource.slug}`)}
                data-testid={`resource-${resource.slug}`}
              >
                {/* Cover */}
                {resource.cover ? (
                  <div className="aspect-video bg-white/5 overflow-hidden">
                    <img
                      src={resource.cover}
                      alt={lang.startsWith("en") ? resource.title.en : resource.title.id}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <FileText className="h-16 w-16 text-white/30" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {resource.type}
                    </Badge>
                    {resource.file_size && (
                      <span className="text-xs text-white/50">
                        {formatFileSize(resource.file_size)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg mb-2 line-clamp-2">
                    {lang.startsWith("en") ? resource.title.en : resource.title.id}
                  </h3>

                  <p className="text-sm text-white/60 line-clamp-3 mb-4">
                    {lang.startsWith("en") ? resource.description.en : resource.description.id}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Download className="h-4 w-4" />
                      <span>{resource.download_count || 0} downloads</span>
                    </div>
                    {resource.gated && (
                      <Badge variant="outline" className="text-xs">
                        {lang.startsWith("en") ? "Email required" : "Perlu email"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
