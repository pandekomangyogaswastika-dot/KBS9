import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Briefcase, ArrowUpRight } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import PageHeader from "@/components/PageHeader";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import { GlassCard } from "@/components/kti/GlassCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SEOHead from "@/components/SEOHead";

export default function CareerPage() {
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { data, loading, error, reload } = useFetch("/careers");
  return (
    <div data-testid="career-page">
      <SEOHead
        title={t("nav.career")}
        description="Bergabunglah dengan tim KTI! Eksplorasi peluang karir di bidang teknologi: software engineer, cloud architect, consultant, dan posisi lainnya. Kembangkan karir Anda bersama kami."
        type="website"
      />
      <PageHeader eyebrow={t("nav.career")} title={t("nav.career")} intro={t("pages.careerIntro")} />
      <div className="kti-container pb-24">
        {loading && <LoadingView />}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (data?.length ? (
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="space-y-4">
            {data.map((j) => (
              <motion.div key={j.id} variants={fadeUp}>
                <GlassCard as={Link} to={`/career/${j.slug}`} data-testid={`career-card-${j.slug}`} data-cursor="hover" className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{L(j.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed kti-text-dim">{L(j.description)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs kti-text-dim">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{j.type}</span>
                      <span className="rounded-md bg-white/5 px-2 py-0.5">{j.level}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" style={{ color: "#73D1AD" }} />
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        ) : <EmptyView />)}
      </div>
    </div>
  );
}
