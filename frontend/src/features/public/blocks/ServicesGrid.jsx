import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network, Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useContentLocale } from "@/lib/useContentLocale";
import { GlassCard } from "@/components/kti/GlassCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const ICONS = { Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network };

export default function ServicesGrid({ items = [] }) {
  const { L } = useContentLocale();
  const { t } = useTranslation();
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="services-grid"
    >
      {items.map((s) => {
        const Icon = ICONS[s.icon] || Sparkles;
        return (
          <motion.div key={s.id || s.slug} variants={fadeUp} className="h-full">
            <GlassCard
              as={Link}
              to={`/services/${s.slug}`}
              tilt
              data-cursor="hover"
              data-testid={`services-constellation-card-${s.slug}`}
              className="block h-full p-6"
            >
              <div
                className="mb-5 grid size-12 place-items-center rounded-xl border border-white/10"
                style={{ background: "linear-gradient(135deg, rgba(79,62,151,0.5), rgba(115,209,173,0.22))" }}
              >
                <Icon className="size-6" style={{ color: "#cdd3ff" }} />
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">{L(s.title)}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--kti-text-dim)]">{L(s.summary)}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--kti-teal)" }}>
                {t("common.detail")}
                <ArrowUpRight className="size-4" />
              </span>
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
