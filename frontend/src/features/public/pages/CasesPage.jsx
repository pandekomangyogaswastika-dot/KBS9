import { useTranslation } from "react-i18next";
import { useFetch } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";
import CasesGrid from "@/features/public/blocks/CasesGrid";
import { ErrorView, EmptyView } from "@/components/StateViews";
import { CasesGridSkeleton } from "@/components/SkeletonLoaders";
import SEOHead from "@/components/SEOHead";

export default function CasesPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch("/cases");
  return (
    <div data-testid="cases-page">
      <SEOHead
        title={t("nav.cases")}
        description="Studi kasus dan proyek sukses transformasi digital KTI. Lihat bagaimana kami membantu klien mencapai tujuan bisnis mereka dengan solusi teknologi inovatif."
        type="website"
      />
      <PageHeader eyebrow={t("sections.worlds")} title={t("nav.cases")} intro={t("pages.casesIntro")} />
      <div className="kti-container pb-24">
        {loading && <CasesGridSkeleton count={6} />}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (data?.length ? <CasesGrid items={data} /> : <EmptyView />)}
      </div>
    </div>
  );
}
