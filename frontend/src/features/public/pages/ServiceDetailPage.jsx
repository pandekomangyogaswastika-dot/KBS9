import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, CheckCircle2,
  Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network, Sparkles,
  Lightbulb, Zap, Target
} from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import { LoadingView, ErrorView } from "@/components/StateViews";
import SEOHead, { createServiceSchema } from "@/components/SEOHead";
import { getServiceMeta } from "./serviceMeta";

const ICONS = { Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network };

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// Case card component for Related Works
function RelatedCaseCard({ c, L }) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={`/cases/${c.slug}`}
        data-testid={`related-case-${c.slug}`}
        className="kti-glass-premium group flex flex-col overflow-hidden h-full transition-all duration-300 hover:scale-[1.02]"
      >
        {/* Cover */}
        {c.cover ? (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={c.cover}
              alt={L(c.title)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,6,10,0.8) 0%, transparent 60%)' }} />
          </div>
        ) : (
          <div className="w-full h-40" style={{ background: 'linear-gradient(135deg, rgba(79,62,151,0.3) 0%, rgba(115,209,173,0.2) 100%)' }} />
        )}

        <div className="p-5 flex flex-col gap-2 flex-1">
          {/* Industry badge */}
          {c.industry && (
            <span className="text-[10px] font-hud uppercase tracking-[0.2em]" style={{ color: 'var(--kti-teal)' }}>
              {L(c.industry) || (typeof c.industry === 'string' ? c.industry : '')}
            </span>
          )}
          <h4 className="font-display font-semibold text-white leading-snug">
            {L(c.title)}
          </h4>
          {c.summary && (
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(232,234,242,0.55)' }}>
              {L(c.summary)}
            </p>
          )}
          <span
            className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--kti-indigo)' }}
          >
            Lihat Studi Kasus
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.startsWith('en');

  const { data: service, loading, error, reload } = useFetch(`/services/${slug}`, [slug]);
  const { data: cases } = useFetch('/cases');

  if (loading) return <div className="pt-36"><LoadingView /></div>;
  if (error || !service) return <div className="pt-36"><ErrorView message={error} onRetry={reload} /></div>;

  const Icon = ICONS[service.icon] || Sparkles;
  const meta = getServiceMeta(slug);
  const features = meta.features[isEN ? 'en' : 'id'];
  const usecases = meta.usecases[isEN ? 'en' : 'id'];
  const schema = createServiceSchema(service);
  // Show up to 3 related cases
  const relatedCases = (cases || []).slice(0, 3);

  return (
    <div data-testid="service-detail-page" className="min-h-screen">
      <SEOHead
        title={L(service.title)}
        description={L(service.summary) || L(service.description)?.substring(0, 160)}
        type="website"
        schema={schema}
      />

      {/* Hero Section */}
      <div
        className="relative overflow-hidden pt-32 pb-20"
        style={{ background: meta.gradient }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background: meta.accentColor }}
        />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--kti-teal)' }}
        />

        <div className="kti-container relative z-10">
          {/* Back link */}
          <Link
            to="/services"
            data-testid="service-back-link"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {isEN ? 'All Services' : 'Semua Layanan'}
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Icon */}
            <div
              className="grid w-20 h-20 place-items-center rounded-3xl shrink-0"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>

            <div>
              {/* Category badge */}
              <span
                className="inline-block text-[10px] font-hud uppercase tracking-[0.25em] mb-2 px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              >
                {service.category}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {L(service.title)}
              </h1>
              <p className="mt-3 text-lg max-w-2xl" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {L(service.summary)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="kti-container py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left / Main column */}
          <div className="lg:col-span-2 flex flex-col gap-12">

            {/* Description */}
            {service.description && (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp}
              >
                <h2 className="font-display text-xl font-bold text-white mb-4">
                  {isEN ? 'Overview' : 'Tentang Layanan'}
                </h2>
                <div
                  className="kti-glass-premium p-6 sm:p-8 leading-relaxed text-base"
                  style={{ color: 'rgba(232,234,242,0.78)' }}
                >
                  {L(service.description)}
                </div>
              </motion.div>
            )}

            {/* Key Capabilities */}
            {features.length > 0 && (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp}
              >
                <h2 className="font-display text-xl font-bold text-white mb-5">
                  {isEN ? 'Key Capabilities' : 'Kemampuan Utama'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f, i) => (
                    <div
                      key={i}
                      className="kti-glass-premium flex items-start gap-3 p-4"
                    >
                      <CheckCircle2
                        className="w-5 h-5 shrink-0 mt-0.5"
                        style={{ color: meta.accentColor }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(232,234,242,0.78)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Use Cases */}
            {usecases.length > 0 && (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp}
              >
                <h2 className="font-display text-xl font-bold text-white mb-5">
                  {isEN ? 'Who Is This For?' : 'Cocok Untuk'}
                </h2>
                <div className="flex flex-col gap-3">
                  {usecases.map((uc, i) => (
                    <div
                      key={i}
                      className="kti-glass-premium flex items-start gap-4 p-4"
                    >
                      <div
                        className="grid w-8 h-8 place-items-center rounded-lg shrink-0"
                        style={{ background: `${meta.accentColor}20` }}
                      >
                        <Target className="w-4 h-4" style={{ color: meta.accentColor }} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,234,242,0.75)' }}>{uc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Related Works */}
            {relatedCases.length > 0 && (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-white">
                    {isEN ? 'Related Works' : 'Hasil Terkait'}
                  </h2>
                  <Link
                    to="/cases"
                    className="text-sm flex items-center gap-1 transition-colors hover:text-white"
                    style={{ color: 'var(--kti-teal)' }}
                  >
                    {isEN ? 'View all' : 'Lihat semua'}
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {relatedCases.map((c) => (
                    <RelatedCaseCard key={c.id} c={c} L={L} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">

            {/* Quick info card */}
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp}
              className="kti-glass-premium p-6 sticky top-28"
            >
              <h3 className="font-display font-bold text-white mb-4">
                {isEN ? 'Start Your Mission' : 'Mulai Misi Anda'}
              </h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(232,234,242,0.6)' }}>
                {isEN
                  ? 'Discuss your project with our consultant and get a free initial assessment.'
                  : 'Diskusikan proyek Anda dengan konsultan kami dan dapatkan asesmen awal gratis.'}
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/contact"
                  data-testid="service-contact-cta"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: `${meta.accentColor}30`,
                    border: `1px solid ${meta.accentColor}55`,
                    boxShadow: `0 0 24px ${meta.accentColor}20`,
                  }}
                >
                  {isEN ? 'Book Consultation' : 'Jadwalkan Konsultasi'}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/assessment"
                  data-testid="service-assessment-cta"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-5 py-3 text-sm font-medium transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(232,234,242,0.7)',
                  }}
                >
                  {isEN ? 'Take Discovery Assessment' : 'Isi Discovery Assessment'}
                </Link>
              </div>

              {/* Service highlights */}
              <div className="mt-6 pt-5 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 shrink-0" style={{ color: meta.accentColor }} />
                  <span className="text-xs" style={{ color: 'rgba(232,234,242,0.55)' }}>
                    {isEN ? 'Fast kick-off in 1–2 weeks' : 'Kick-off cepat dalam 1–2 minggu'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-4 h-4 shrink-0" style={{ color: meta.accentColor }} />
                  <span className="text-xs" style={{ color: 'rgba(232,234,242,0.55)' }}>
                    {isEN ? 'Free initial consultation' : 'Konsultasi awal gratis'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: meta.accentColor }} />
                  <span className="text-xs" style={{ color: 'rgba(232,234,242,0.55)' }}>
                    {isEN ? 'Proven track record of 120+ projects' : 'Rekam jejak 120+ proyek sukses'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Other services nav */}
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h4 className="text-xs font-hud uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(232,234,242,0.4)' }}>
                {isEN ? 'Other Services' : 'Layanan Lainnya'}
              </h4>
              <Link
                to="/services"
                data-testid="service-back-all"
                className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(232,234,242,0.55)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                {isEN ? 'See all services' : 'Lihat semua layanan'}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
