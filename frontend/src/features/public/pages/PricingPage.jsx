import { useTranslation } from "react-i18next";
import { useFetch } from "@/lib/apiClient";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ErrorView, EmptyView } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { data: packages, loading, error, reload } = useFetch("/packages");

  const formatPrice = (price) => {
    if (!price) return "Custom Quote";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
  const sorted = packages?.slice().sort((a, b) => (tierOrder[a.tier] ?? 999) - (tierOrder[b.tier] ?? 999));

  return (
    <div data-testid="pricing-page">
      <SEOHead
        title="Harga & Paket Layanan"
        description="Paket layanan teknologi KTI dengan harga transparan. Mulai dari Starter hingga Enterprise. Konsultasi gratis."
        type="website"
      />
      <PageHeader
        eyebrow={t("sections.pricing")}
        title={lang.startsWith("en") ? "Pricing & Packages" : "Harga & Paket"}
        intro={lang.startsWith("en") ? "Transparent pricing for your digital transformation" : "Harga transparan untuk transformasi digital Anda"}
      />
      
      <div className="kti-container pb-24">
        {loading && <div className="grid gap-6 md:grid-cols-3"><div className="h-96 bg-white/5 animate-pulse rounded-xl" /><div className="h-96 bg-white/5 animate-pulse rounded-xl" /><div className="h-96 bg-white/5 animate-pulse rounded-xl" /></div>}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (!sorted || sorted.length === 0) && <EmptyView message="Paket belum tersedia" />}
        
        {!loading && sorted && sorted.length > 0 && (
          <div className="grid gap-8 md:grid-cols-3">
            {sorted.map((pkg) => (
              <div
                key={pkg.id}
                className={`kti-card relative flex flex-col ${
                  pkg.popular ? 'ring-2 ring-purple-500/50 scale-105' : ''
                }`}
                data-testid={`package-${pkg.tier}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Popular
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="font-display text-2xl mb-2">
                    {lang.startsWith("en") ? pkg.name.en : pkg.name.id}
                  </h3>
                  <p className="text-sm text-white/50 uppercase tracking-wider mb-6">{pkg.tier}</p>
                  
                  <div className="mb-8">
                    <div className="text-4xl font-bold mb-1">
                      {pkg.price_from ? formatPrice(pkg.price_from) + "+" : "Custom"}
                    </div>
                    {pkg.duration && (
                      <p className="text-white/60 text-sm">{pkg.duration}</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/80 text-sm">
                          {lang.startsWith("en") ? feat.en : feat.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <Button
                    onClick={() => navigate('/contact')}
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {pkg.cta_label
                      ? (lang.startsWith("en") ? pkg.cta_label.en : pkg.cta_label.id)
                      : (lang.startsWith("en") ? "Get Started" : "Mulai Sekarang")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-white/60 mb-4">
            {lang.startsWith("en")
              ? "Need a custom solution? Let's discuss your requirements."
              : "Butuh solusi khusus? Mari diskusikan kebutuhan Anda."}
          </p>
          <Button onClick={() => navigate('/contact')} variant="outline">
            {lang.startsWith("en") ? "Contact Sales" : "Hubungi Tim Sales"}
          </Button>
        </div>
      </div>
    </div>
  );
}
