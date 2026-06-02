import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Briefcase, Check } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import PageHeader from "@/components/PageHeader";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { GlassPillButton } from "@/components/kti/GlassPillButton";
import SEOHead from "@/components/SEOHead";

const GLASS =
  "rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

export default function CareerDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { data, loading, error, reload } = useFetch(`/careers/${slug}`, [slug]);

  if (loading) return <div className="pt-36"><LoadingView /></div>;
  if (error || !data) return <div className="pt-36"><ErrorView message={error} onRetry={reload} /></div>;

  return (
    <div data-testid="career-detail-page">
      <SEOHead
        title={`${L(data.title)} - ${data.location}`}
        description={L(data.description)?.substring(0, 160)}
        type="website"
      />
      <PageHeader eyebrow={`${data.location} · ${data.type}`} title={L(data.title)} intro={L(data.description)} />
      <div className="kti-container max-w-3xl pb-24">
        <Link to="/career" data-testid="career-back-link" className="kti-focus mb-8 inline-flex items-center gap-2 text-sm kti-text-dim transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("nav.career")}
        </Link>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm kti-text-dim">
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{data.location}</span>
          <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{data.type}</span>
          <span className="rounded-md bg-white/5 px-2 py-0.5">{data.level}</span>
        </div>
        <div className={`${GLASS} p-6 sm:p-8`}>
          <h3 className="mb-4 font-display text-lg font-semibold">{t("pages.requirements")}</h3>
          <ul className="space-y-3">
            {(data.requirements || []).map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[color:var(--kti-text-strong)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#73D1AD" }} /> {L(r)}
              </li>
            ))}
          </ul>
        </div>
        <GlassPillButton as={Link} to="/contact" data-testid="career-apply-cta" className="mt-8">
          {t("pages.applyNow")}
        </GlassPillButton>
      </div>
    </div>
  );
}
