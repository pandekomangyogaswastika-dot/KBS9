import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/apiClient';
import ProductSlider from '@/components/content/ProductSlider';
import ConstellationCanvas from '@/components/effects/ConstellationCanvas';

export default function ProductsPageNew() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: 'var(--kti-space-975)' }}>
        <Loader2 className="size-8 animate-spin" style={{ color: 'var(--kti-indigo)' }} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--kti-space-975)' }}>
      <ConstellationCanvas />
      
      {/* Hero Section */}
      <div className="relative kti-container py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-[-0.04em] text-white">
            Our Products
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-[color:var(--kti-text-dim)]">
            Solusi SaaS dan platform digital yang kami kembangkan untuk berbagai kebutuhan bisnis modern.
          </p>
        </div>
      </div>

      {/* Product Sections */}
      <div className="relative">
        {products.map((product, index) => (
          <ProductSection
            key={product.id}
            product={product}
            index={index}
            isReversed={index % 2 === 1}
          />
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="relative kti-container py-20 text-center">
          <p className="text-[color:var(--kti-text-dim)]">No products available</p>
        </div>
      )}
    </div>
  );
}

function ProductSection({ product, index, isReversed }) {
  const screenshots = product.blocks
    ?.find(b => b.type === 'gallery')?.data?.images || [];
  
  const features = product.blocks
    ?.find(b => b.type === 'features')?.data?.features || [];

  // Prepare slider images
  const sliderImages = screenshots.length > 0 
    ? screenshots 
    : [{ url: product.logo || 'https://images.pexels.com/photos/1109543/pexels-photo-1109543.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }];

  return (
    <section 
      className="relative kti-container py-12 sm:py-20"
      data-testid="product-section"
      style={{
        borderTop: index > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
        marginTop: index > 0 ? '80px' : '0'
      }}
    >
      <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
        
        {/* Slider Side */}
        <div 
          className={`${isReversed ? 'lg:order-2' : 'lg:order-1'}`}
          data-testid="product-slider-container"
        >
          <div className="lg:sticky lg:top-24">
            <ProductSlider images={sliderImages} />
          </div>
        </div>

        {/* Content Side */}
        <div className={`space-y-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
          {/* Logo */}
          {product.logo && (
            <img 
              src={product.logo} 
              alt={product.title}
              className="h-16 w-auto object-contain"
            />
          )}

          {/* Badge */}
          <div>
            <span className="inline-flex items-center rounded-full border border-[rgba(183,168,255,0.35)] bg-[rgba(183,168,255,0.18)] px-3 py-1 text-xs font-hud uppercase tracking-[0.18em] text-[color:var(--kti-product-accent)]">
              SaaS Product
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {product.title}
          </h2>

          {/* Tagline */}
          {product.tagline && (
            <p className="text-xl text-[color:var(--kti-text-dim)]">
              {product.tagline}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-base leading-relaxed text-[color:var(--kti-text-dim)]">
              {product.description}
            </p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-hud uppercase tracking-[0.18em] text-[color:var(--kti-text-faint)]">Key Features</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.slice(0, 6).map((feature, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-1 size-1.5 rounded-full bg-[color:var(--kti-product-accent)] shrink-0" />
                    <span className="text-white">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {product.technology && product.technology.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.technology.map((tech, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-4">
            <a
              href={product.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(183,168,255,0.45)] bg-[rgba(183,168,255,0.22)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-all hover:bg-[rgba(183,168,255,0.32)] hover:scale-[1.02]"
              data-testid="product-cta-button"
            >
              <ExternalLink className="size-4" />
              Visit {product.title}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
