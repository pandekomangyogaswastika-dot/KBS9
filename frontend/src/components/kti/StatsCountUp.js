import { useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// Parse a display string like "120+", "99.6%", "1,200+", "2.4x" into number + suffix.
function parseValue(value) {
  const str = String(value).trim();
  const m = str.match(/^(-?[\d.,]+)(.*)$/);
  if (!m) return null;
  const numericPart = m[1];
  const hadComma = numericPart.includes(",");
  const clean = numericPart.replace(/,/g, "");
  const num = parseFloat(clean);
  if (Number.isNaN(num)) return null;
  const dot = clean.split(".")[1];
  const decimals = dot ? dot.length : 0;
  return { num, suffix: m[2] || "", decimals, grouping: hadComma };
}

export const StatsCountUp = ({ value, className = "", duration = 1.4, ...rest }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(() => {
    const p = parseValue(value);
    return p ? `0${p.suffix}` : String(value);
  });

  useLayoutEffect(() => {
    const el = ref.current;
    const parsed = parseValue(value);
    if (!parsed) {
      setDisplay(String(value));
      return undefined;
    }
    const fmt = (n) => {
      const fixed = n.toFixed(parsed.decimals);
      const out = parsed.grouping
        ? Number(fixed).toLocaleString("en-US", {
            minimumFractionDigits: parsed.decimals,
            maximumFractionDigits: parsed.decimals,
          })
        : fixed;
      return `${out}${parsed.suffix}`;
    };
    if (prefersReducedMotion()) {
      setDisplay(fmt(parsed.num));
      return undefined;
    }
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: parsed.num,
        duration,
        ease: "power2.out",
        onUpdate: () => setDisplay(fmt(obj.v)),
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [value, duration]);

  return (
    <span ref={ref} className={className} {...rest}>
      {display}
    </span>
  );
};
