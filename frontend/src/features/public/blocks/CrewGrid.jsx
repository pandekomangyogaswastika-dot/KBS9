import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Linkedin, Twitter, Github, Globe, Mail } from "lucide-react";
import { CrewAvatar } from "@/components/decor";
import { useContentLocale } from "@/lib/useContentLocale";

/**
 * CrewGrid — versi enhanced.
 *  - Card hover: lift + reveal bio detail + glow border
 *  - Social links (linkedin/twitter/github/website/email) rendered jika tersedia
 *  - Stagger entrance animation
 *  - data-testid pada setiap kontrol penting
 */
export default function CrewGrid({ items = [] }) {
  const { L } = useContentLocale();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
      className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="crew-grid"
    >
      {items.map((m) => (
        <CrewCard key={m.id} member={m} L={L} />
      ))}
    </motion.div>
  );
}

function CrewCard({ member: m, L }) {
  const [ripples, setRipples] = useState([]);
  const cardRef = useRef(null);

  const handleRipple = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  };

  const socials = m.socials || {};

  return (
    <motion.div
      ref={cardRef}
      data-testid={`crew-card-${m.id}`}
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
        },
      }}
      whileHover={{ y: -4 }}
      onClick={handleRipple}
      className="group relative h-full overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 transition-[border-color,box-shadow] duration-300 hover:border-[rgba(115,209,173,0.35)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_24px_rgba(115,209,173,0.18)]"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(closest-side, rgba(115,209,173,0.35), transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          {m.avatar_url ? (
            <img
              src={m.avatar_url}
              alt={m.name}
              className="relative size-24 rounded-full object-cover ring-2 ring-white/15 transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="relative transition-transform duration-300 group-hover:scale-[1.04]">
              <CrewAvatar name={m.name} seed={m.seed} size={96} />
            </div>
          )}
        </div>

        <h3 className="mt-4 font-display text-base font-semibold text-white">
          {m.name}
        </h3>
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: "var(--kti-teal)" }}
        >
          {L(m.role)}
        </p>

        <p className="mt-3 text-xs leading-relaxed text-[color:var(--kti-text-dim)] line-clamp-3 transition-all duration-300 group-hover:line-clamp-none">
          {L(m.bio)}
        </p>

        {/* Social icons */}
        <div
          className="mt-4 flex items-center justify-center gap-2"
          data-testid={`crew-socials-${m.id}`}
        >
          {socials.linkedin && (
            <SocialBtn
              href={socials.linkedin}
              label={`${m.name} on LinkedIn`}
              testId={`crew-linkedin-${m.id}`}
            >
              <Linkedin className="size-3.5" />
            </SocialBtn>
          )}
          {socials.twitter && (
            <SocialBtn
              href={socials.twitter}
              label={`${m.name} on Twitter / X`}
              testId={`crew-twitter-${m.id}`}
            >
              <Twitter className="size-3.5" />
            </SocialBtn>
          )}
          {socials.github && (
            <SocialBtn
              href={socials.github}
              label={`${m.name} on GitHub`}
              testId={`crew-github-${m.id}`}
            >
              <Github className="size-3.5" />
            </SocialBtn>
          )}
          {socials.website && (
            <SocialBtn
              href={socials.website}
              label={`${m.name} website`}
              testId={`crew-website-${m.id}`}
            >
              <Globe className="size-3.5" />
            </SocialBtn>
          )}
          {socials.email && (
            <SocialBtn
              href={`mailto:${socials.email}`}
              label={`Email ${m.name}`}
              testId={`crew-email-${m.id}`}
            >
              <Mail className="size-3.5" />
            </SocialBtn>
          )}
        </div>
      </div>

      {/* Ripple effects */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          initial={{ opacity: 0.3, width: 0, height: 0, x: "-50%", y: "-50%" }}
          animate={{ opacity: 0, width: 480, height: 480 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            left: r.x,
            top: r.y,
            background: "rgba(115,209,173,0.3)",
          }}
        />
      ))}
    </motion.div>
  );
}

function SocialBtn({ href, label, testId, children }) {
  const isExternal = href && !href.startsWith("mailto:") && href !== "#";
  return (
    <a
      href={href || "#"}
      data-testid={testId}
      aria-label={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (!href || href === "#") e.preventDefault();
      }}
      className="kti-focus inline-flex items-center justify-center size-8 rounded-full border border-white/12 bg-white/[0.04] text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.1] hover:text-white hover:border-white/30"
    >
      {children}
    </a>
  );
}
