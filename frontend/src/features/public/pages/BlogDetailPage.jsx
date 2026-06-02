import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import { PlanetOrb } from "@/components/decor";
import PageHeader from "@/components/PageHeader";
import { LoadingView, ErrorView } from "@/components/StateViews";
import SEOHead, { createArticleSchema } from "@/components/SEOHead";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { data, loading, error, reload } = useFetch(`/blog/${slug}`, [slug]);

  if (loading) return <div className="pt-36"><LoadingView /></div>;
  if (error || !data) return <div className="pt-36"><ErrorView message={error} onRetry={reload} /></div>;

  const schema = createArticleSchema({
    title: L(data.title),
    excerpt: L(data.excerpt),
    image: data.cover_image_url,
    created_at: data.published_at || data.created_at,
    updated_at: data.updated_at,
    author: data.author,
  });

  return (
    <div data-testid="blog-detail-page">
      <SEOHead
        title={L(data.title)}
        description={L(data.excerpt)?.substring(0, 160)}
        type="article"
        image={data.cover_image_url}
        schema={schema}
        article={{
          publishedTime: data.published_at || data.created_at,
          modifiedTime: data.updated_at,
          author: data.author,
          tags: data.tags || [],
        }}
      />
      <PageHeader eyebrow={(data.tags || []).join(" · ")} title={L(data.title)} intro={`${data.author} · ${data.published_at}`} />
      <div className="kti-container max-w-3xl pb-24">
        <Link to="/blog" data-testid="blog-back-link" className="kti-focus mb-8 inline-flex items-center gap-2 text-sm kti-text-dim transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("nav.blog")}
        </Link>
        <div className="mb-8 grid h-52 place-items-center rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <PlanetOrb variant={data.cover || "planet-indigo"} size={120} />
        </div>
        <p className="text-lg leading-relaxed text-[color:var(--kti-text-strong)]">{L(data.body)}</p>
      </div>
    </div>
  );
}
