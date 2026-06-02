import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap, heavyMotionDisabled } from "@/lib/gsap";
import { useContentLocale } from "@/lib/useContentLocale";
import { PlanetOrb } from "@/components/decor";

// Pinned horizontal rail on desktop (vertical scroll -> x translate).
// Native horizontal scroll-snap fallback on mobile / reduced motion.
export const HorizontalCasesRail = ({ items = [] }) => {
  const { L } = useContentLocale();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    if (heavyMotionDisabled() || !items.length) {
      setPinned(false);
      return undefined;
    }
    setPinned(true);
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return undefined;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [items]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden" data-testid="horizontal-cases-rail">
      <div className={pinned ? "" : "overflow-x-auto kti-no-scrollbar"}>
        <div
          ref={trackRef}
          className={`flex gap-5 px-4 sm:px-6 lg:px-8 ${pinned ? "" : "snap-x snap-mandatory"}`}
          style={{ width: pinned ? "max-content" : undefined }}
        >
          {items.map((c) => (
            <article
              key={c.id || c.slug}
              data-testid={`case-rail-card-${c.slug}`}
              className="snap-start shrink-0 w-[82vw] sm:w-[420px] pt-2"
            >
              <div className="flex h-full flex-col rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-white/[0.18]">
                <div className="mb-5 flex items-start justify-between -mt-2">
                  <PlanetOrb variant={c.cover || "planet-indigo"} size={72} />
                  <span className="font-hud text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--kti-teal)" }}>
                    {L(c.industry)}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold leading-snug">{L(c.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--kti-text-dim)]">{L(c.summary)}</p>

                {Array.isArray(c.results) && c.results.length > 0 && (
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {c.results.slice(0, 3).map((r, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-center">
                        <div className="font-display text-base font-semibold text-white">{r.value}</div>
                        <div className="mt-0.5 text-[10px] leading-tight text-[color:var(--kti-text-faint)]">{L(r.label)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to={`/cases/${c.slug}`}
                  data-testid={`case-rail-link-${c.slug}`}
                  className="kti-focus mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold"
                  style={{ color: "#cdd3ff" }}
                >
                  {c.client_name}
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
