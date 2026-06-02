import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import BlocksRenderer from "@/components/content/BlocksRenderer";
import RelatedContent from "@/components/content/RelatedContent";

export default function CaseStudyDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get(`/case-studies/${slug}`);
        setItem(res.data?.data);
      } catch (err) {
        console.error("Failed to load case study", err);
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
          <Link to="/case-studies" className="kti-focus mt-4 inline-block text-[color:var(--kti-indigo)] hover:underline">
            Back to Case Studies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--kti-space-975)" }}>
      <div className="kti-container py-10 sm:py-16">
        <Link
          to="/case-studies"
          className="kti-focus inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white mb-8"
          data-testid="case-study-back-link"
        >
          <ArrowLeft className="size-4" />
          Back to Case Studies
        </Link>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Meta Rail */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(124,104,225,0.35)] bg-[rgba(124,104,225,0.18)] px-3 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-case-accent)]">
                  Case Study
                </span>
                <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-white">{item.title}</h1>
                {item.client && (
                  <p className="mt-2 text-[color:var(--kti-text-dim)]">{item.client}</p>
                )}
              </div>

              {item.summary && (
                <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)]">{item.summary}</p>
              )}

              <div className="space-y-4 rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 p-5">
                {item.industry && (
                  <div>
                    <p className="font-hud text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">Industry</p>
                    <p className="mt-1 text-sm text-white">{item.industry}</p>
                  </div>
                )}
                {item.technology && item.technology.length > 0 && (
                  <div>
                    <p className="font-hud text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] mb-2">Technology</p>
                    <div className="flex flex-wrap gap-2">
                      {item.technology.map((tech, i) => (
                        <span key={i} className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs text-white">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {item.demo_url && (
                  <a
                    href={item.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kti-focus inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
                    data-testid="case-study-demo-link"
                  >
                    View Live Demo
                  </a>
                )}
              </div>
            </div>
          </aside>

          {/* Content Blocks */}
          <main className="lg:col-span-8" data-testid="case-study-content">
            <BlocksRenderer blocks={item.blocks || []} />
            
            {/* Related Content */}
            <RelatedContent
              currentId={item.id}
              contentType="case-study"
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
