import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/apiClient";

export default function RelatedContent({ currentId, contentType, tags = [], industry, technology = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelated();
  }, [currentId, contentType]);

  const loadRelated = async () => {
    try {
      // Build query params for related content
      const params = {};
      
      // Filter by same industry or technology
      if (industry) params.industry = industry;
      if (technology && technology.length > 0) params.technology = technology[0];

      // Fetch related items
      const endpoint = contentType === "portfolio" ? "/portfolio" 
        : contentType === "case-study" ? "/case-studies"
        : "/products";
      
      const res = await api.get(endpoint, { params });
      const allItems = res.data?.data || [];
      
      // Filter out current item and limit to 3
      const related = allItems
        .filter(item => item.id !== currentId)
        .slice(0, 3);
      
      setItems(related);
    } catch (err) {
      console.error("Failed to load related content", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) return null;

  const getUrl = (item) => {
    if (contentType === "portfolio") return `/portfolio/${item.slug}`;
    if (contentType === "case-study") return `/case-studies/${item.slug}`;
    return `/products/${item.slug}`;
  };

  const getAccentColor = () => {
    if (contentType === "portfolio") return "var(--kti-teal)";
    if (contentType === "case-study") return "var(--kti-indigo)";
    return "var(--kti-electric)";
  };

  return (
    <section className="mt-16 border-t border-white/10 pt-12" data-testid="related-content">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-white">
          Related {contentType === "portfolio" ? "Projects" : contentType === "case-study" ? "Case Studies" : "Products"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => (
          <Link
            key={item.id}
            to={getUrl(item)}
            className="group rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:border-white/15 transition-all"
            data-testid="related-item"
          >
            {/* Thumbnail if available */}
            {(item.hero_media || item.logo) && (
              <div className="aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src={item.hero_media || item.logo}
                  alt={item.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                />
              </div>
            )}

            {/* Content */}
            <div>
              {item.industry && (
                <span 
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mb-2"
                  style={{ 
                    borderColor: `${getAccentColor()}55`,
                    backgroundColor: `${getAccentColor()}22`,
                    color: getAccentColor()
                  }}
                >
                  {item.industry}
                </span>
              )}
              <h3 className="font-semibold text-white group-hover:opacity-80 transition-opacity line-clamp-2">
                {item.title}
              </h3>
              {item.summary && (
                <p className="mt-2 text-sm text-[color:var(--kti-text-dim)] line-clamp-2">
                  {item.summary}
                </p>
              )}

              {/* View Link */}
              <div 
                className="mt-3 flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: getAccentColor() }}
              >
                View Details
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
