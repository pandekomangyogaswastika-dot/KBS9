import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2 } from "lucide-react";
import { getTechMeta, CATEGORY_META } from "@/components/content/techMeta";

const ALL = "All";

/**
 * TechStackGrid — logo-first interactive grid untuk halaman /tech.
 *  - Pills filter by category
 *  - Click logo → modal detail
 */
export default function TechStackGrid({ items = [] }) {
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [activeTech, setActiveTech] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return [ALL, ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === ALL) return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <div data-testid="tech-stack-grid">
      {/* Category pills */}
      <div
        className="mb-8 flex flex-wrap items-center gap-2"
        data-testid="tech-category-pills"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const catMeta = CATEGORY_META[cat] || {};
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              data-testid={`tech-category-pill-${cat}`}
              data-active={isActive ? "true" : "false"}
              className={`kti-focus rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-white/30 bg-white/12 text-white"
                  : "border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                {cat !== ALL && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      background: catMeta.color || "var(--kti-teal)",
                      boxShadow: `0 0 6px ${catMeta.color || "var(--kti-teal)"}`,
                    }}
                  />
                )}
                {cat}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((tech, idx) => (
            <TechCard
              key={tech.id || tech.name}
              tech={tech}
              staggerIndex={idx}
              onClick={() => setActiveTech(tech)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-[color:var(--kti-text-dim)]">
          Belum ada teknologi pada kategori ini.
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {activeTech && (
          <TechModal tech={activeTech} onClose={() => setActiveTech(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function TechCard({ tech, onClick, staggerIndex = 0 }) {
  const meta = getTechMeta(tech.name);
  const categoryMeta = CATEGORY_META[tech.category] || {};
  const iconUrl = meta?.slug
    ? `https://cdn.simpleicons.org/${meta.slug}/${meta.color}`
    : null;
  const [iconBroken, setIconBroken] = useState(false);

  return (
    <motion.button
      layout
      onClick={onClick}
      data-testid={`tech-card-${tech.id || tech.name}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.4,
        delay: Math.min(staggerIndex * 0.04, 0.3),
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5 backdrop-blur-xl text-center cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_24px_rgba(124,104,225,0.18)]"
    >
      <div className="grid size-14 sm:size-16 place-items-center rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        {iconUrl && !iconBroken ? (
          <img
            src={iconUrl}
            alt={tech.name}
            className="size-8 sm:size-9 object-contain"
            loading="lazy"
            onError={() => setIconBroken(true)}
          />
        ) : (
          <span className="font-display text-lg font-bold text-white">
            {tech.name?.charAt(0) || "?"}
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-semibold text-sm text-white leading-tight">
          {tech.name}
        </span>
        {tech.category && (
          <span
            className="text-[10px] font-hud uppercase tracking-[0.18em]"
            style={{ color: categoryMeta.color || "var(--kti-text-dim)" }}
          >
            {tech.category}
          </span>
        )}
      </div>
    </motion.button>
  );
}

function TechModal({ tech, onClose }) {
  const meta = getTechMeta(tech.name);
  const categoryMeta = CATEGORY_META[tech.category] || {};
  const iconUrl = meta?.slug
    ? `https://cdn.simpleicons.org/${meta.slug}/${meta.color}`
    : null;
  const [iconBroken, setIconBroken] = useState(false);

  // ESC handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 grid place-items-center px-4"
      style={{ zIndex: "var(--z-modal)" }}
      data-testid="tech-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-modal-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(5, 6, 10, 0.78)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Card */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-lg rounded-[20px] border border-white/15 bg-[rgba(11,13,23,0.96)] p-6 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
      >
        <button
          onClick={onClose}
          data-testid="tech-modal-close"
          aria-label="Close"
          className="kti-focus absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
        >
          <X className="size-4 text-white" />
        </button>

        <div className="flex items-start gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden shrink-0">
            {iconUrl && !iconBroken ? (
              <img
                src={iconUrl}
                alt={tech.name}
                className="size-9 object-contain"
                loading="lazy"
                onError={() => setIconBroken(true)}
              />
            ) : (
              <span className="font-display text-2xl font-bold text-white">
                {tech.name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="tech-modal-title"
              className="font-display text-2xl font-bold text-white"
            >
              {tech.name}
            </h3>
            {tech.category && (
              <span
                className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-hud uppercase tracking-[0.22em]"
                style={{ color: categoryMeta.color || "var(--kti-text-dim)" }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: categoryMeta.color || "var(--kti-teal)",
                  }}
                />
                {tech.category}
              </span>
            )}
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[color:var(--kti-text-dim)]">
          {meta?.description}
        </p>

        {meta?.benefits && meta.benefits.length > 0 && (
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">
              Kenapa kami pakai
            </h4>
            <ul className="space-y-2">
              {meta.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle2
                    className="size-4 shrink-0 mt-0.5"
                    style={{ color: "var(--kti-teal)" }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {meta?.url && (
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="tech-modal-docs-link"
            className="kti-focus mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white hover:bg-white/[0.1] transition-colors"
          >
            Official docs
            <ExternalLink className="size-4" />
          </a>
        )}
      </motion.div>
    </motion.div>
  );
}
