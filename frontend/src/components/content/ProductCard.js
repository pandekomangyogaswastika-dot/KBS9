import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { useCardTracking } from "@/lib/useCardTracking";

const MotionLink = motion.create(Link);

export default function ProductCard({ item, staggerIndex = 0 }) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);
  const { ref: trackRef, onClick: trackClick } = useCardTracking("product", item);

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
      to={`/products/${item.slug}`}
      data-testid="product-card"
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
      className="group relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] hover:border-[rgba(183,168,255,0.35)] hover:shadow-[0_26px_80px_rgba(0,0,0,0.62),0_0_30px_rgba(183,168,255,0.22)] transition-[border-color,box-shadow] duration-300"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-4">
          {item.logo && (
            <img src={item.logo} alt={item.title} className="h-12 w-auto object-contain" />
          )}
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(183,168,255,0.18)] border border-[rgba(183,168,255,0.35)] px-2.5 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-product-accent)] mb-2">
              SaaS Product
            </span>
          </div>
        </div>

        <h3 className="font-display text-xl font-semibold text-white group-hover:text-[color:var(--kti-electric)] transition-colors">
          {item.title}
        </h3>
        {item.tagline && (
          <p className="mt-2 text-sm text-[color:var(--kti-text-dim)]">{item.tagline}</p>
        )}
        {item.description && (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--kti-text-dim)] line-clamp-3">
            {item.description}
          </p>
        )}

        {item.blocks && item.blocks.find((b) => b.type === "features") && (
          <div className="mt-4 space-y-2">
            {item.blocks
              .find((b) => b.type === "features")
              .data.features.slice(0, 3)
              .map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="mt-0.5 size-1.5 rounded-full bg-[color:var(--kti-electric)]" />
                  <span className="text-[color:var(--kti-text-dim)]">{feature.title}</span>
                </div>
              ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between rounded-full border border-white/14 bg-white/8 px-4 py-3 text-sm font-semibold text-white group-hover:bg-white/12 transition-colors">
          <span className="flex items-center gap-2">
            <ExternalLink className="size-4" />
            Lihat Detail
          </span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
          style={{ left: r.x, top: r.y, background: "rgba(183,168,255,0.35)" }}
        />
      ))}
    </MotionLink>
  );
}
