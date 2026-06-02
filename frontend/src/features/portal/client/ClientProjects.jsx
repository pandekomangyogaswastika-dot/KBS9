import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, AlertCircle, FolderKanban } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { PORTAL } from "@/constants/testIds";

const STATUS_COLOR = {
  active: "#4ECBAF",
  completed: "#7C68E1",
  on_hold: "#F2A83E",
  cancelled: "#E05555",
};

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: "var(--kti-teal)" }} />
    </div>
  );
}

export default function ClientProjects() {
  const { t } = useTranslation();
  const { data: projects, loading, error } = useFetch("/projects", []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;
  if (error) return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="size-10" style={{ color: "#E05555" }} />
      <p className="text-sm text-[color:var(--kti-text-dim)]">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{t("portal.myProjects")}</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{(projects || []).length} {t("portal.projectsTotal")}</p>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] py-20">
          <FolderKanban className="size-12" style={{ color: "var(--kti-text-faint)" }} />
          <p className="text-sm text-[color:var(--kti-text-dim)]">{t("portal.noProjects")}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2" data-testid={PORTAL.projectList}>
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/portal/projects/${p.id}`}
              data-testid={PORTAL.projectCard}
              className="group block rounded-2xl border border-white/8 bg-white/[0.04] p-6 hover:bg-white/[0.07] transition-colors"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono-kti text-[10px] tracking-wider text-[color:var(--kti-text-faint)]">{p.code}</p>
                  <h3 className="mt-1 truncate font-semibold text-white group-hover:text-[color:var(--kti-teal)] transition-colors">{p.name}</h3>
                  {p.summary && <p className="mt-1.5 text-xs text-[color:var(--kti-text-dim)] line-clamp-2">{p.summary}</p>}
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${STATUS_COLOR[p.status] || "#888"}22`, color: STATUS_COLOR[p.status] || "#888", border: `1px solid ${STATUS_COLOR[p.status] || "#888"}44` }}>
                  {t(`portal.status.${p.status}`) || p.status}
                </span>
              </div>

              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[color:var(--kti-text-dim)]">{t("portal.progress")}</span>
                <span className="font-mono-kti text-white">{p.progress ?? 0}%</span>
              </div>
              <ProgressBar value={p.progress ?? 0} />

              <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--kti-text-faint)]">
                <span>{p.start_date ? `Mulai: ${new Date(p.start_date).toLocaleDateString("id-ID")}` : ""}</span>
                <span className="flex items-center gap-1">
                  {p.due_date ? `Tenggat: ${new Date(p.due_date).toLocaleDateString("id-ID")}` : ""}
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
