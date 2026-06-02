import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { gsap, heavyMotionDisabled } from "@/lib/gsap";
import { useContentLocale } from "@/lib/useContentLocale";
import { useSmoothScroll } from "@/context/SmoothScroll";
import { useDeviceCapability } from "@/lib/useDeviceCapability";
import { KubusCore } from "@/components/kti/KubusCore";
import { GlassPillButton } from "@/components/kti/GlassPillButton";
import { DotBadge } from "@/components/kti/DotBadge";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";
import { HexMark } from "@/components/decor";
import { MEDIA, HERO_TELEMETRY } from "@/content/home";

export const ScrollScrubHero = ({ settings }) => {
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const caps = useDeviceCapability();
  const { scrollTo } = useSmoothScroll();

  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const progressRef = useRef(0);
  const [heavy, setHeavy] = useState(false);

  useEffect(() => {
    setHeavy(!heavyMotionDisabled());
  }, []);

  useLayoutEffect(() => {
    if (!heavy) return undefined;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      const setTime = (p) => {
        progressRef.current = p;
        if (video && video.duration) {
          video.currentTime = Math.min(video.duration - 0.05, p * video.duration);
        }
      };
      if (video) {
        video.pause();
        video.addEventListener("loadedmetadata", () => setTime(progressRef.current));
      }
      gsap.to({}, {
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setTime(self.progress),
        },
      });
      gsap.to(contentRef.current, {
        yPercent: -14,
        opacity: 0.55,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "+=150%", scrub: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [heavy]);

  const title = settings?.hero_title;
  const subtitle = L(settings?.hero_subtitle) || "";

  return (
    <section
      ref={sectionRef}
      id="launch"
      data-testid="hero-scroll-scrub-section"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden"
    >
      {/* Background media */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={MEDIA.hero.video}
          poster={MEDIA.hero.poster}
          muted
          playsInline
          preload="auto"
          autoPlay={!heavy}
          loop={!heavy}
          aria-hidden="true"
          style={{ opacity: 0.55 }}
        />
        {/* Kubus Core 3D accent (desktop + motion only) */}
        {heavy && !caps.reducedMotion ? (
          <div className="absolute inset-0">
            <KubusCore progressRef={progressRef} lowPower={caps.lowPower} />
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center opacity-70">
            <div className="kti-bob">
              <HexMark size={120} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 kti-overlay-top" />
        <div className="absolute inset-0 kti-aurora opacity-60" aria-hidden="true" />
      </div>

      {/* Foreground content */}
      <div ref={contentRef} className="relative z-10 flex h-full items-center">
        <div className="kti-container grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <DotBadge className="mb-5">{t("hero.badge")}</DotBadge>
            <TwoToneHeading
              as="h1"
              className="text-4xl sm:text-6xl lg:text-7xl"
              strong={L(title)}
            />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--kti-text-dim)] sm:text-lg">
              {subtitle}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <GlassPillButton as={Link} to="/contact" data-testid="hero-primary-cta-button">
                {t("hero.ctaPrimary")}
              </GlassPillButton>
              <GlassPillButton
                as="button"
                variant="secondary"
                onClick={() => scrollTo("#origin")}
                data-testid="hero-secondary-cta-button"
              >
                {t("hero.ctaSecondary")}
              </GlassPillButton>
            </div>
          </motion.div>

          {/* Glass telemetry card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="hidden lg:col-span-5 lg:block"
          >
            <div className="relative ml-auto w-full max-w-sm rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
              />
              <div className="flex items-center justify-between">
                <span className="kti-hud-label">// LIVE TELEMETRY</span>
                <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--kti-teal)]">
                  <span className="size-1.5 animate-pulse rounded-full" style={{ background: "var(--kti-teal)" }} />
                  ONLINE
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {HERO_TELEMETRY.map((row) => (
                  <div key={row.key} className="flex items-end justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-sm text-[color:var(--kti-text-dim)]">{L(row.label)}</span>
                    <span className="font-display text-2xl font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 font-hud text-[11px] uppercase tracking-[0.2em] text-[color:var(--kti-text-faint)]">
                KUBUS · MISSION CONTROL
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.button
        onClick={() => scrollTo("#origin")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
        data-testid="hero-scroll-hint"
        aria-label={t("hero.scroll")}
      >
        <span className="font-hud text-[10px] uppercase tracking-[0.3em] text-[color:var(--kti-text-dim)]">
          {t("hero.scroll")}
        </span>
        <ChevronDown className="size-5 animate-bounce" style={{ color: "var(--kti-teal)" }} />
      </motion.button>
    </section>
  );
};
