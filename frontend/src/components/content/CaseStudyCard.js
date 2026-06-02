import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useCardTracking } from "@/lib/useCardTracking";

const MotionLink = motion.create(Link);

export default function CaseStudyCard({ item, staggerIndex = 0 }) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);
  const { ref: trackRef, onClick: trackClick } = useCardTracking("case-study", item);

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
      to={`/case-studies/${item.slug}`}
      data-testid="case-study-card"
      onClick={handleClick}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.45,
        delay: Math.min(staggerIndex * 0.07, 0.4),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="group relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] hover:border-[rgba(124,104,225,0.35)] hover:shadow-[0_26px_80px_rgba(0,0,0,0.62),0_0_30px_rgba(124,104,225,0.2)] transition-[border-color,box-shadow] duration-300"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(124,104,225,0.18)] border border-[rgba(124,104,225,0.35)] px-2.5 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-case-accent)] mb-3">
              Case Study
            </span>
            <h3 className="font-display text-xl font-semibold text-white group-hover:text-[color:var(--kti-indigo)] transition-colors">
              {item.title}
            </h3>
            {item.client && (
              <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{item.client}</p>
            )}
          </div>
        </div>

        {item.summary && (
          <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)] line-clamp-3">
            {item.summary}
          </p>
        )}

        {item.blocks && item.blocks.find((b) => b.type === "metrics") && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {item.blocks
              .find((b) => b.type === "metrics")
              .data.metrics.slice(0, 2)
              .map((metric, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
                >
                  <div className="font-display text-2xl font-bold text-[color:var(--kti-indigo)]">
                    {metric.value}
                  </div>
                  <p className="mt-1 text-[10px] text-[color:var(--kti-text-dim)]">
                    {metric.label}
                  </p>
                </div>
              ))}
          </div>
        )}

        {item.technology && item.technology.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.technology.slice(0, 4).map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs text-white"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
          <div className="flex items-center gap-3 text-xs text-[color:var(--kti-text-faint)]">
            {item.industry && <span>{item.industry}</span>}
          </div>
          {item.demo_url && (
            <span className="flex items-center gap-1 text-xs text-[color:var(--kti-indigo)]">
              <ExternalLink className="size-3" />
              Live Demo
            </span>
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
          style={{ left: r.x, top: r.y, background: "rgba(124,104,225,0.35)" }}
        />
      ))}
    </MotionLink>
  );
}
