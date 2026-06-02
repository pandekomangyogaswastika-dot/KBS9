import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import { MEDIA } from "@/content/home";
import { ScrollScrubHero } from "@/components/kti/ScrollScrubHero";
import { SceneSection } from "@/components/kti/SceneSection";
import { MediaSection } from "@/components/kti/MediaSection";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";
import { StatsCountUp } from "@/components/kti/StatsCountUp";
import { Reveal } from "@/components/kti/Reveal";
import { DotBadge } from "@/components/kti/DotBadge";
import { GlassPillButton } from "@/components/kti/GlassPillButton";
import { StickyStackServices } from "@/components/kti/StickyStackServices";
import { IdeaToLaunchSlider } from "@/components/kti/IdeaToLaunchSlider";
import { GaugeDataViz } from "@/components/kti/GaugeDataViz";
import { HorizontalCasesRail } from "@/components/kti/HorizontalCasesRail";
import { SecureTransmissionDemo } from "@/components/kti/SecureTransmissionDemo";
import { EngagementTiers } from "@/components/kti/EngagementTiers";
import TechGrid from "@/features/public/blocks/TechGrid";
import CrewGrid from "@/features/public/blocks/CrewGrid";
import ClientsGrid from "@/features/public/blocks/ClientsGrid";
import ContactForm from "@/features/public/blocks/ContactForm";
import TestimonialCarousel from "@/components/kti/TestimonialCarousel";
import PartnersShowcase from "@/components/kti/PartnersShowcase";
import SEOHead, { createOrganizationSchema, createWebsiteSchema } from "@/components/SEOHead";

import StyledText from "@/components/StyledText";

/** Returns a helper that picks a bilingual field from a home-block by key.
 *  If the value has a _style token, returns a <StyledText> element (works as JSX child).
 *  Otherwise returns the plain translated string. Falls back to `fallback`. */
function useBlock(blocks, lang) {
  return (key, field, fallback = "") => {
    const b = (blocks || []).find((x) => x.key === key);
    if (!b || !b[field]) return fallback;
    const val = b[field];
    if (typeof val === "object" && val !== null) {
      const text = lang.startsWith("en") ? (val.en || val.id || "") : (val.id || val.en || "");
      if (!text) return fallback;
      if (val._style && (val._style.color || val._style.font)) {
        return <StyledText value={val} lang={lang} as="span" />;
      }
      return text;
    }
    return fallback;
  };
}

