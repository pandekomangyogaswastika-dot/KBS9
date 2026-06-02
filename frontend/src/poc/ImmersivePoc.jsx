import { useEffect, useRef, useState, lazy, Suspense } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useDeviceCapability } from "@/lib/useDeviceCapability";

const ImmersiveScene = lazy(() => import("@/components/three/ImmersiveScene"));

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { tag: "LAUNCH", title: "The Kubus Universe", body: "Bukan sekadar website — sebuah perjalanan menjelajahi galaksi solusi teknologi." },
  { tag: "ORIGIN", title: "Lahir dari Visi", body: "Kubus Teknologi Indonesia membangun solusi IT yang melampaui ekspektasi." },
  { tag: "CONSTELLATIONS", title: "Konstelasi Layanan", body: "Software, Cloud, AI, IoT — tiap layanan adalah bintang dalam orbit Anda." },
  { tag: "MISSION", title: "Mulai Misi Anda", body: "Siap menjelajah bersama? Hubungi mission control kami." },
];

export default function ImmersivePoc() {
  const rootRef = useRef(null);
  const progressRef = useRef(0);
  const caps = useDeviceCapability();
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (!caps.ready) return;
    if (caps.reducedMotion) {
      setStaticMode(true);
      return; // tanpa smooth-scroll/animasi berat
    }

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.5 });
    lenis.on("scroll", ({ progress }) => {
      if (typeof progress === "number") progressRef.current = progress;
      ScrollTrigger.update();
    });
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".poc-reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
    }, rootRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [caps.ready, caps.reducedMotion]);

  return (
    <div ref={rootRef} style={{ background: "#05060A", color: "#E8EAF2", position: "relative" }} data-testid="poc-root">
      {/* Background layer */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {staticMode ? (
          <div
            data-testid="poc-static-fallback"
            style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(1200px 600px at 50% 35%, rgba(124,104,225,0.35), transparent 60%), radial-gradient(900px 500px at 70% 80%, rgba(115,209,173,0.25), transparent 60%), #05060A",
            }}
          />
        ) : (
          <Suspense fallback={<div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#73D1AD" }}>Initializing launch sequence…</div>}>
            <ImmersiveScene progressRef={progressRef} lowPower={caps.lowPower} />
          </Suspense>
        )}
      </div>

      {/* Foreground content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {SECTIONS.map((s, i) => (
          <section
            key={s.tag}
            className="poc-reveal"
            data-testid={`poc-section-${i}`}
            style={{
              minHeight: "100vh", display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: i % 2 ? "flex-end" : "flex-start",
              padding: "0 8vw", textAlign: i % 2 ? "right" : "left",
            }}
          >
            <span style={{ letterSpacing: "0.4em", fontSize: 12, color: "#73D1AD", marginBottom: 16 }}>
              {String(i + 1).padStart(2, "0")} · {s.tag}
            </span>
            <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", fontWeight: 700, margin: 0, maxWidth: 720, lineHeight: 1.05,
              background: "linear-gradient(135deg,#E8EAF2,#9d8bff 60%,#73D1AD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {s.title}
            </h1>
            <p style={{ marginTop: 20, maxWidth: 520, color: "#9AA0B5", fontSize: "clamp(1rem,2vw,1.2rem)" }}>{s.body}</p>
          </section>
        ))}
        <footer style={{ padding: "40px 8vw 60px", color: "#9AA0B5", fontSize: 13 }} data-testid="poc-footer">
          POC · Immersive stack: Three.js + GSAP ScrollTrigger + Lenis · {caps.reducedMotion ? "reduced-motion (static)" : caps.lowPower ? "low-power mode" : "full mode"}
        </footer>
      </div>
    </div>
  );
}
