import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LoadingView({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center" data-testid="state-loading">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#7C68E1" }} />
      <p className="kti-text-dim text-sm">{label || t("common.loading")}</p>
    </div>
  );
}

export function ErrorView({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center" data-testid="state-error">
      <AlertTriangle className="h-7 w-7" style={{ color: "#FF5C7A" }} />
      <p className="text-sm" style={{ color: "#E8EAF2" }}>{message || t("common.error")}</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="state-error-retry" className="kti-focus rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyView({ message }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center" data-testid="state-empty">
      <Inbox className="h-7 w-7 kti-text-dim" />
      <p className="kti-text-dim text-sm">{message || t("common.empty")}</p>
    </div>
  );
}
