import { motion } from "framer-motion";
import { StarLayer } from "@/components/decor";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";

export default function PageHeader({ eyebrow, title, intro, poster }) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 sm:pb-16 sm:pt-40" data-testid="page-header">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {poster ? (
          <img src={poster} alt="" loading="eager" fetchpriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        ) : (
          <StarLayer />
        )}
        <div className="absolute inset-0 kti-overlay-top" />
        <div className="absolute inset-x-0 top-0 h-72 kti-aurora opacity-60" />
      </div>
      <div className="kti-container relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {eyebrow && <div className="kti-eyebrow mb-3">{eyebrow}</div>}
          <TwoToneHeading as="h1" className="text-4xl sm:text-5xl lg:text-6xl" strong={title} />
          {intro && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--kti-text-dim)] sm:text-lg">
              {intro}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