export default function HomePage() {
  const { settings } = useOutletContext() || {};
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "id";
  const { L } = useContentLocale();
  const { data: services }     = useFetch("/services");
  const { data: tech }         = useFetch("/tech");
  const { data: cases }        = useFetch("/cases");
  const { data: team }         = useFetch("/team");
  const { data: clients }      = useFetch("/clients");
  const { data: testimonials } = useFetch("/testimonials?featured=true");
  const { data: blocksRaw }    = useFetch("/home-blocks");

  const B = useBlock(blocksRaw, lang);

  const stats = settings?.stats || [];
  
  // Schema.org structured data for Homepage
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      createOrganizationSchema(),
      createWebsiteSchema(),
    ],
  };

  return (
    <div data-testid="home-page">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Kubus Teknologi Indonesia"
        description="Kubus Teknologi Indonesia (KTI) — Solusi teknologi enterprise untuk transformasi digital bisnis Anda. Konsultasi IT, development, dan implementasi sistem terintegrasi."
        type="website"
        schema={schema}
      />
      
      <ScrollScrubHero settings={settings} />

      {/* About / Origin */}
      <MediaSection
        id="origin"
        media={MEDIA.about.video}
        poster={MEDIA.about.poster}
        minH="min-h-[88vh]"
        aurora
        data-testid="section-origin"
        contentClassName="py-24"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <div className="kti-eyebrow mb-3">{t("sections.origin")}</div>
            <TwoToneHeading
              className="text-3xl sm:text-4xl lg:text-5xl"
              strong={L(settings?.about_title)}
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[color:var(--kti-text-dim)] sm:text-lg">
              {L(settings?.about_body)}
            </p>
            <GlassPillButton as={Link} to="/team" variant="secondary" className="mt-8" data-testid="origin-team-cta">
              {t("sections.crew")}
            </GlassPillButton>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            {stats.map((s, i) => (
              <Reveal
                key={i}
                delay={i * 0.06}
                className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
                data-testid={`stat-${i}`}
              >
                <StatsCountUp
                  value={s.value}
                  className="font-display text-3xl font-semibold text-white sm:text-4xl"
                />
                <div className="mt-2 text-xs text-[color:var(--kti-text-dim)]">{L(s.label)}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </MediaSection>

      {/* Services — sticky stacking */}
      <SceneSection
        id="constellations"
        poster={MEDIA.services.poster}
        eyebrow={B("services", "eyebrow", t("sections.constellations"))}
        strong={B("services", "title", t("sections.servicesTitle"))}
        subtitle={B("services", "subtitle", t("sections.servicesSub"))}
      >
        <StickyStackServices items={services || []} />
      </SceneSection>

      {/* Process — Idea to Launch slider */}
      <SceneSection
        id="process"
        eyebrow={B("process", "eyebrow", t("sections.process"))}
        strong={B("process", "title", t("sections.processTitle"))}
        subtitle={B("process", "subtitle", t("sections.processSub"))}
      >
        <IdeaToLaunchSlider />
      </SceneSection>

      {/* Tech / Engine — HUD gauges + stack */}
      <SceneSection
        id="engine"
        poster={MEDIA.tech.poster}
        eyebrow={B("tech", "eyebrow", t("sections.engine"))}
        strong={B("tech", "title", t("sections.techTitle"))}
        subtitle={B("tech", "subtitle", t("sections.techSub"))}
      >
        <div className="space-y-12">
          <GaugeDataViz />
          <TechGrid items={tech || []} />
        </div>
      </SceneSection>

      {/* Cases — horizontal rail */}
      <SceneSection
        id="worlds"
        eyebrow={B("cases", "eyebrow", t("sections.worlds"))}
        strong={B("cases", "title", t("sections.casesTitle"))}
        subtitle={B("cases", "subtitle", t("sections.casesSub"))}
      >
        <Reveal>
          <Link
            to="/cases"
            data-testid="cases-viewall"
            className="kti-focus inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--kti-teal)" }}
          >
            {t("common.viewAll")} <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </SceneSection>
      <HorizontalCasesRail items={cases || []} />

      {/* Secure transmission */}
      <MediaSection
        id="secure"
        media={MEDIA.secure.video}
        poster={MEDIA.secure.poster}
        minH="min-h-[80vh]"
        data-testid="section-secure"
        contentClassName="py-24"
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="kti-eyebrow mb-3">{B("secure", "eyebrow", t("sections.secure"))}</div>
            <TwoToneHeading
              className="text-3xl sm:text-4xl lg:text-5xl"
              strong={B("secure", "title", t("sections.secureTitle"))}
            />
            <p className="mt-5 max-w-md text-base leading-relaxed text-[color:var(--kti-text-dim)] sm:text-lg">
              {B("secure", "subtitle", t("sections.secureSub"))}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <SecureTransmissionDemo />
          </Reveal>
        </div>
      </MediaSection>

      {/* Engagement tiers */}
      <SceneSection
        id="tiers"
        poster={MEDIA.engagement.poster}
        eyebrow={B("tiers", "eyebrow", t("sections.tiers"))}
        strong={B("tiers", "title", t("sections.tiersTitle"))}
        subtitle={B("tiers", "subtitle", t("sections.tiersSub"))}
      >
        <EngagementTiers />
      </SceneSection>

      {/* Crew */}
      <SceneSection
        id="crew"
        eyebrow={B("team", "eyebrow", t("sections.crew"))}
        strong={B("team", "title", t("sections.crewTitle"))}
        subtitle={B("team", "subtitle", t("sections.crewSub"))}
      >
        <CrewGrid items={team || []} />
      </SceneSection>

      {/* Clients */}
      <SceneSection
        id="starmap"
        eyebrow={B("clients", "eyebrow", t("sections.starmap"))}
        strong={B("clients", "title", t("sections.clientsTitle"))}
        subtitle={B("clients", "subtitle", t("sections.clientsSub"))}
      >
        <ClientsGrid items={clients || []} />
      </SceneSection>

      {/* Partners showcase */}
      <PartnersShowcase />

      {/* Phase 19: Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <TestimonialCarousel items={testimonials} />
      )}

      {/* Mission / Contact */}
      <SceneSection
        id="mission"
        eyebrow={B("contact", "eyebrow", t("sections.mission"))}
        strong={B("contact", "title", t("sections.missionTitle"))}
        subtitle={B("contact", "subtitle", t("sections.missionSub"))}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl sm:p-8 lg:col-span-3">
            <ContactForm source="home_contact" />
          </div>
          <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl sm:p-8 lg:col-span-2">
            <DotBadge className="mb-5">{t("contact.infoTitle")}</DotBadge>
            <ul className="space-y-4 text-sm text-[color:var(--kti-text-dim)]">
              {settings?.contact?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="size-4" style={{ color: "var(--kti-teal)" }} />
                  {settings.contact.email}
                </li>
              )}
              {settings?.contact?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="size-4" style={{ color: "var(--kti-teal)" }} />
                  {settings.contact.phone}
                </li>
              )}
              {settings?.contact?.address && (
                <li className="flex items-center gap-3">
                  <MapPin className="size-4" style={{ color: "var(--kti-teal)" }} />
                  {L(settings.contact.address)}
                </li>
              )}
            </ul>
            <GlassPillButton as={Link} to="/contact" variant="secondary" className="mt-7" data-testid="home-contact-page-link">
              {t("common.contactUs")}
            </GlassPillButton>
          </div>
        </div>
      </SceneSection>
    </div>
  );
}
