import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Search, X, Loader2, ChevronRight, Phone, Mail, Building2, User,
  MessageSquare, Calendar, ArrowRight, UserCheck, Plus, Clock,
  CheckCircle2, XCircle, AlertCircle, Star, Megaphone, FileQuestion,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { LEADS } from "@/constants/testIds";

const STAGES = [
  { key: "new", label: "New", color: "#9fd0ff", bg: "rgba(159,208,255,0.12)", border: "rgba(159,208,255,0.3)" },
  { key: "contacted", label: "Contacted", color: "#cfc4ff", bg: "rgba(207,196,255,0.12)", border: "rgba(207,196,255,0.3)" },
  { key: "qualified", label: "Qualified", color: "#ffd580", bg: "rgba(255,213,128,0.12)", border: "rgba(255,213,128,0.3)" },
  { key: "proposal", label: "Proposal", color: "#ff9f6e", bg: "rgba(255,159,110,0.12)", border: "rgba(255,159,110,0.3)" },
  { key: "won", label: "Won", color: "#73D1AD", bg: "rgba(115,209,173,0.12)", border: "rgba(115,209,173,0.3)" },
  { key: "lost", label: "Lost", color: "#ff96aa", bg: "rgba(255,92,122,0.1)", border: "rgba(255,92,122,0.3)" },
];

const EVENT_TYPES = [
  { value: "note", label: "Catatan", icon: MessageSquare },
  { value: "call", label: "Telepon", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Calendar },
];

const SOURCE_LABELS = {
  contact_form: "Contact Form",
  assessment: "Assessment",
  demo_gate: "Demo Gate",
  manual: "Manual",
};

function StageBadge({ stage }) {
  const s = STAGES.find((x) => x.key === stage) || STAGES[0];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >{s.label}</span>
  );
}

function LeadCard({ lead, onClick }) {
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("id", { day: "2-digit", month: "short" }); } catch { return ""; } };
  return (
    <button
      onClick={() => onClick(lead)}
      data-testid={`lead-card-${lead.id}`}
      className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:border-white/20 hover:bg-white/[0.07] transition-all group"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">{lead.name}</p>
          {lead.company && <p className="text-xs text-[color:var(--kti-text-dim)] truncate">{lead.company}</p>}
        </div>
        <ChevronRight className="size-4 shrink-0 text-white/20 group-hover:text-white/50 transition-colors mt-0.5" />
      </div>
      <p className="mb-2.5 text-xs text-[color:var(--kti-text-dim)] line-clamp-2">{lead.message}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-white/35">{fmtDate(lead.created_at)}</span>
        {lead.source && (
          <span className="rounded-full bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
            {SOURCE_LABELS[lead.source] || lead.source}
          </span>
        )}
      </div>
    </button>
  );
}

