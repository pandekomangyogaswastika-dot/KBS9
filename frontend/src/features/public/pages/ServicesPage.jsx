import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network, Sparkles,
  CheckCircle2, ChevronRight, Layers
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useContentLocale } from "@/lib/useContentLocale";
import { useFetch } from "@/lib/apiClient";
import { ErrorView } from "@/components/StateViews";
import SEOHead from "@/components/SEOHead";
import { getServiceMeta } from "./serviceMeta";

const ICONS = { Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network };

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

// Category filter config
const CATEGORIES = [
  { key: 'all', id: 'Semua', en: 'All' },
  { key: 'engineering', id: 'Engineering', en: 'Engineering' },
  { key: 'platform', id: 'Platform', en: 'Platform' },
  { key: 'intelligence', id: 'AI & Data', en: 'AI & Data' },
  { key: 'design', id: 'Design', en: 'Design' },
  { key: 'advisory', id: 'Advisory', en: 'Advisory' },
];

// Visual icon panel with gradient and decorative dots
function ServiceVisual({ service, meta, index }) {
  const Icon = ICONS[service.icon] || Sparkles;
  return (
    <div
      className="relative flex items-center justify-center rounded-3xl overflow-hidden min-h-[280px] md:min-h-[340px]"
      style={{ background: meta.gradient }}
    >
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Glow orb */}
      <div
        className="absolute w-40 h-40 rounded-full blur-3xl opacity-40"
        style={{ background: meta.accentColor, top: '20%', left: '30%' }}
      />
      {/* Large icon */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="grid w-24 h-24 place-items-center rounded-3xl shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
        >
          <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        {/* Index badge */}
        <span
          className="text-[10px] font-hud uppercase tracking-[0.25em] px-3 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

// Single service section
function ServiceSection({ service, index }) {
  const { L } = useContentLocale();
  const { t, i18n } = useTranslation();
  const isEN = i18n.language?.startsWith('en');
  const meta = getServiceMeta(service.slug);
  const features = meta.features[isEN ? 'en' : 'id'];
  const isReverse = index % 2 === 1;

  return (
    <motion.div
      variants={fadeUp}
      viewport={{ once: true, margin: '-80px' }}
      whileInView="show"
      initial="hidden"
      data-testid={`service-section-${service.slug}`}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center ${
        isReverse ? 'lg:grid-flow-dense' : ''
      }`}
    >
      {/* Visual panel */}
      <div className={isReverse ? 'lg:col-start-2' : ''}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <ServiceVisual service={service} meta={meta} index={index} />
        </motion.div>
      </div>

      {/* Content panel */}
      <div className={`flex flex-col gap-5 ${isReverse ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-hud uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
            style={{ color: meta.accentColor, borderColor: `${meta.accentColor}40`, background: `${meta.accentColor}12` }}
          >
            <Layers className="w-3 h-3" />
            {service.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white">
          {L(service.title)}
        </h2>

        {/* Summary */}
        <p className="text-base leading-relaxed" style={{ color: 'rgba(232,234,242,0.72)' }}>
          {L(service.summary)}
        </p>

        {/* Description (shorter, 2 lines) */}
        {service.description && (
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,234,242,0.55)' }}>
            {L(service.description)?.slice(0, 160)}{L(service.description)?.length > 160 ? '...' : ''}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1">
            {features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: meta.accentColor }} />
                <span style={{ color: 'rgba(232,234,242,0.75)' }}>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA buttons */}
        <div className="flex items-center gap-3 mt-2">
          <Link
            to={`/services/${service.slug}`}
            data-testid={`service-detail-btn-${service.slug}`}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{
              background: `${meta.accentColor}22`,
              border: `1px solid ${meta.accentColor}55`,
              boxShadow: `0 0 20px ${meta.accentColor}20`,
            }}
          >
            {isEN ? 'View Detail' : 'Lihat Detail'}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            data-testid={`service-consult-btn-${service.slug}`}
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'rgba(232,234,242,0.5)' }}
          >
            {isEN ? 'Consult now' : 'Konsultasi'}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { L } = useContentLocale();
  const isEN = i18n.language?.startsWith('en');
  const { data, loading, error, reload } = useFetch('/services');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = (data || []).filter(
    (s) => activeCategory === 'all' || s.category === activeCategory
  );

  return (
    <div data-testid="services-page" className="min-h-screen">
      <SEOHead
        title={t('nav.services')}
        description="Layanan teknologi enterprise lengkap dari KTI: konsultasi IT, software development, cloud infrastructure, sistem integrasi, dan transformasi digital."
        type="website"
      />

      {/* Page Header */}
      <div className="pt-32 pb-12 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="kti-container"
        >
          <span className="inline-block text-[11px] font-hud uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--kti-teal)' }}>
            {t('sections.constellations')}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-4">
            {isEN ? 'Our Services' : 'Layanan Kami'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(232,234,242,0.6)' }}>
            {t('pages.servicesIntro')}
          </p>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="kti-container pb-10">
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              data-testid={`service-filter-${cat.key}`}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background: activeCategory === cat.key
                  ? 'rgba(124,104,225,0.25)'
                  : 'rgba(255,255,255,0.04)',
                border: activeCategory === cat.key
                  ? '1px solid rgba(124,104,225,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: activeCategory === cat.key
                  ? '#fff'
                  : 'rgba(232,234,242,0.55)',
                boxShadow: activeCategory === cat.key
                  ? '0 0 16px rgba(124,104,225,0.2)'
                  : 'none',
              }}
            >
              {isEN ? cat.en : cat.id}
            </button>
          ))}
        </div>
      </div>

      {/* Services sections */}
      <div className="kti-container pb-32">
        {loading && (
          <div className="flex flex-col gap-20">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-3xl bg-white/[0.04] animate-pulse min-h-[280px]" />
                <div className="flex flex-col gap-4">
                  <div className="h-4 w-24 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="h-8 w-3/4 rounded-xl bg-white/[0.08] animate-pulse" />
                  <div className="h-4 w-full rounded-xl bg-white/[0.06] animate-pulse" />
                  <div className="h-4 w-5/6 rounded-xl bg-white/[0.06] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <ErrorView message={error} onRetry={reload} />}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              variants={stagger}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex flex-col gap-20 lg:gap-28"
            >
              {filtered.length === 0 ? (
                <motion.div
                  variants={fadeUp}
                  className="text-center py-20"
                  style={{ color: 'rgba(232,234,242,0.4)' }}
                >
                  {isEN ? 'No services found in this category.' : 'Tidak ada layanan dalam kategori ini.'}
                </motion.div>
              ) : (
                filtered.map((service, idx) => (
                  <ServiceSection key={service.id || service.slug} service={service} index={idx} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bottom CTA */}
        {!loading && !error && data?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-24 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(79,62,151,0.2) 0%, rgba(124,104,225,0.12) 50%, rgba(115,209,173,0.08) 100%)', border: '1px solid rgba(124,104,225,0.2)' }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <h2 className="relative font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              {isEN ? 'Not sure which service fits?' : 'Belum yakin layanan mana yang cocok?'}
            </h2>
            <p className="relative text-base mb-8" style={{ color: 'rgba(232,234,242,0.6)' }}>
              {isEN
                ? 'Our consultants will help identify the right solution for your challenge.'
                : 'Konsultan kami akan membantu mengidentifikasi solusi terbaik untuk tantangan Anda.'}
            </p>
            <div className="relative flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                data-testid="services-cta-consult"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white"
                style={{ background: 'rgba(124,104,225,0.35)', border: '1px solid rgba(124,104,225,0.5)' }}
              >
                {isEN ? 'Start Consultation' : 'Mulai Konsultasi'}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/assessment"
                data-testid="services-cta-assessment"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(232,234,242,0.8)' }}
              >
                {isEN ? 'Take Assessment' : 'Isi Assessment'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
