import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import BlocksRenderer from "@/components/content/BlocksRenderer";
import RelatedContent from "@/components/content/RelatedContent";

export default function PortfolioDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get(`/portfolio/${slug}`);
        setItem(res.data?.data);
      } catch (err) {
        console.error("Failed to load portfolio item", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--kti-space-975)" }}>
        <Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen grid place-items-center px-6" style={{ background: "var(--kti-space-975)" }}>
        <div className="text-center">
          <p className="text-[color:var(--kti-text-dim)]">{t("common.notFound")}</p>
          <Link to="/portfolio" className="kti-focus mt-4 inline-block text-[color:var(--kti-teal)] hover:underline">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--kti-space-975)" }}>
      <div className="kti-container py-10 sm:py-16">
        <Link
          to="/portfolio"
          className="kti-focus inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white mb-8"
          data-testid="portfolio-back-link"
        >
          <ArrowLeft className="size-4" />
          Back to Portfolio
        </Link>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Meta Rail (Sticky on desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">{item.title}</h1>
                {item.client && (
                  <p className="mt-2 text-[color:var(--kti-text-dim)]">{item.client}</p>
                )}
              </div>

              {item.summary && (
                <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)]">{item.summary}</p>
              )}

              {/* Meta Info */}
              <div className="space-y-4 rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 p-5">
                {item.industry && (
                  <div>
                    <p className="font-hud text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">Industry</p>
                    <p className="mt-1 text-sm text-white">{item.industry}</p>
                  </div>
                )}
                {item.year && (
                  <div>
                    <p className="font-hud text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">Year</p>
                    <p className="mt-1 text-sm text-white">{item.year}</p>
                  </div>
                )}
                {item.technology && item.technology.length > 0 && (
                  <div>
                    <p className="font-hud text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] mb-2">Tech Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {item.technology.map((tech, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-medium text-white"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kti-focus inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.18)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.28)]"
                    data-testid="portfolio-external-link"
                  >
                    <ExternalLink className="size-4" />
                    Visit Live Site
                  </a>
                )}
                {item.case_study_id && (
                  <Link
                    to={`/case-studies/${item.case_study_slug || item.case_study_id}`}
                    className="kti-focus inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    data-testid="portfolio-case-study-link"
                  >
                    Read Case Study
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* Content Blocks */}
          <main className="lg:col-span-8" data-testid="portfolio-content">
            <BlocksRenderer blocks={item.blocks || []} />
            
            {/* Related Content */}
            <RelatedContent
              currentId={item.id}
              contentType="portfolio"
              tags={item.tags}
              industry={item.industry}
              technology={item.technology}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
