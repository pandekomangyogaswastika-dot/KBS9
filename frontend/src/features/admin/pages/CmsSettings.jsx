import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useFetch, api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import ResourceForm from "@/features/admin/cms/ResourceForm";
import { SETTINGS_SCHEMA } from "@/features/admin/cms/schemas";

export default function CmsSettings() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch("/admin/cms/settings");
  const [busy, setBusy] = useState(false);

  const save = async (form) => {
    setBusy(true);
    try {
      await api.put("/admin/cms/settings", { data: form });
      toast.success(t("cms.settingsSaved"));
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="cms-settings-form">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("cms.settings")}</h1>
      </div>
      <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        {loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={reload} /> : (
          <ResourceForm
            key={data?.updated_at || "settings"}
            fields={SETTINGS_SCHEMA.fields}
            initial={data || {}}
            onSubmit={save}
            busy={busy}
            showStatus={false}
            submitLabel={t("cms.save")}
          />
        )}
      </div>
    </div>
  );
}
