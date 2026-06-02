import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const Ctx = createContext({ scrollTo: () => {}, lenisRef: { current: null } });
export const useSmoothScroll = () => useContext(Ctx);

// Lenis smooth scroll wired to GSAP ScrollTrigger (gsap.ticker drives lenis.raf,
// lenis 'scroll' triggers ScrollTrigger.update). Disabled => native scroll fallback.
export function SmoothScrollProvider({ children, enabled = true }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      // Native scroll path (mobile / reduced motion). Keep ScrollTrigger fresh.
      const id = setTimeout(() => ScrollTrigger.refresh(), 200);
      return () => clearTimeout(id);
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const refreshId = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refreshId);
      gsap.ticker.remove(onTick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  const scrollTo = (target, opts = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -90, duration: 1.1, ...opts });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return <Ctx.Provider value={{ scrollTo, lenisRef }}>{children}</Ctx.Provider>;
}
