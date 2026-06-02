import { motion } from "framer-motion";
import { StarLayer } from "@/components/decor";
import { fadeUp, viewportOnce } from "@/lib/motion";

// Wrapper section: anchor + star background + header (eyebrow/title/subtitle).
export default function SectionScene({ id, eyebrow, title, subtitle, children, stars = true, className = "" }) {
  return (
    <section id={id} className={`kti-section overflow-hidden ${className}`} data-testid={`section-${id}`}>
      {stars && <StarLayer />}
      <div className="kti-container relative">
        {(eyebrow || title) && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} className="mb-10 sm:mb-14 max-w-2xl">
            {eyebrow && <div className="kti-eyebrow mb-3">{eyebrow}</div>}
            {title && <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight kti-gradient-text">{title}</h2>}
            {subtitle && <p className="mt-4 kti-text-dim text-base sm:text-lg leading-relaxed">{subtitle}</p>}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
