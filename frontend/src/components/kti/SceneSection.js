import { StarLayer } from "@/components/decor";
import { Reveal } from "@/components/kti/Reveal";
import { TwoToneHeading } from "@/components/kti/TwoToneHeading";

// Generic cinematic section. Background = poster image (clipped in its own layer
// so it never traps position:sticky children) + overlay + optional aurora.
// NOTE: the <section> itself is NOT overflow-hidden so sticky stacks work.
export const SceneSection = ({
  id,
  poster,
  aurora = true,
  eyebrow,
  strong,
  dim,
  subtitle,
  children,
  className = "",
  testid,
}) => {
  return (
    <section
      id={id}
      data-testid={testid || (id ? `section-${id}` : undefined)}
      className={`relative kti-section ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {poster ? (
          <>
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 kti-overlay-top" />
            {aurora && <div className="absolute inset-0 kti-aurora opacity-50" />}
          </>
        ) : (
          <StarLayer />
        )}
      </div>
      <div className="relative z-10 kti-container">
        {(eyebrow || strong || dim || subtitle) && (
          <Reveal className="mb-10 max-w-2xl sm:mb-14">
            {eyebrow && <div className="kti-eyebrow mb-3">{eyebrow}</div>}
            {(strong || dim) && (
              <TwoToneHeading className="text-3xl sm:text-4xl lg:text-5xl" strong={strong} dim={dim} />
            )}
            {subtitle && (
              <p className="mt-4 text-base leading-relaxed text-[color:var(--kti-text-dim)] sm:text-lg">
                {subtitle}
              </p>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
};
