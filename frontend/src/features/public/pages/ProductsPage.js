import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Loader2, ArrowRight, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/apiClient";
import ProductSlider from "@/components/content/ProductSlider";

const CATEGORIES = [
  { value: "", label: "Semua" },
  { value: "SaaS", label: "SaaS" },
  { value: "Platform", label: "Platform" },
  { value: "Tool", label: "Tool" },
  { value: "Service", label: "Service" },
];

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      const res = await api.get("/products", { params });
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24" data-testid="products-page">
      {/* Hero Section */}
      <section className="relative kti-container pt-12 pb-12 sm:pt-16 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-3xl"
        >
          <div className="kti-eyebrow mb-3">SaaS Showcase</div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-[-0.04em] text-white">
            Produk Kami
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[color:var(--kti-text-dim)]">
            Solusi SaaS dan platform digital yang kami kembangkan untuk berbagai
            kebutuhan bisnis modern — dari logistik, manajemen pelanggan, hingga
            sistem operasional.
          </p>
        </motion.div>

        {/* Category filter pills */}
        <div
          className="mt-8 flex flex-wrap items-center gap-2"
          data-testid="products-category-filter"
        >
          <SlidersHorizontal className="size-4 text-[color:var(--kti-text-faint)] mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value || "all"}
              onClick={() => setCategory(cat.value)}
              data-testid={`products-category-pill-${cat.value || "all"}`}
              data-active={category === cat.value ? "true" : "false"}
              className={`kti-focus rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === cat.value
                  ? "border-[rgba(183,168,255,0.45)] bg-[rgba(183,168,255,0.22)] text-white"
                  : "border-white/10 bg-white/[0.04] text-[color:var(--kti-text-dim)] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Product Sections */}
      <div className="relative" data-testid="products-showcase">
        {loading ? (
          <div className="kti-container py-20 grid place-items-center">
            <Loader2
              className="size-8 animate-spin"
              style={{ color: "var(--kti-indigo)" }}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="kti-container py-20 text-center">
            <p className="text-[color:var(--kti-text-dim)]">
              Belum ada produk pada kategori ini.
            </p>
            {category && (
              <button
                onClick={() => setCategory("")}
                className="kti-focus mt-4 text-sm text-[color:var(--kti-product-accent)] hover:underline"
              >
                Tampilkan semua produk
              </button>
            )}
          </div>
        ) : (
          products.map((product, index) => (
            <ProductShowcaseSection
              key={product.id}
              product={product}
              index={index}
              isReversed={index % 2 === 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProductShowcaseSection({ product, index, isReversed }) {
  const galleryBlock = product.blocks?.find((b) => b.type === "gallery");
  const featuresBlock = product.blocks?.find((b) => b.type === "features");

  const screenshots = galleryBlock?.data?.images || [];
  const features = featuresBlock?.data?.features || [];

  // Fallback image so slider tetap bagus untuk produk tanpa screenshot
  const fallbackImage = {
    url: product.cover_image
      || product.hero_media
      || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
  };
  const sliderImages = screenshots.length > 0 ? screenshots : [fallbackImage];

  return (
    <motion.section
      data-testid={`product-showcase-${product.slug || index}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="relative kti-container py-12 sm:py-20"
      style={{
        borderTop: index > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
        marginTop: index > 0 ? "80px" : "0",
      }}
    >
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Slider Side */}
        <div
          className={isReversed ? "lg:order-2" : "lg:order-1"}
          data-testid="product-slider-container"
        >
          <div className="lg:sticky lg:top-28">
            <ProductSlider images={sliderImages} />
          </div>
        </div>

        {/* Content Side */}
        <div
          className={`space-y-6 ${
            isReversed ? "lg:order-1" : "lg:order-2"
          }`}
        >
          {product.logo && (
            <img
              src={product.logo}
              alt={product.title}
              className="h-14 w-auto object-contain"
              loading="lazy"
            />
          )}

          <div>
            <span className="inline-flex items-center rounded-full border border-[rgba(183,168,255,0.35)] bg-[rgba(183,168,255,0.18)] px-3 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-product-accent)]">
              {product.category || "SaaS Product"}
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {product.title}
          </h2>

          {product.tagline && (
            <p className="text-lg sm:text-xl text-[color:var(--kti-text-dim)]">
              {product.tagline}
            </p>
          )}

          {product.description && (
            <p className="text-base leading-relaxed text-[color:var(--kti-text-dim)]">
              {product.description}
            </p>
          )}

          {features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">
                Key Features
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.slice(0, 6).map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    data-testid="product-feature-item"
                  >
                    <div className="mt-1 size-1.5 rounded-full bg-[color:var(--kti-product-accent)] shrink-0" />
                    <span className="text-white">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.technology && product.technology.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.technology.map((tech, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {product.external_url && (
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`product-cta-${product.slug || index}`}
                className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(183,168,255,0.45)] bg-[rgba(183,168,255,0.22)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-all hover:bg-[rgba(183,168,255,0.32)] hover:scale-[1.02]"
              >
                <ExternalLink className="size-4" />
                Kunjungi {product.title}
              </a>
            )}
            <a
              href={`/products/${product.slug}`}
              data-testid={`product-detail-link-${product.slug || index}`}
              className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.1] transition-colors"
            >
              Lihat Detail
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
