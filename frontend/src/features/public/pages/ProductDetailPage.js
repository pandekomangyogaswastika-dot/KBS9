import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import BlocksRenderer from "@/components/content/BlocksRenderer";
import RelatedContent from "@/components/content/RelatedContent";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setItem(res.data?.data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--kti-space-975)" }}>
        <Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen grid place-items-center px-6" style={{ background: "var(--kti-space-975)" }}>
        <div className="text-center">
          <p className="text-[color:var(--kti-text-dim)]">{t("common.notFound")}</p>
          <Link to="/products" className="kti-focus mt-4 inline-block text-[color:var(--kti-product-accent)] hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--kti-space-975)" }}>
      <div className="kti-container py-10 sm:py-16">
        <Link
          to="/products"
          className="kti-focus inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white mb-8"
          data-testid="product-back-link"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            {item.logo && (
              <img src={item.logo} alt={item.title} className="h-16 mx-auto mb-6" />
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(183,168,255,0.35)] bg-[rgba(183,168,255,0.18)] px-3 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-product-accent)]">
              SaaS Product
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white">{item.title}</h1>
            {item.tagline && (
              <p className="mt-4 text-lg sm:text-xl text-[color:var(--kti-text-dim)] max-w-2xl mx-auto">
                {item.tagline}
              </p>
            )}
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="kti-focus mt-8 inline-flex items-center gap-2 rounded-full border border-[rgba(183,168,255,0.45)] bg-[rgba(183,168,255,0.22)] px-6 py-3 text-sm font-semibold text-white hover:bg-[rgba(183,168,255,0.32)]"
                data-testid="product-external-link"
              >
                <ExternalLink className="size-4" />
                Visit Product Website
              </a>
            )}
          </div>

          {/* Content Blocks */}
          <div data-testid="product-content">
            <BlocksRenderer blocks={item.blocks || []} />
            
            {/* Related Content */}
            <RelatedContent
              currentId={item.id}
              contentType="product"
              tags={item.tags}
              category={item.category}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
