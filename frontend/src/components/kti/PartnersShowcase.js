import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/apiClient";
import { track } from "@/lib/analyticsTracker";

/**
 * PartnersShowcase
 *  - Fetch from /api/partners (CMS-managed); fallback to local placeholders.
 *  - Hover: grayscale → color + tooltip
 *  - Logo source priority:
 *      1) partner.logo_url (Media Library / direct URL)
 *      2) simple-icons CDN via partner.slug_icon + logo_color
 *      3) Text fallback (initial / name)
 */
const FALLBACK_PARTNERS = [
  { name: "Microsoft", slug_icon: "microsoft", logo_color: "FFFFFF" },
  { name: "AWS", slug_icon: "amazonwebservices", logo_color: "FF9900" },
  { name: "Google Cloud", slug_icon: "googlecloud", logo_color: "4285F4" },
  { name: "MongoDB", slug_icon: "mongodb", logo_color: "47A248" },
  { name: "Docker", slug_icon: "docker", logo_color: "2496ED" },
  { name: "GitHub", slug_icon: "github", logo_color: "FFFFFF" },
  { name: "Vercel", slug_icon: "vercel", logo_color: "FFFFFF" },
  { name: "Cloudflare", slug_icon: "cloudflare", logo_color: "F38020" },
];

export default function PartnersShowcase({
  title = "Partner & Kolaborasi",
  eyebrow = "Trusted by",
  subtitle = "Kami bekerja sama dengan platform teknologi kelas dunia untuk menghadirkan solusi yang reliable dan modern.",
}) {
  const [partners, setPartners] = useState(FALLBACK_PARTNERS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get("/partners")
      .then((res) => {
        const list = res.data?.data || [];
        if (mounted && Array.isArray(list) && list.length > 0) {
          setPartners(list);
        }
      })
      .catch(() => {
        // Keep fallback partners
      })
      .finally(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className="relative kti-section"
      data-testid="partners-showcase"
      data-loaded={loaded ? "true" : "false"}
      aria-label="Our partners"
    >
      <div className="kti-container">
        <div className="max-w-2xl mb-10">
          <div className="kti-eyebrow mb-3">{eyebrow}</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-[color:var(--kti-text-dim)] max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        <TooltipProvider delayDuration={150}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
          >
            {partners.map((p, i) => (
              <PartnerLogo
                key={p.id || p.name || i}
                partner={p}
                index={i}
              />
            ))}
          </motion.div>
        </TooltipProvider>
      </div>
    </section>
  );
}

function PartnerLogo({ partner, index }) {
  const [broken, setBroken] = useState(false);

  // Build the logo src with priority: logo_url > simple-icons CDN
  const url = partner.logo_url ||
    (partner.slug_icon
      ? `https://cdn.simpleicons.org/${partner.slug_icon}/${partner.logo_color || "FFFFFF"}`
      : null);

  const Inner = (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        },
      }}
      whileHover={{ y: -3 }}
      data-testid={`partner-logo-${index}`}
      data-partner-name={partner.name}
      aria-label={partner.name}
      onMouseEnter={() =>
        track({
          event_type: "hover",
          target_type: "partner",
          target_id: partner.id,
          target_slug: partner.slug_icon || partner.name,
        })
      }
      className="group relative grid h-24 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl transition-[border-color,background-color] duration-200 hover:border-white/20 hover:bg-white/[0.08]"
    >
      {broken || !url ? (
        <span className="font-display text-sm font-semibold text-white/90">
          {partner.name}
        </span>
      ) : (
        <img
          src={url}
          alt={partner.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-9 sm:h-10 w-auto object-contain transition-all duration-300 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
        />
      )}
    </motion.div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {partner.website ? (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track({
                event_type: "cta",
                target_type: "partner",
                target_id: partner.id,
                target_slug: partner.slug_icon || partner.name,
              })
            }
            className="kti-focus block rounded-2xl"
          >
            {Inner}
          </a>
        ) : (
          Inner
        )}
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="border border-white/10 bg-[#0B0D17] text-xs"
      >
        {partner.name}
      </TooltipContent>
    </Tooltip>
  );
}
