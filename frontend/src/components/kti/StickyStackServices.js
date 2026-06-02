import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight, Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network, Sparkles,
} from "lucide-react";
import { useContentLocale } from "@/lib/useContentLocale";
import { Reveal } from "@/components/kti/Reveal";

const ICONS = { Boxes, Smartphone, Cloud, BrainCircuit, Radio, PenTool, Network };

// CSS sticky stacking cards: each card pins and the next overlaps it as you scroll.
export const StickyStackServices = ({ items = [] }) => {
  const { L } = useContentLocale();
  const { t } = useTranslation();

  return (
    <div className="relative" data-testid="sticky-stack-services">
      {items.map((s, i) => {
        const Icon = ICONS[s.icon] || Sparkles;
        const num = String(i + 1).padStart(2, "0");
        return (
          <div
            key={s.id || s.slug}
            className="sticky"
            style={{ top: `calc(96px + ${i * 14}px)`, zIndex: i + 1 }}
          >
            <div className="pb-6">
              <div
                className="relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-[rgba(10,12,22,0.82)] p-7 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:p-9"
                data-testid={`service-stack-card-${s.slug}`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 top-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-40"
                  style={{ background: "radial-gradient(circle, rgba(124,104,225,0.22), transparent 70%)" }}
                />
                <div className="relative grid gap-6 sm:grid-cols-[auto,1fr] sm:items-start">
                  <div className="flex items-center gap-4">
                    <div
                      className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10"
                      style={{ background: "linear-gradient(135deg, rgba(79,62,151,0.5), rgba(115,209,173,0.22))" }}
                    >
                      <Icon className="size-7" style={{ color: "#cdd3ff" }} />
                    </div>
                    <span className="font-hud text-3xl font-semibold text-white/15 sm:hidden">{num}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <h3 className="font-display text-xl font-semibold sm:text-2xl">{L(s.title)}</h3>
                      <span className="hidden font-hud text-3xl font-semibold text-white/12 sm:block">{num}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)] sm:text-base">
                      {L(s.description) || L(s.summary)}
                    </p>
                    <Link
                      to={`/services/${s.slug}`}
                      data-testid={`service-stack-link-${s.slug}`}
                      className="kti-focus mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                      style={{ color: "var(--kti-teal)" }}
                    >
                      {t("common.detail")}
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <Reveal className="pt-2">
        <Link
          to="/services"
          data-testid="services-viewall"
          className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/[0.06]"
        >
          {t("common.viewAll")}
          <ArrowUpRight className="size-4" />
        </Link>
      </Reveal>
    </div>
  );
};
