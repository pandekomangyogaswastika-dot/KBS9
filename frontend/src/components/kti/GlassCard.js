import { useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/gsap";

// Premium glassmorphic surface: blur + inner highlight + deep shadow + hover lift.
// Optional subtle 3D tilt on pointer-fine devices.
export const GlassCard = ({
  as: As = "div",
  children,
  className = "",
  tilt = false,
  glow = false,
  ...rest
}) => {
  const ref = useRef(null);

  const onMove = (e) => {
    if (!tilt || isCoarsePointer() || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const glowClass = glow ? "kti-glow-mix" : "";

  return (
    <As
      ref={ref}
      onMouseMove={tilt ? onMove : undefined}
      onMouseLeave={tilt ? onLeave : undefined}
      className={`group relative rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_26px_80px_rgba(0,0,0,0.62)] ${glowClass} ${className}`}
      style={{ willChange: tilt ? "transform" : undefined }}
      {...rest}
    >
      {/* top inner highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
      />
      {children}
    </As>
  );
};
