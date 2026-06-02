import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import { PlanetOrb } from "@/components/decor";
import PageHeader from "@/components/PageHeader";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { GlassPillButton } from "@/components/kti/GlassPillButton";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";
import SEOHead from "@/components/SEOHead";
import DemoGateForm from "@/components/DemoGateForm";

// Demo slugs that use direct navigation (no session gate, fully stateless)
const STATELESS_DEMO_SLUGS = ["garment-serial"];

const GLASS =
  "rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

function Block({ label, text }) {
  if (!text) return null;
  return (
    <div className={`${GLASS} p-6 sm:p-7`}>
      <div className="kti-eyebrow mb-3">{label}</div>
      <p className="text-base leading-relaxed text-[color:var(--kti-text-strong)]">{text}</p>
    </div>
  );
}

export default function CaseDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/cases/${slug}`, [slug]);
  const [showDemoGate, setShowDemoGate] = useState(false);

  const handleDemoClick = () => {
    if (!data?.demo_slug) { setShowDemoGate(true); return; }
    if (STATELESS_DEMO_SLUGS.includes(data.demo_slug)) {
      window.location.href = `/demo/${data.demo_slug}`;
    } else {
      setShowDemoGate(true);
    }
  };

  if (loading) return <div className="pt-36"><LoadingView /></div>;
  if (error || !data) return <div className="pt-36"><ErrorView message={error} onRetry={reload} /></div>;

  return (
    <div data-testid="case-detail-page">
      <SEOHead
        title={`${L(data.title)} - ${data.client_name}`}
        description={L(data.summary) || L(data.challenge)?.substring(0, 160)}
        type="article"
      />
      <PageHeader eyebrow={L(data.industry)} title={L(data.title)} intro={L(data.summary)} />
      <div className="kti-container pb-24">
        <Link to="/cases" data-testid="case-back-link" className="kti-focus mb-8 inline-flex items-center gap-2 text-sm kti-text-dim transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("nav.cases")}
        </Link>

        <div className={`mb-10 flex flex-col items-center gap-6 ${GLASS} p-8 sm:flex-row`}>
          <PlanetOrb variant={data.cover || "planet-indigo"} size={120} />
          <div>
            <p className="font-hud text-xs uppercase tracking-[0.25em] kti-text-dim">{data.client_name}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{L(data.title)}</h2>
          </div>
        </div>

        {data.results?.length > 0 && (
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="case-results">
            {data.results.map((r, i) => (
              <div key={i} className={`${GLASS} p-6 text-center`}>
                <div className="font-display text-3xl font-semibold kti-gradient-text">{r.value}</div>
                <div className="mt-2 text-xs kti-text-dim">{L(r.label)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Block label={t("pages.challenge")} text={L(data.challenge)} />
          <Block label={t("pages.approach")} text={L(data.approach)} />
          <Block label={t("pages.solution")} text={L(data.solution)} />
          <Block label={t("pages.impact")} text={L(data.impact)} />
        </div>

        {data.tech?.length > 0 && (
          <div className="mt-10">
            <div className="kti-eyebrow mb-3">{t("pages.techUsed")}</div>
            <div className="flex flex-wrap gap-2">
              {data.tech.map((tech) => (
                <span key={tech} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm" style={{ color: "#cfd4ea" }}>{tech}</span>
              ))}
            </div>
          </div>
        )}

        {/* Demo CTA Banner — prominent, full-width, placed before contact CTA */}
        {data.demo_enabled && data.demo_slug && (
          <div
            data-testid="case-demo-banner"
            className="mt-12 relative overflow-hidden rounded-3xl p-8 sm:p-10"
            style={{
              background: "linear-gradient(135deg, rgba(67,56,202,0.35) 0%, rgba(99,102,241,0.2) 50%, rgba(79,62,151,0.3) 100%)",
              border: "1px solid rgba(99,102,241,0.4)",
              boxShadow: "0 0 60px rgba(99,102,241,0.15)",
            }}
          >
            {/* Background dot pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            {/* Glow orb */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: "#6366f1" }} />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Icon area */}
              <div
                className="shrink-0 grid w-20 h-20 place-items-center rounded-3xl"
                style={{
                  background: "rgba(99,102,241,0.25)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <PlayCircle className="w-10 h-10 text-indigo-300" />
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-semibold text-green-300">Demo Interaktif Tersedia</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                  {data.demo_label_id || `Coba Demo ${L(data.title)}`}
                </h3>
                <p className="text-sm text-indigo-200/70 max-w-md">
                  Jelajahi platform secara langsung — data sandbox terisolasi, fitur penuh, <strong className="text-white">90 menit akses gratis</strong>. Tidak perlu instalasi.
                </p>
                {/* Feature pills */}
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {["Data terisolasi & aman", "Akses 90 menit penuh", "Guided tour tersedia", "Tanpa instalasi"].map((f) => (
                    <span key={f} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(199,210,254,0.8)" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className="shrink-0">
                <button
                  data-testid="case-demo-cta"
                  onClick={() => handleDemoClick()}
                  className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-white transition-all duration-200 hover:scale-105 shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
                  }}
                >
                  <PlayCircle className="w-5 h-5" />
                  Mulai Demo Gratis
                </button>
                <p className="mt-2 text-center text-[11px] text-indigo-300/60">Tidak perlu kartu kredit</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className={`mt-8 flex flex-col items-center gap-5 ${GLASS} p-10 text-center kti-glow-mix`}>
          <TwoToneHeading as="h3" className="text-2xl sm:text-3xl" strong={t("pages.relatedCta")} />
          <GlassPillButton as={Link} to="/contact" data-testid="case-contact-cta">
            {t("common.getStarted")}
          </GlassPillButton>
        </div>

        {/* Gate Form Modal */}
        {showDemoGate && (
          <DemoGateForm
            caseTitle={L(data.title)}
            appSlug={data.demo_slug || "kn3"}
            onClose={() => setShowDemoGate(false)}
          />
        )}
      </div>
    </div>
  );
}
