import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useCardTracking } from "@/lib/useCardTracking";

const MotionLink = motion.create(Link);

export default function PortfolioCard({ item, staggerIndex = 0 }) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);
  const { ref: trackRef, onClick: trackClick } = useCardTracking("portfolio", item);

  const handleClick = (e) => {
    trackClick();
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  };

  const setRefs = (node) => {
    ref.current = node;
    trackRef.current = node;
  };

  return (
    <MotionLink
      ref={setRefs}
      to={`/portfolio/${item.slug}`}
      data-testid="portfolio-card"
      onClick={handleClick}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.45,
        delay: Math.min(staggerIndex * 0.06, 0.4),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="group relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] hover:border-[rgba(115,209,173,0.35)] hover:shadow-[0_26px_80px_rgba(0,0,0,0.62),0_0_30px_rgba(115,209,173,0.18)] transition-[border-color,box-shadow] duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      {item.hero_media ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={item.hero_media}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06080F]/95 via-[#06080F]/40 to-transparent" />
          {item.industry && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(115,209,173,0.18)] border border-[rgba(115,209,173,0.35)] px-2.5 py-1 text-[10px] font-medium text-[color:var(--kti-teal)] backdrop-blur-md">
              {item.industry}
            </span>
          )}
        </div>
      ) : (
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#0e1024] via-[#10142e] to-[#06080F]">
          {item.industry && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(115,209,173,0.18)] border border-[rgba(115,209,173,0.35)] px-2.5 py-1 text-[10px] font-medium text-[color:var(--kti-teal)]">
              {item.industry}
            </span>
          )}
        </div>
      )}

      {/* Content (in-flow) */}
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug text-white group-hover:text-[color:var(--kti-teal)] transition-colors">
            {item.title}
          </h3>
          {item.client && (
            <p className="mt-1 text-xs text-[color:var(--kti-text-dim)]">{item.client}</p>
          )}
        </div>

        {item.summary && (
          <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)] line-clamp-2">
            {item.summary}
          </p>
        )}

        {item.technology && item.technology.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.technology.slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[11px] text-white"
              >
                {tech}
              </span>
            ))}
            {item.technology.length > 3 && (
              <span className="inline-flex items-center text-[11px] text-[color:var(--kti-text-dim)]">
                +{item.technology.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-[color:var(--kti-text-faint)]">
          {item.year && <span>{item.year}</span>}
          {item.external_url && (
            <span className="flex items-center gap-1">
              <ExternalLink className="size-3" />
              Live Site
            </span>
          )}
          {item.case_study_id && (
            <span className="text-[color:var(--kti-indigo)]">Case Study</span>
          )}
        </div>
      </div>

      {/* Ripple effects */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          initial={{ opacity: 0.35, width: 0, height: 0, x: "-50%", y: "-50%" }}
          animate={{ opacity: 0, width: 600, height: 600 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          style={{ left: r.x, top: r.y, background: "rgba(115,209,173,0.35)" }}
        />
      ))}

      {/* Hover glow border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[var(--kti-radius-card)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(115,209,173,0.25)",
        }}
      />
    </MotionLink>
  );
}
