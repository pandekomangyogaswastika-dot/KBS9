import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once (idempotent). Imperative GSAP only — no React Three Fiber (TD-007).
if (typeof window !== "undefined" && !gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isSmallScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;

export const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

// Heavy choreography (pin/scrub/horizontal/video-scrub) disabled on small/touch or reduced-motion.
export const heavyMotionDisabled = () => prefersReducedMotion() || isSmallScreen();
