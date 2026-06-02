import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { HexMark } from "@/components/decor";

export default function PortalComingSoon() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen place-items-center px-6" style={{ background: "#05060A", color: "#E8EAF2" }} data-testid="portal-coming-soon">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 w-fit"><HexMark size={56} /></div>
        <h1 className="font-display text-2xl font-semibold kti-gradient-text">{t("nav.clientLogin")}</h1>
        <p className="mt-4 kti-text-dim">{t("pages.portalSoon")}</p>
        <Link to="/" data-testid="portal-back-home" className="kti-focus mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium hover:bg-white/5">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
