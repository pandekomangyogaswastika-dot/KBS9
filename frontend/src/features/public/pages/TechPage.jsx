import { useTranslation } from "react-i18next";
import { useFetch } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";
import TechStackGrid from "@/components/content/TechStackGrid";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import SEOHead from "@/components/SEOHead";

export default function TechPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch("/tech");
  return (
    <div data-testid="tech-page">
      <SEOHead
        title={t("nav.tech")}
        description="Tech stack dan tools yang digunakan KTI untuk membangun solusi teknologi berkualitas tinggi: cloud platforms, frameworks, databases, dan development tools terkini."
        type="website"
      />
      <PageHeader eyebrow={t("sections.engine")} title={t("nav.tech")} intro={t("pages.techIntro")} />
      <div className="kti-container pb-24">
        {loading && <LoadingView />}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (data?.length ? <TechStackGrid items={data} /> : <EmptyView />)}
      </div>
    </div>
  );
}
