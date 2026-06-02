import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Boxes, Globe2, Users as UsersIcon, FileText, Briefcase, Inbox, ShieldCheck, Image as ImageIcon, ArrowRight, Cpu, Building2,
} from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { DASH } from "@/constants/testIds";

const STAT_DEFS = [
  { key: "cms_services", labelKey: "nav.services", icon: Boxes },
  { key: "cms_cases", labelKey: "nav.cases", icon: Globe2 },
  { key: "cms_tech", labelKey: "nav.tech", icon: Cpu },
  { key: "cms_team", labelKey: "nav.team", icon: UsersIcon },
  { key: "cms_clients", labelKey: null, fallback: { id: "Klien", en: "Clients" }, icon: Building2 },
  { key: "cms_blog", labelKey: "nav.blog", icon: FileText },
  { key: "cms_careers", labelKey: "nav.career", icon: Briefcase },
  { key: "media_assets", labelKey: "admin.totalMedia", icon: ImageIcon },
];

const leadStatusTone = {
  new: "text-[#a9ecd2]",
  contacted: "text-[#cfc4ff]",
  qualified: "text-[#9fd0ff]",
  won: "text-[#a9ecd2]",
  lost: "text-[#ff96aa]",
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch("/admin/stats");
  const isEN = i18n.language && i18n.language.startsWith("en");

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={reload} />;

  const counts = data?.counts || {};
  const recent = data?.recent_leads || [];

  return (
    <div data-testid={DASH.root}>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("admin.dashboard")}</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{t("admin.overview")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {STAT_DEFS.map((s) => {
          const label = s.labelKey ? t(s.labelKey) : (isEN ? s.fallback.en : s.fallback.id);
          return (
            <div key={s.key} data-testid={DASH.statCard} className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl border border-white/12 bg-white/[0.04]">
                  <s.icon className="size-4" style={{ color: "var(--kti-teal)" }} />
                </span>
              </div>
              <p className="font-display text-3xl font-semibold text-white">{counts[s.key] ?? 0}</p>
              <p className="mt-1 text-xs text-[color:var(--kti-text-dim)]">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.14)]">
              <Inbox className="size-5" style={{ color: "var(--kti-indigo)" }} />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold text-white">{data?.new_leads ?? 0}</p>
              <p className="text-xs text-[color:var(--kti-text-dim)]">{t("admin.newLeads")}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="grid size-8 place-items-center rounded-lg border border-white/12 bg-white/[0.04]"><ShieldCheck className="size-4" style={{ color: "var(--kti-teal)" }} /></span>
            <span className="text-[color:var(--kti-text-dim)]">{counts.system_users ?? 0} {t("admin.totalUsers")}</span>
          </div>
        </div>

        <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("admin.recentLeads")}</h2>
            <Link to="/portal/admin/leads" className="kti-focus inline-flex items-center gap-1 text-xs text-[color:var(--kti-teal)] hover:underline">
              {t("admin.viewAllLeads")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--kti-text-dim)]">{t("admin.noRecentLeads")}</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{l.name}</p>
                    <p className="truncate text-xs text-[color:var(--kti-text-dim)]">{l.email}{l.company ? ` · ${l.company}` : ""}</p>
                  </div>
                  <span className={`shrink-0 font-mono-kti text-[10px] uppercase tracking-wider ${leadStatusTone[l.status] || "text-white/60"}`}>{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
