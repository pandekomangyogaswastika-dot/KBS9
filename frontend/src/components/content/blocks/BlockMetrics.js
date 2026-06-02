export default function BlockMetrics({ data = {} }) {
  const { metrics = [] } = data;

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <section data-testid="block-metrics" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-[var(--kti-radius-soft)] border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 text-center"
        >
          <div className="font-display text-3xl sm:text-4xl font-bold text-[color:var(--kti-teal)]">
            {metric.value}
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[color:var(--kti-text-dim)]">
            {metric.label}
          </p>
        </div>
      ))}
    </section>
  );
}
