import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useContentLocale } from "@/lib/useContentLocale";
import { GlassPillButton } from "@/components/kti/GlassPillButton";
import { DotBadge } from "@/components/kti/DotBadge";
import { Reveal } from "@/components/kti/Reveal";
import { ENGAGEMENT_TIERS } from "@/content/home";

export const EngagementTiers = () => {
  const { L } = useContentLocale();
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 lg:grid-cols-3" data-testid="engagement-tiers">
      {ENGAGEMENT_TIERS.map((tier, i) => (
        <Reveal key={tier.key} delay={i * 0.08}>
          <div
            data-testid={`engagement-tier-${tier.key}`}
            className={`relative flex h-full flex-col rounded-[var(--kti-radius-card)] border bg-white/[0.05] p-7 backdrop-blur-xl transition-[transform,border-color] duration-200 hover:-translate-y-1 ${
              tier.highlight
                ? "border-[rgba(124,104,225,0.5)] shadow-[var(--kti-glow-mix)]"
                : "border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] hover:border-white/[0.18]"
            }`}
          >
            {tier.highlight && (
              <DotBadge tone="indigo" className="absolute -top-3 left-7">
                {t("tiers.popular")}
              </DotBadge>
            )}
            <h3 className="font-display text-xl font-semibold">{L(tier.name)}</h3>
            <p className="mt-1 font-hud text-[12px] uppercase tracking-[0.18em] text-[color:var(--kti-teal)]">
              {L(tier.price)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--kti-text-dim)]">{L(tier.tagline)}</p>

            <ul className="mt-6 space-y-3">
              {tier.features.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
                    style={{ background: "rgba(115,209,173,0.14)" }}
                  >
                    <Check className="size-3" style={{ color: "var(--kti-teal)" }} />
                  </span>
                  <span className="text-[color:var(--kti-text-strong)]">{L(f)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 pt-2">
              <GlassPillButton
                as={Link}
                to="/contact"
                variant={tier.highlight ? "primary" : "secondary"}
                data-testid={`engagement-cta-${tier.key}`}
                className="w-full"
              >
                {t("tiers.choose")}
              </GlassPillButton>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
};
