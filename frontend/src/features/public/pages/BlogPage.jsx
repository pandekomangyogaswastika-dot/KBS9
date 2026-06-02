import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import { PlanetOrb } from "@/components/decor";
import PageHeader from "@/components/PageHeader";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import { GlassCard } from "@/components/kti/GlassCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SEOHead from "@/components/SEOHead";

export default function BlogPage() {
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { data, loading, error, reload } = useFetch("/blog");
  return (
    <div data-testid="blog-page">
      <SEOHead
        title={t("nav.blog")}
        description="Blog KTI — Artikel, insight, dan tips seputar teknologi, transformasi digital, software development, dan tren industri IT terkini."
        type="website"
      />
      <PageHeader eyebrow={t("nav.blog")} title={t("nav.blog")} intro={t("pages.blogIntro")} />
      <div className="kti-container pb-24">
        {loading && <LoadingView />}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (data?.length ? (
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {data.map((p) => (
              <motion.div key={p.id} variants={fadeUp} className="h-full">
                <GlassCard as={Link} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`} data-cursor="hover" className="block h-full overflow-hidden">
                  {p.cover_image_url ? (
                    <div className="h-40 overflow-hidden"><img src={p.cover_image_url} alt={p.slug} className="h-full w-full object-cover" loading="lazy" decoding="async" /></div>
                  ) : (
                    <div className="grid h-40 place-items-center" style={{ background: "linear-gradient(160deg,#11142a,#0b0d17)" }}>
                      <PlanetOrb variant={p.cover || "planet-indigo"} size={92} ring={false} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {(p.tags || []).map((tg) => <span key={tg} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] kti-text-dim">{tg}</span>)}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{L(p.title)}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed kti-text-dim">{L(p.excerpt)}</p>
                    <p className="mt-4 text-xs kti-text-dim">{p.author} · {p.published_at}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        ) : <EmptyView />)}
      </div>
    </div>
  );
}
