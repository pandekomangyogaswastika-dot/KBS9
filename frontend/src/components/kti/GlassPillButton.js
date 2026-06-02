import { ArrowRight } from "lucide-react";

// Glass pill CTA with a circular icon well on the right.
// variant: 'primary' (brand indigo-tinted) | 'secondary' (neutral glass).
export const GlassPillButton = ({
  as: As = "button",
  children,
  icon: Icon = ArrowRight,
  variant = "primary",
  className = "",
  iconWellClassName = "",
  ...rest
}) => {
  const base =
    "group/btn kti-focus inline-flex items-center justify-between gap-3 rounded-full px-5 py-3 text-sm font-semibold transition-[background-color,box-shadow,border-color] duration-200";
  const variants = {
    primary:
      "text-white border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.16)] shadow-[var(--kti-glow-indigo)] hover:bg-[rgba(124,104,225,0.26)]",
    secondary:
      "text-[color:var(--kti-text-strong)] border border-white/[0.14] bg-white/[0.06] shadow-[0_14px_40px_rgba(0,0,0,0.45)] hover:bg-white/10",
    ghost:
      "text-[color:var(--kti-text-strong)] border border-transparent bg-transparent hover:bg-white/[0.06]",
  };
  const wellTone =
    variant === "primary"
      ? "bg-[color:var(--kti-indigo)] text-[#06070F] border border-[rgba(255,255,255,0.25)]"
      : "bg-white/10 text-white border border-white/15";

  return (
    <As className={`${base} ${variants[variant] || variants.primary} ${className}`} {...rest}>
      <span>{children}</span>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full transition-transform duration-200 ${wellTone} ${iconWellClassName}`}
      >
        <Icon className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
      </span>
    </As>
  );
};
