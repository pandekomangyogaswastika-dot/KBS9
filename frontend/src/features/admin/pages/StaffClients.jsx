import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search, Building2, ChevronRight, Loader2, AlertCircle,
  FolderKanban, ClipboardList, CheckCircle2, User, X, Plus,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";

const statusCfg = {
  active: { label: "Aktif", cls: "bg-[rgba(78,203,175,0.15)] text-[#4ECBAF] border-[rgba(78,203,175,0.3)]" },
  inactive: { label: "Nonaktif", cls: "bg-white/[0.05] text-white/40 border-white/10" },
};

export default function StaffClients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      const res = await api.get(`/admin/clients?${params}`);
      setClients(res.data?.data || []);
    } catch (err) { setError(apiError(err, "Gagal memuat data klien")); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (v) => {
    setSearch(v);
    setTimeout(() => load(), 100); // debounce via useEffect
  };

  if (error) return <div className="flex min-h-[40vh] items-center justify-center gap-3"><AlertCircle className="size-8" style={{ color: "#E05555" }} /><p>{error}</p></div>;

  return (
    <div data-testid="staff-clients-page">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">Manajemen Klien</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{clients.length} klien terdaftar</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Cari nama, email, perusahaan..."
            data-testid="clients-search"
            className="w-full kti-focus rounded-xl border border-white/12 bg-white/[0.04] pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/30"
          />
          {search && <button onClick={() => { setSearch(""); setTimeout(load, 50); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><X className="size-4" /></button>}
        </div>
        <div className="flex gap-2">
          {[["", "Semua"], ["active", "Aktif"], ["inactive", "Nonaktif"]].map(([v, label]) => (
            <button key={v} onClick={() => { setFilterStatus(v); setTimeout(load, 50); }} className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${ filterStatus === v ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10 text-white/50 hover:text-white" }`}>{label}</button>
          ))}
        </div>
        <button onClick={load} className="rounded-full border border-white/12 px-4 py-2.5 text-xs font-medium text-white/60 hover:text-white">Cari</button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] py-20">
          <Building2 className="size-12 text-white/20" />
          <p className="text-sm text-[color:var(--kti-text-dim)]">{t("portal.noClients")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04]">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/8 px-5 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
            <span>Nama / Perusahaan</span>
            <span>Email</span>
            <span>Status</span>
            <span>Proyek</span>
            <span>Assessment</span>
            <span />
          </div>
          <div className="divide-y divide-white/8">
            {clients.map((c) => {
              const sCfg = statusCfg[c.status] || statusCfg.inactive;
              const initials = (c.name || "?")[0].toUpperCase();
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/portal/admin/clients/${c.id}`)}
                  data-testid={`client-row-${c.id}`}
                  className="w-full sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] flex flex-col gap-2 items-start sm:items-center sm:gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-[rgba(124,104,225,0.18)] text-sm font-bold text-white">{initials}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-[color:var(--kti-text-dim)] truncate">{c.company}</p>}
                    </div>
                  </div>
                  {/* Email */}
                  <p className="text-sm text-[color:var(--kti-text-dim)] truncate hidden sm:block">{c.email}</p>
                  {/* Status */}
                  <div className="sm:block">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
                  </div>
                  {/* Projects */}
                  <div className="hidden sm:flex items-center gap-1.5 text-sm text-[color:var(--kti-text-dim)]">
                    <FolderKanban className="size-4 text-white/30" />{c.project_count ?? 0}
                  </div>
                  {/* Assessments */}
                  <div className="hidden sm:flex items-center gap-1.5 text-sm text-[color:var(--kti-text-dim)]">
                    <ClipboardList className="size-4 text-white/30" />{c.assessment_count ?? 0}
                    {c.assessment_submitted > 0 && <span className="text-[10px] text-[#73D1AD]">({c.assessment_submitted} selesai)</span>}
                  </div>
                  {/* Arrow */}
                  <ChevronRight className="size-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0 hidden sm:block" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
