/**
 * AdminDemoSessions.jsx — Halaman monitoring sesi demo aktif.
 * Menampilkan: active sessions, total leads dari demo, statistik per app_slug.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  MonitorPlay, RefreshCw, Trash2, Clock, Users, TrendingUp,
  Building2, Mail, PlayCircle, CheckCircle2, XCircle,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function StatCard({ icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-900/30 border-indigo-800/50 text-indigo-400",
    green: "bg-green-900/30 border-green-800/50 text-green-400",
    amber: "bg-amber-900/30 border-amber-800/50 text-amber-400",
    purple: "bg-purple-900/30 border-purple-800/50 text-purple-400",
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colors[color]}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-current/10`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-neutral-400">{label}</p>
        {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SessionRow({ session, onDelete }) {
  const expires = new Date(session.expires_at);
  const now = new Date();
  const isActive = expires > now;
  const remainingMs = expires - now;
  const remainingMin = Math.max(0, Math.floor(remainingMs / 60000));

  return (
    <tr
      data-testid="demo-session-row"
      className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {isActive
            ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-neutral-600 flex-shrink-0" />}
          <div>
            <p className="text-sm font-medium text-white">{session.name}</p>
            <p className="text-xs text-neutral-400">{session.email}</p>
            {session.company && <p className="text-xs text-neutral-500">{session.company}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 text-xs font-mono">
          <PlayCircle className="w-3 h-3" />{session.app_slug}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="text-xs text-neutral-400">
          {format(new Date(session.created_at), "dd MMM, HH:mm", { locale: localeId })}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: localeId })}
        </div>
      </td>
      <td className="py-3 px-4">
        {isActive ? (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Clock className="w-3 h-3" />
            <span>{remainingMin} menit lagi</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-600">Expired</span>
        )}
      </td>
      <td className="py-3 px-4">
        {session.seed_summary && (
          <div className="text-xs text-neutral-400">
            {session.seed_summary.products}p · {session.seed_summary.orders}o · {session.seed_summary.warehouses}g
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          data-testid="demo-session-delete"
          onClick={() => onDelete(session.id)}
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
          title="Hapus sesi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function AdminDemoSessions() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [demoLeads, setDemoLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      // Active sessions
      const sRes = await fetch(`${BACKEND_URL}/api/demo/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sData = await sRes.json();
      setSessions(sData.sessions || []);

      // Demo leads (source=demo_gate)
      const lRes = await fetch(`${BACKEND_URL}/api/admin/leads?source=demo_gate&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lData = await lRes.json();
      setDemoLeads(lData.data || lData || []);
    } catch (err) {
      toast.error("Gagal memuat data demo sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (sessionId) => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Sesi demo dihapus");
      await load();
    } catch {
      toast.error("Gagal menghapus sesi");
    }
  };

  const activeCount = sessions.filter(s => new Date(s.expires_at) > new Date()).length;
  const totalLeads = demoLeads.length;
  const slugCounts = sessions.reduce((acc, s) => {
    acc[s.app_slug] = (acc[s.app_slug] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/50 flex items-center justify-center">
            <MonitorPlay className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Demo Sessions</h1>
            <p className="text-xs text-neutral-400">Monitoring sesi demo sandbox aktif & leads</p>
          </div>
        </div>
        <button
          data-testid="demo-sessions-refresh"
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-300 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<MonitorPlay className="w-5 h-5" />}
          label="Sesi Aktif"
          value={activeCount}
          sub={`dari ${sessions.length} total`}
          color="green"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Leads Demo"
          value={totalLeads}
          sub="dari gate form"
          color="indigo"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Sesi"
          value={sessions.length}
          sub="semua waktu"
          color="purple"
        />
        <StatCard
          icon={<PlayCircle className="w-5 h-5" />}
          label="App Demo"
          value={Object.keys(slugCounts).length}
          sub={Object.entries(slugCounts).map(([k, v]) => `${k}: ${v}`).join(", ") || "-"}
          color="amber"
        />
      </div>

      {/* Active Sessions Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Sesi Aktif & Riwayat
          </h2>
          <span className="text-xs text-neutral-500">{sessions.length} entri</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Belum ada sesi demo. Akan muncul saat user mencoba demo via gate form.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" data-testid="demo-sessions-table">
              <thead>
                <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="py-2 px-4">User</th>
                  <th className="py-2 px-4">App</th>
                  <th className="py-2 px-4">Dibuat</th>
                  <th className="py-2 px-4">Sisa Waktu</th>
                  <th className="py-2 px-4">Seed</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <SessionRow key={s.id} session={s} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demo Leads */}
      {demoLeads.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Leads dari Demo Gate Form
            </h2>
            <span className="text-xs text-neutral-500">{demoLeads.length} entri</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="py-2 px-4">Nama</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Perusahaan</th>
                  <th className="py-2 px-4">App Demo</th>
                  <th className="py-2 px-4">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {demoLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                    <td className="py-3 px-4 text-sm text-white">{lead.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">{lead.email}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400">{lead.company || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300">
                        {lead.demo_app || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-500">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: localeId })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
