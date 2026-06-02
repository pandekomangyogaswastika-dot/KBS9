import { motion } from "framer-motion";
import { GlassCard } from "@/components/kti/GlassCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

export default function TechGrid({ items = [] }) {
  const groups = items.reduce((acc, tech) => {
    (acc[tech.category] = acc[tech.category] || []).push(tech);
    return acc;
  }, {});
  const cats = Object.keys(groups);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="tech-grid"
    >
      {cats.map((cat) => (
        <motion.div key={cat} variants={fadeUp} className="h-full">
          <GlassCard className="h-full p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ background: "var(--kti-teal)", boxShadow: "0 0 8px var(--kti-teal)" }} />
              <h3 className="font-hud text-[11px] uppercase tracking-[0.28em] text-[color:var(--kti-text-dim)]">{cat}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups[cat].map((tech) => (
                <span
                  key={tech.id || tech.name}
                  data-testid={`tech-chip-${tech.id || tech.name}`}
                  className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
                  style={{ color: "#cfd4ea" }}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
