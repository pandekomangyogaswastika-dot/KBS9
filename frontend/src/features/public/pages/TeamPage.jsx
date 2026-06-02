import { useTranslation } from "react-i18next";
import { useFetch } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";
import CrewGrid from "@/features/public/blocks/CrewGrid";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import SEOHead from "@/components/SEOHead";

export default function TeamPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch("/team");
  return (
    <div data-testid="team-page">
      <SEOHead
        title={t("nav.team")}
        description="Tim profesional KTI — engineers, developers, consultants, dan experts yang berdedikasi untuk memberikan solusi teknologi terbaik bagi klien kami."
        type="website"
      />
      <PageHeader eyebrow={t("sections.crew")} title={t("nav.team")} intro={t("pages.teamIntro")} />
      <div className="kti-container pb-24">
        {loading && <LoadingView />}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (data?.length ? <CrewGrid items={data} /> : <EmptyView />)}
      </div>
    </div>
  );
}
