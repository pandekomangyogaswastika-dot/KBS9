import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// Scroll-triggered reveal. Reduced motion => instant visible (no translate).
export const Reveal = ({
  as: As = "div",
  children,
  className = "",
  delay = 0,
  y = 22,
  start = "top 86%",
  ...rest
}) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return undefined;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start, toggleActions: "play none none reverse" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, y, start]);

  return (
    <As ref={ref} className={`kti-reveal ${className}`} {...rest}>
      {children}
    </As>
  );
};
