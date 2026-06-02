import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderKanban, CheckCircle, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";

function StatCard({ icon: Icon, label, value, color, testid }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm" data-testid={testid}>
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/12" style={{ background: `${color}22` }}>
        <Icon className="size-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[color:var(--kti-text-dim)]">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: "var(--kti-teal)" }}
      />
    </div>
  );
}

const STATUS_COLOR = {
  active: "#4ECBAF",
  completed: "#7C68E1",
  on_hold: "#F2A83E",
  cancelled: "#E05555",
};

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, iRes] = await Promise.all([
          api.get("/projects"),
          api.get("/invoices"),
        ]);
        const projs = pRes.data?.data || [];
        const invs = iRes.data?.data || [];
        setProjects(projs);
        setInvoices(invs);

        // Fetch approvals for each project
        const allApprovals = [];
        for (const p of projs) {
          const aRes = await api.get(`/projects/${p.id}/approvals`);
          allApprovals.push(...(aRes.data?.data || []));
        }
        setApprovals(allApprovals);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const unpaidAmount = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const fmtIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Selamat datang, <span style={{ color: "var(--kti-teal)" }}>{user?.name}</span>
        </h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{t("portal.dashboardSub")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FolderKanban} label={t("portal.activeProjects")} value={activeProjects} color="#4ECBAF" testid={PORTAL.dashActiveProjects} />
        <StatCard icon={CheckCircle} label={t("portal.pendingApprovals")} value={pendingApprovals} color="#F2A83E" testid={PORTAL.dashPendingApprovals} />
        <StatCard icon={CreditCard} label={t("portal.unpaidAmount")} value={fmtIDR(unpaidAmount)} color="#E05555" testid={PORTAL.dashUnpaidAmount} />
      </div>

      {/* Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">{t("portal.myProjects")}</h2>
          <Link to="/portal/projects" className="flex items-center gap-1 text-xs text-[color:var(--kti-text-dim)] hover:text-white">
            {t("common.viewAll")} <ArrowRight className="size-3" />
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-[color:var(--kti-text-faint)]">{t("portal.noProjects")}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/portal/projects/${p.id}`}
                data-testid={PORTAL.projectCard}
                className="group block rounded-2xl border border-white/8 bg-white/[0.04] p-5 hover:bg-white/[0.07] transition-colors"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono-kti text-[10px] tracking-wider" style={{ color: "var(--kti-text-faint)" }}>{p.code}</p>
                    <h3 className="mt-0.5 font-semibold text-white group-hover:text-[color:var(--kti-teal)] transition-colors">{p.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${STATUS_COLOR[p.status] || "#888"}22`, color: STATUS_COLOR[p.status] || "#888", border: `1px solid ${STATUS_COLOR[p.status] || "#888"}44` }}>
                    {t(`portal.status.${p.status}`) || p.status}
                  </span>
                </div>
                <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--kti-text-dim)]">
                  <span>{t("portal.progress")}</span>
                  <span>{p.progress ?? 0}%</span>
                </div>
                <ProgressBar value={p.progress ?? 0} />
                {p.due_date && (
                  <p className="mt-3 text-xs text-[color:var(--kti-text-faint)]">
                    Tenggat: {new Date(p.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
