export default function BlockCTA({ data = {} }) {
  const { title, description, buttonText, buttonUrl, style = "primary" } = data;

  const styleClasses = {
    primary: "border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] hover:bg-[rgba(124,104,225,0.32)] shadow-[var(--kti-glow-indigo)]",
    teal: "border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.18)] hover:bg-[rgba(115,209,173,0.28)] shadow-[var(--kti-glow-teal)]",
    ghost: "border-white/15 bg-white/6 hover:bg-white/10"
  };

  return (
    <section
      data-testid="block-cta"
      className="relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-12 sm:px-10 sm:py-14 text-center"
    >
      {title && (
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-4 text-base leading-relaxed text-[color:var(--kti-text-dim)] max-w-2xl mx-auto">
          {description}
        </p>
      )}
      {buttonText && buttonUrl && (
        <a
          href={buttonUrl}
          target={buttonUrl.startsWith('http') ? '_blank' : undefined}
          rel={buttonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`kti-focus mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-white transition-colors ${styleClasses[style] || styleClasses.primary}`}
          data-testid="cta-button"
        >
          {buttonText}
        </a>
      )}
    </section>
  );
}
