export default function BlockHero({ data = {} }) {
  const { title, subtitle, summary, ctaText, ctaUrl, backgroundImage } = data;

  return (
    <section
      className="relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-12 sm:px-10 sm:py-16 lg:py-20"
      data-testid="block-hero"
      style={backgroundImage ? {
        backgroundImage: `var(--kti-media-overlay-top), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {subtitle && (
        <p className="mb-4 font-hud text-xs uppercase tracking-[0.28em] text-[color:var(--kti-teal)]">
          {subtitle}
        </p>
      )}
      {title && (
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-[-0.04em] text-white">
          {title}
        </h1>
      )}
      {summary && (
        <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[color:var(--kti-text-dim)]">
          {summary}
        </p>
      )}
      {ctaText && ctaUrl && (
        <a
          href={ctaUrl}
          target={ctaUrl.startsWith('http') ? '_blank' : undefined}
          rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="kti-focus mt-8 inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-colors hover:bg-[rgba(124,104,225,0.32)]"
          data-testid="hero-cta-button"
        >
          {ctaText}
        </a>
      )}
    </section>
  );
}