function LeadDrawer({ lead, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [converting, setConverting] = useState(false);
  const [convertPwd, setConvertPwd] = useState("Client#2026");
  const [showConvert, setShowConvert] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/leads/${lead.id}`);
      setDetail(res.data?.data);
    } catch (err) { toast.error(apiError(err)); }
    finally { setLoading(false); }
  }, [lead.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const moveStage = async (newStatus) => {
    try {
      await api.patch(`/admin/leads/${lead.id}`, { status: newStatus });
      toast.success("Status diperbarui");
      onUpdated();
      loadDetail();
    } catch (err) { toast.error(apiError(err)); }
  };

  const addEvent = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await api.post(`/admin/leads/${lead.id}/events`, { note: noteText, event_type: noteType });
      toast.success("Catatan ditambahkan");
      setNoteText("");
      loadDetail();
      onUpdated();
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  const convertLead = async () => {
    setConverting(true);
    try {
      const res = await api.post(`/admin/leads/${lead.id}/convert`, { password: convertPwd, send_welcome: true });
      toast.success(`Lead dikonversi → client user: ${res.data?.data?.email}`);
      setShowConvert(false);
      onUpdated();
      loadDetail();
    } catch (err) { toast.error(apiError(err)); }
    finally { setConverting(false); }
  };

  const fmtTime = (iso) => { try { return new Date(iso).toLocaleString("id", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };

  const EventIcon = { note: MessageSquare, call: Phone, email: Mail, meeting: Calendar, status_changed: ArrowRight, auto_transition: ArrowRight, converted: UserCheck };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/10 overflow-hidden" style={{ background: "#0B0D17" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">{lead.name}</h2>
            <p className="text-sm text-[color:var(--kti-text-dim)]">{lead.email}</p>
          </div>
          <button onClick={onClose} className="mt-1 grid size-8 place-items-center rounded-lg border border-white/10 hover:bg-white/[0.06]"><X className="size-4 text-white/60" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <LoadingView /> : !detail ? null : (
            <div className="px-6 py-5 space-y-6">
              {/* Contact info */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                {detail.company && <div className="flex items-center gap-2 text-sm"><Building2 className="size-4 text-white/40" /><span className="text-white/80">{detail.company}</span></div>}
                <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-white/40" /><span className="text-white/80">{detail.email}</span></div>
                {detail.phone && <div className="flex items-center gap-2 text-sm"><Phone className="size-4 text-white/40" /><span className="text-white/80">{detail.phone}</span></div>}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-[color:var(--kti-text-dim)]">Source:</span>
                  <span className="text-xs text-white/70">{SOURCE_LABELS[detail.source] || detail.source}</span>
                </div>
              </div>

              {/* Message */}
              {detail.message && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Pesan</p>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{detail.message}</p>
                </div>
              )}

              {/* Pipeline stage */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Pipeline Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => moveStage(s.key)}
                      data-testid={`stage-btn-${s.key}`}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                        detail.status === s.key ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"
                      }`}
                      style={{ color: s.color, background: detail.status === s.key ? s.bg : "transparent", borderColor: s.border }}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Convert to client */}
              {["qualified", "proposal", "won"].includes(detail.status) && !detail.converted_user_id && (
                <div className="rounded-xl border border-[rgba(115,209,173,0.25)] bg-[rgba(115,209,173,0.06)] p-4">
                  <p className="mb-2 text-sm font-semibold text-[#73D1AD]">Convert ke Client User</p>
                  {showConvert ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Password awal client</label>
                        <input value={convertPwd} onChange={(e) => setConvertPwd(e.target.value)} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={convertLead} disabled={converting} className="flex-1 flex items-center justify-center gap-2 rounded-full border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.15)] py-2 text-sm font-semibold text-[#73D1AD] hover:bg-[rgba(115,209,173,0.25)] disabled:opacity-60">
                          {converting ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />} Konfirmasi Convert
                        </button>
                        <button onClick={() => setShowConvert(false)} className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/60">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowConvert(true)} data-testid={`convert-lead-${lead.id}`} className="flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.15)] px-4 py-2 text-sm font-semibold text-[#73D1AD] hover:bg-[rgba(115,209,173,0.25)]">
                      <UserCheck className="size-4" /> Convert ke Client
                    </button>
                  )}
                </div>
              )}
              {detail.converted_user_id && (
                <div className="rounded-xl border border-[rgba(115,209,173,0.2)] bg-[rgba(115,209,173,0.05)] px-4 py-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#73D1AD]" />
                  <span className="text-sm text-[#73D1AD]">Lead sudah dikonversi menjadi client</span>
                </div>
              )}

              {/* Add note */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Tambah Aktivitas</p>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {EVENT_TYPES.map((et) => {
                    const EI = et.icon;
                    return (
                      <button key={et.value} onClick={() => setNoteType(et.value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${ noteType === et.value ? "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.2)] text-white" : "border-white/10 text-white/50 hover:text-white" }`}>
                        <EI className="size-3.5" />{et.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Tulis catatan..." rows={2} className="flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 resize-none" />
                  <button onClick={addEvent} disabled={busy || !noteText.trim()} className="grid size-10 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] disabled:opacity-40 self-end">
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Events timeline */}
              {detail.events && detail.events.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Riwayat Aktivitas ({detail.events.length})</p>
                  <div className="relative space-y-3 pl-5">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                    {[...detail.events].reverse().map((ev) => {
                      const EI = EventIcon[ev.event_type] || MessageSquare;
                      return (
                        <div key={ev.id} className="relative">
                          <div className="absolute -left-3 top-1.5 grid size-4 place-items-center rounded-full border border-white/15 bg-[#0B0D17]">
                            <EI className="size-2.5 text-white/50" />
                          </div>
                          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                            <p className="text-xs text-white/80">{ev.description}</p>
                            <p className="mt-1 text-[10px] text-white/30">{fmtTime(ev.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "" = all
  const [selectedLead, setSelectedLead] = useState(null);
  const [view, setView] = useState("kanban"); // kanban | list
  const searchTimeout = useRef(null);

  const load = useCallback(async (q = search, status = filterStatus) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q) params.set("search", q);
      if (status) params.set("status", status);
      const res = await api.get(`/admin/leads?${params}`);
      setLeads(res.data?.data || []);
      setStageCounts(res.data?.stage_counts || {});
    } catch (err) { setError(apiError(err, t("admin.loadError"))); }
    finally { setLoading(false); }
  }, [search, filterStatus, t]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(val, filterStatus), 400);
  };

  const handleFilterStatus = (val) => {
    setFilterStatus(val);
    load(search, val);
  };

  const leadsForStage = (stageKey) => leads.filter((l) => l.status === stageKey);
  const totalActive = leads.filter((l) => !["lost", "archived"].includes(l.status)).length;
  const wonCount = stageCounts.won || 0;

  return (
    <div data-testid="admin-leads-page">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("admin.leads")}</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">
            {totalActive} aktif &middot; {wonCount} won
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button onClick={() => setView("kanban")} data-testid="view-kanban" className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${ view === "kanban" ? "bg-white/[0.09] text-white border border-white/12" : "text-white/50 hover:text-white" }`}>Kanban</button>
            <button onClick={() => setView("list")} data-testid="view-list" className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${ view === "list" ? "bg-white/[0.09] text-white border border-white/12" : "text-white/50 hover:text-white" }`}>List</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Cari nama, email, perusahaan..." data-testid={LEADS.searchInput} className="w-full kti-focus rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 pl-9 text-sm text-white placeholder:text-white/30" />
          {search && <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><X className="size-4" /></button>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleFilterStatus("")} className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${ !filterStatus ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10 text-white/50 hover:text-white" }`}>Semua</button>
          {STAGES.map((s) => (
            <button key={s.key} onClick={() => handleFilterStatus(s.key)} className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${ filterStatus === s.key ? "opacity-100" : "opacity-40 hover:opacity-70" }`} style={{ color: s.color, borderColor: s.border, background: filterStatus === s.key ? s.bg : "transparent" }}>
              {s.label} {stageCounts[s.key] ? `(${stageCounts[s.key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={load} /> : (
        <>
          {/* Kanban View */}
          {view === "kanban" && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {STAGES.map((stage) => {
                  const stageLeads = leadsForStage(stage.key);
                  return (
                    <div key={stage.key} data-testid={`kanban-col-${stage.key}`} className="w-64 flex-shrink-0">
                      {/* Column header */}
                      <div className="mb-3 flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: stage.border, background: stage.bg }}>
                        <span className="text-sm font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                        <span className="grid size-5 place-items-center rounded-full text-xs font-bold" style={{ background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}>{stageLeads.length}</span>
                      </div>
                      {/* Cards */}
                      <div className="space-y-2">
                        {stageLeads.map((lead) => (
                          <LeadCard key={lead.id} lead={lead} onClick={setSelectedLead} />
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-white/8 text-xs text-white/20">
                            Kosong
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {view === "list" && (
            <div className="overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04]">
              {leads.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <User className="size-8 text-white/20" />
                  <p className="text-sm text-[color:var(--kti-text-dim)]">{t("admin.noLeads")}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/8">
                  {leads.map((lead) => (
                    <button key={lead.id} onClick={() => setSelectedLead(lead)} data-testid={`lead-row-${lead.id}`} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
                      <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{lead.name}</p>
                          <p className="text-xs text-[color:var(--kti-text-dim)] truncate">{lead.email}</p>
                        </div>
                        <p className="text-sm text-white/60 truncate hidden sm:block">{lead.company || "—"}</p>
                        <div className="hidden sm:flex items-center"><StageBadge stage={lead.status} /></div>
                        <p className="text-xs text-[color:var(--kti-text-dim)] hidden sm:block">{new Date(lead.created_at).toLocaleDateString("id")}</p>
                      </div>
                      <ChevronRight className="size-4 text-white/20 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => { load(); }}
        />
      )}
    </div>
  );
}
