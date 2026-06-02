import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket, Lightbulb } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useContentLocale } from "@/lib/useContentLocale";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";
import { PROCESS_STEPS } from "@/content/home";

// Interactive Idea -> Launch slider scrubbing through process stages.
export const IdeaToLaunchSlider = () => {
  const { L } = useContentLocale();
  const [index, setIndex] = useState(0);
  const steps = PROCESS_STEPS;
  const active = steps[index];
  const pct = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 0;

  return (
    <div data-testid="idea-to-launch-slider">
      <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:p-9">
        <div className="mb-7 flex items-center justify-between">
          <span className="flex items-center gap-2 font-hud text-[11px] uppercase tracking-[0.22em] text-[color:var(--kti-text-dim)]">
            <Lightbulb className="size-4" style={{ color: "var(--kti-teal)" }} /> Idea
          </span>
          <span className="flex items-center gap-2 font-hud text-[11px] uppercase tracking-[0.22em] text-[color:var(--kti-text-dim)]">
            Launch <Rocket className="size-4" style={{ color: "var(--kti-indigo)" }} />
          </span>
        </div>

        {/* progress rail */}
        <div className="relative mb-6">
          <div className="h-1 w-full rounded-full bg-white/[0.08]" />
          <div
            className="absolute left-0 top-0 h-1 rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--kti-teal), var(--kti-indigo))" }}
          />
          <div className="absolute -top-1.5 flex w-full justify-between">
            {steps.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIndex(i)}
                data-testid={`process-dot-${s.key}`}
                aria-label={L(s.title)}
                className="kti-focus grid size-4 place-items-center rounded-full"
              >
                <span
                  className="size-3 rounded-full border transition-colors duration-200"
                  style={{
                    background: i <= index ? "var(--kti-teal)" : "rgba(255,255,255,0.12)",
                    borderColor: i <= index ? "var(--kti-teal)" : "rgba(255,255,255,0.2)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <Slider
          value={[index]}
          min={0}
          max={steps.length - 1}
          step={1}
          onValueChange={(v) => setIndex(v[0])}
          data-testid="process-slider-input"
          className="mt-8"
        />

        {/* active step content */}
        <div className="mt-9 min-h-[150px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
            >
              <span className="kti-eyebrow">{L(active.tag)}</span>
              <TwoToneHeading as="h3" className="mt-3 text-2xl sm:text-3xl" strong={L(active.title)} />
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--kti-text-dim)] sm:text-base">
                {L(active.desc)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
