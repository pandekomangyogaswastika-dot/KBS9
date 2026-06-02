import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, TrendingUp, Users, FolderKanban, CreditCard, Bot, ClipboardList } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "@/lib/apiClient";

const fmtIDR = (n) => {
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};

const CHART_COLORS = {
  indigo: "#7C68E1",
  teal: "#4ECBAF",
  amber: "#F2A83E",
  red: "#E05555",
  purple: "#9D8AF5",
};

const CUSTOM_TOOLTIP_STYLE = {
  background: "#0D0F1A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#E8EAF2",
  fontSize: "12px",
};

function KpiCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/12" style={{ background: `${color}22` }}>
        <Icon className="size-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[color:var(--kti-text-dim)]">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-20 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold text-white">{value}</p>
        )}
        {sub && <p className="mt-0.5 text-[11px] text-[color:var(--kti-text-faint)]">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
      <h3 className="mb-4 font-semibold text-white">{title}</h3>
      <div className="min-h-[220px]">
        {children}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [leadsTrend, setLeadsTrend] = useState([]);
  const [aiTrend, setAiTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ovRes, fnRes, ltRes, atRes, rtRes] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/analytics/funnel"),
          api.get("/analytics/leads-trend?days=30"),
          api.get("/analytics/ai-trend?days=14"),
          api.get("/analytics/revenue-trend?months=6"),
        ]);
        setOverview(ovRes.data?.data);
        setFunnel(fnRes.data?.data || []);
        setLeadsTrend(ltRes.data?.data || []);
        setAiTrend(atRes.data?.data || []);
        setRevenueTrend(rtRes.data?.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const ms = overview?.milestones;
  const milestoneData = ms ? [
    { name: "Selesai", value: ms.done, color: CHART_COLORS.teal },
    { name: "Berjalan", value: ms.in_progress, color: CHART_COLORS.indigo },
    { name: "Belum", value: ms.todo, color: "#333" },
  ] : [];

  const approvalData = overview?.approvals ? [
    { name: "Pending", value: overview.approvals.pending, color: CHART_COLORS.amber },
    { name: "Disetujui", value: overview.approvals.approved, color: CHART_COLORS.teal },
    { name: "Signed", value: overview.approvals.signed, color: CHART_COLORS.indigo },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={CUSTOM_TOOLTIP_STYLE} className="px-3 py-2 shadow-xl">
        <p className="mb-1 font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 1000000 ? fmtIDR(p.value) : p.value}</span></p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">Ringkasan performa platform KTI secara real-time</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Total Leads" value={overview?.leads?.total ?? 0} sub={`${overview?.leads?.this_month ?? 0} bulan ini`} color={CHART_COLORS.indigo} loading={loading} />
        <KpiCard icon={ClipboardList} label="Assessment" value={`${overview?.assessment?.conversion_rate ?? 0}%`} sub={`${overview?.assessment?.submitted ?? 0}/${overview?.assessment?.total ?? 0} submitted`} color={CHART_COLORS.teal} loading={loading} />
        <KpiCard icon={FolderKanban} label="Proyek Aktif" value={overview?.projects?.active ?? 0} sub={`avg ${overview?.projects?.avg_progress ?? 0}% progress`} color={CHART_COLORS.amber} loading={loading} />
        <KpiCard icon={CreditCard} label="Revenue Lunas" value={overview ? fmtIDR(overview.revenue.paid) : "—"} sub={`${fmtIDR(overview?.revenue?.unpaid ?? 0)} pending`} color={CHART_COLORS.teal} loading={loading} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Klien Aktif" value={overview?.users?.active_clients ?? 0} sub={`${overview?.users?.clients ?? 0} total klien`} color={CHART_COLORS.purple} loading={loading} />
        <KpiCard icon={Bot} label="Percakapan AI" value={overview?.ai?.total ?? 0} sub={`${overview?.ai?.this_week ?? 0} minggu ini`} color={CHART_COLORS.indigo} loading={loading} />
        <KpiCard icon={ClipboardList} label="Approval Signed" value={overview?.approvals?.signed ?? 0} sub={`${overview?.approvals?.pending ?? 0} menunggu`} color={CHART_COLORS.teal} loading={loading} />
        <KpiCard icon={FolderKanban} label="Milestone Selesai" value={overview?.milestones?.done ?? 0} sub={`${overview?.milestones?.in_progress ?? 0} berjalan`} color={CHART_COLORS.amber} loading={loading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Funnel */}
        <ChartCard title="Lead Funnel">
          {loading ? <div className="h-52 animate-pulse rounded-xl bg-white/5" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: "#6B7491", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" tick={{ fill: "#9BA3BF", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Jumlah" radius={[0, 6, 6, 0]}>
                  {funnel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Revenue Trend */}
        <ChartCard title="Revenue 6 Bulan">
          {loading ? <div className="h-52 animate-pulse rounded-xl bg-white/5" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueTrend} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#6B7491", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7491", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1e6 ? `${v/1e6}jt` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#9BA3BF" }} />
                <Bar dataKey="paid" name="Lunas" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} stackId="rev" />
                <Bar dataKey="unpaid" name="Belum Lunas" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} stackId="rev" />
                <Bar dataKey="overdue" name="Terlambat" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} stackId="rev" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Usage Trend */}
        <div className="lg:col-span-2">
          <ChartCard title="Penggunaan AI (14 Hari)">
            {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/5" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={aiTrend} margin={{ left: 0, right: 10 }}>
                  <defs>
                    <linearGradient id="gradPublic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPortal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7491", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7491", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#9BA3BF" }} />
                  <Area type="monotone" dataKey="public" name="Publik" stroke={CHART_COLORS.teal} fill="url(#gradPublic)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="portal" name="Portal" stroke={CHART_COLORS.indigo} fill="url(#gradPortal)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Milestone Donut */}
        <ChartCard title="Status Milestone">
          {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/5" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={milestoneData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {milestoneData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#9BA3BF" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Leads Trend */}
      <ChartCard title="Tren Leads 30 Hari">
        {loading ? <div className="h-36 animate-pulse rounded-xl bg-white/5" /> : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={leadsTrend} margin={{ left: 0, right: 10 }}>
              <defs>
                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#6B7491", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "#6B7491", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke={CHART_COLORS.indigo} fill="url(#gradLeads)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
