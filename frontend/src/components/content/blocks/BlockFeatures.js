import { Check } from "lucide-react";

export default function BlockFeatures({ data = {} }) {
  const { features = [] } = data;

  if (!features || features.length === 0) {
    return null;
  }

  return (
    <section data-testid="block-features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="rounded-[var(--kti-radius-soft)] border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgba(115,209,173,0.18)] border border-[rgba(115,209,173,0.35)]">
              <Check className="size-4" style={{ color: "var(--kti-teal)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              {feature.description && (
                <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">
                  {feature.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
