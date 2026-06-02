import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import { PlanetOrb } from "@/components/decor";
import { useContentLocale } from "@/lib/useContentLocale";
import { GlassCard } from "@/components/kti/GlassCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { useTranslation } from "react-i18next";

export default function CasesGrid({ items = [] }) {
  const { L } = useContentLocale();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.startsWith("en");

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
      data-testid="cases-grid"
    >
      {items.map((c) => (
        <motion.div key={c.id || c.slug} variants={fadeUp} className="h-full">
          <GlassCard
            as={Link}
            to={`/cases/${c.slug}`}
            tilt
            data-cursor="hover"
            data-testid={`case-card-${c.slug}`}
            className="flex h-full gap-5 p-6 relative"
          >
            {/* Demo badge — tampil di pojok kanan atas jika demo tersedia */}
            {c.demo_enabled && (
              <div
                data-testid={`case-demo-badge-${c.slug}`}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: "rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  color: "#a5b4fc",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                {isEN ? "Live Demo" : "Demo Tersedia"}
              </div>
            )}

            <div className="shrink-0 pt-1">
              {c.cover_image_url ? (
                <img
                  src={c.cover_image_url}
                  alt={L(c.title)}
                  className="size-[84px] rounded-2xl object-cover ring-1 ring-white/12"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <PlanetOrb variant={c.cover || "planet-indigo"} size={84} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span
                className="font-hud text-[11px] uppercase tracking-[0.22em]"
                style={{ color: "var(--kti-teal)" }}
              >
                {L(c.industry)}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
                {L(c.title)}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--kti-text-dim)]">
                {L(c.summary)}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: "#cdd3ff" }}
                >
                  {c.client_name}
                  <ArrowUpRight className="size-4" />
                </span>

                {/* Mini demo CTA hint */}
                {c.demo_enabled && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5"
                    style={{ color: "rgba(165,180,252,0.8)" }}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    {isEN ? "Interactive Demo" : "Demo Interaktif"}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
