import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Mail, Phone, User, FolderKanban, ClipboardList,
  ExternalLink, Copy, CheckCircle2, Clock, Loader2, AlertCircle,
  MessageSquare, Edit3, Save, X, Plus, RefreshCw, Calendar,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView } from "@/components/StateViews";
import { loc } from "@/features/assessment/assessmentApi";

const statusCfg = {
  active: { label: "Aktif", cls: "bg-[rgba(78,203,175,0.15)] text-[#4ECBAF] border-[rgba(78,203,175,0.3)]" },
  inactive: { label: "Nonaktif", cls: "bg-white/[0.05] text-white/40 border-white/10" },
};

const projectStatusColor = {
  active: "text-[#73D1AD]", completed: "text-[#cfc4ff]", paused: "text-[#ffd580]", cancelled: "text-[#ff96aa]",
};

const leadStageColor = {
  new: "#9fd0ff", contacted: "#cfc4ff", qualified: "#ffd580",
  proposal: "#ff9f6e", won: "#73D1AD", lost: "#ff96aa",
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "id";

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Assign assessment dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [assignForm, setAssignForm] = useState({ template_id: "", project_name: "", due_date: "", notes: "" });
  const [assignBusy, setAssignBusy] = useState(false);

  const origin = window.location.origin;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/admin/clients/${id}`);
      const data = res.data?.data;
      setClient(data);
      setEditForm({ name: data.name || "", company: data.company || "", phone: data.phone || "", status: data.status || "active", notes: data.notes || "" });
    } catch (err) { setError(apiError(err, "Gagal memuat data client")); }
    finally { setLoading(false); }
  }, [id]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.get("/assessment/templates");
      setTemplates(res.data?.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); loadTemplates(); }, [load, loadTemplates]);

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await api.patch(`/admin/clients/${id}`, editForm);
      toast.success("Profil diperbarui");
      setEditing(false);
      load();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSavingEdit(false); }
  };

  const submitAssign = async () => {
    if (!assignForm.template_id) { toast.error("Pilih template terlebih dahulu"); return; }
    setAssignBusy(true);
    try {
      const res = await api.post("/assessment/sessions", {
        template_id: assignForm.template_id,
        client_name: client.name,
        client_user_id: id,
        project_name: assignForm.project_name || undefined,
        due_date: assignForm.due_date || undefined,
        notes: assignForm.notes || undefined,
      });
      const created = res.data?.data;
      toast.success("Assessment di-assign!");
      if (created?.share_url) {
        try { await navigator.clipboard.writeText(origin + created.share_url); toast.success("Link disalin"); } catch { /* ignore */ }
      }
      setAssignOpen(false);
      setAssignForm({ template_id: "", project_name: "", due_date: "", notes: "" });
      load();
    } catch (err) { toast.error(apiError(err)); }
    finally { setAssignBusy(false); }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!client) return null;

  const sCfg = statusCfg[client.status] || statusCfg.inactive;
  const initials = (client.name || "?")[0].toUpperCase();

  const TABS = [
    { key: "overview", label: "Overview", icon: User },
    { key: "projects", label: `Proyek (${client.projects?.length || 0})`, icon: FolderKanban },
    { key: "assessments", label: `Assessment (${client.assessments?.length || 0})`, icon: ClipboardList },
    { key: "lead", label: "Lead Asal", icon: RefreshCw },
  ];

  return (
    <div data-testid="client-detail-page">
      {/* Back button */}
      <button onClick={() => navigate("/portal/admin/clients")} className="mb-5 flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white transition-colors">
        <ArrowLeft className="size-4" /> Kembali ke Daftar Klien
      </button>

      {/* Profile header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full border border-white/15 bg-[rgba(124,104,225,0.2)] text-xl font-bold text-white">{initials}</div>
          <div>
            {editing ? (
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="font-display text-xl font-semibold text-white bg-white/[0.04] border border-white/12 rounded-lg px-3 py-1" />
            ) : (
              <h1 className="font-display text-xl font-semibold text-white">{client.name}</h1>
            )}
            <p className="mt-0.5 text-sm text-[color:var(--kti-text-dim)]">{client.email}</p>
            {editing ? (
              <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} placeholder="Perusahaan" className="mt-1 text-sm text-white bg-white/[0.04] border border-white/12 rounded-lg px-2 py-1 w-48" />
            ) : (
              client.company && <p className="text-sm text-[color:var(--kti-text-dim)]">{client.company}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 hover:text-white">
              <Edit3 className="size-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={savingEdit} className="flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.15)] px-4 py-2 text-xs font-semibold text-[#73D1AD] disabled:opacity-60">
                {savingEdit ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Simpan
              </button>
              <button onClick={() => setEditing(false)} className="grid size-8 place-items-center rounded-full border border-white/12 text-white/50"><X className="size-3.5" /></button>
            </div>
          )}
          <button onClick={() => setAssignOpen(true)} data-testid="btn-assign-assessment" className="flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] px-4 py-2 text-xs font-semibold text-white hover:bg-[rgba(124,104,225,0.25)]">
            <Plus className="size-3.5" /> Assign Assessment
          </button>
          <button onClick={() => navigate(`/portal/admin/messages`)} className="flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 hover:text-white">
            <MessageSquare className="size-3.5" /> Pesan
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Proyek", value: client.projects?.length || 0, icon: FolderKanban, color: "#cfc4ff" },
          { label: "Assessment", value: client.assessments?.length || 0, icon: ClipboardList, color: "#9fd0ff" },
          { label: "Assessment Selesai", value: (client.assessments || []).filter((a) => a.status === "submitted").length, icon: CheckCircle2, color: "#73D1AD" },
          { label: "Lead Aktif", value: client.lead ? 1 : 0, icon: RefreshCw, color: "#ffd580" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <s.icon className="mb-2 size-5" style={{ color: s.color }} />
            <p className="font-display text-2xl font-semibold text-white">{s.value}</p>
            <p className="text-xs text-[color:var(--kti-text-dim)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit max-w-full">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} data-testid={`tab-${tab.key}`} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${ activeTab === tab.key ? "bg-white/[0.09] text-white border border-white/12" : "text-[color:var(--kti-text-dim)] hover:text-white" }`}>
            <tab.icon className="size-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Informasi Kontak</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-white/40" /><span className="text-white/80">{client.email}</span></div>
              {(editing ? editForm.phone : client.phone) ? (
                <div className="flex items-center gap-2 text-sm"><Phone className="size-4 text-white/40" />
                  {editing ? <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="text-sm text-white bg-white/[0.04] border border-white/12 rounded px-2 py-0.5" /> : <span className="text-white/80">{client.phone}</span>}
                </div>
              ) : null}
              {(editing ? editForm.company : client.company) && (
                <div className="flex items-center gap-2 text-sm"><Building2 className="size-4 text-white/40" /><span className="text-white/80">{editing ? editForm.company : client.company}</span></div>
              )}
            </div>
          </div>
          {editing && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Status & Catatan</p>
              <div className="space-y-3">
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="border-white/12 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem></SelectContent>
                </Select>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Catatan internal" className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" rows={3} />
              </div>
            </div>
          )}
          {!editing && client.notes && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Catatan Internal</p>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {activeTab === "projects" && (
        <div>
          {!client.projects?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-16">
              <FolderKanban className="size-10 text-white/20" />
              <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada proyek untuk klien ini.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="divide-y divide-white/8">
                {client.projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-[color:var(--kti-text-dim)]">#{p.code} &middot; {p.start_date ? new Date(p.start_date).toLocaleDateString("id") : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#7C68E1] to-[#73D1AD]" style={{ width: `${p.progress || 0}%` }} /></div>
                        <span className="text-xs text-white/50">{p.progress || 0}%</span>
                      </div>
                      <span className={`text-xs font-medium ${projectStatusColor[p.status] || "text-white/50"}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessments */}
      {activeTab === "assessments" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setAssignOpen(true)} className="flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.25)]">
              <Plus className="size-4" /> Assign Assessment Baru
            </button>
          </div>
          {!client.assessments?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-16">
              <ClipboardList className="size-10 text-white/20" />
              <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada assessment untuk klien ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.assessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{a.template_name ? loc(a.template_name, lang) : "Assessment"}</p>
                    {a.project_name && <p className="text-xs text-[color:var(--kti-text-dim)]">{a.project_name}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#7C68E1] to-[#73D1AD]" style={{ width: `${a.progress?.percent || 0}%` }} /></div>
                      <span className="text-xs text-white/50">{a.progress?.percent || 0}%</span>
                      {a.due_date && <span className="text-xs text-[color:var(--kti-text-dim)]">· Tenggat: {new Date(a.due_date).toLocaleDateString("id")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${ a.status === "submitted" ? "bg-[rgba(115,209,173,0.15)] text-[#73D1AD] border-[rgba(115,209,173,0.3)]" : "bg-white/[0.04] text-white/40 border-white/10" }`}>
                      {a.status === "submitted" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {a.status === "submitted" ? "Selesai" : "Draft"}
                    </span>
                    {a.share_url && <a href={origin + a.share_url} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/50 hover:bg-white/[0.06]"><ExternalLink className="size-3.5" /></a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lead */}
      {activeTab === "lead" && (
        <div>
          {!client.lead ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-16">
              <RefreshCw className="size-10 text-white/20" />
              <p className="text-sm text-[color:var(--kti-text-dim)]">Tidak ada lead yang terhubung ke klien ini.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{client.lead.name}</p>
                  <p className="text-sm text-[color:var(--kti-text-dim)]">{client.lead.email}</p>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ color: leadStageColor[client.lead.status] || "#fff", borderColor: leadStageColor[client.lead.status] || "#fff" }}>
                  {client.lead.status}
                </span>
              </div>
              {client.lead.message && (
                <div>
                  <p className="mb-1 text-xs text-[color:var(--kti-text-faint)]">Pesan asli</p>
                  <p className="text-sm text-white/70">{client.lead.message}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-white/30">Source:</span> <span className="text-white/60">{client.lead.source}</span></div>
                <div><span className="text-white/30">Tanggal:</span> <span className="text-white/60">{new Date(client.lead.created_at).toLocaleDateString("id")}</span></div>
                {client.lead.company && <div><span className="text-white/30">Perusahaan:</span> <span className="text-white/60">{client.lead.company}</span></div>}
              </div>
              <button onClick={() => navigate("/portal/admin/leads")} className="flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white transition-colors">
                Lihat di Pipeline Leads <ExternalLink className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assign Assessment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="border-white/10 max-w-md" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
          <DialogHeader><DialogTitle>Assign Assessment ke {client.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">Template *</label>
              <Select value={assignForm.template_id} onValueChange={(v) => setAssignForm({ ...assignForm, template_id: v })}>
                <SelectTrigger className="border-white/12 bg-white/[0.04]" data-testid="assign-template-select"><SelectValue placeholder="Pilih template" /></SelectTrigger>
                <SelectContent>{templates.map((tp) => <SelectItem key={tp.id} value={tp.id}>{loc(tp.name, lang)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">Nama Proyek</label><input value={assignForm.project_name} onChange={(e) => setAssignForm({ ...assignForm, project_name: e.target.value })} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">Tenggat</label><input type="date" value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white" /></div>
            </div>
            <div><label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">Catatan</label><textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white" rows={2} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setAssignOpen(false)} className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/70">Batal</button>
            <button onClick={submitAssign} disabled={assignBusy || !assignForm.template_id} data-testid="confirm-assign-btn" className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {assignBusy && <Loader2 className="size-4 animate-spin" />} Assign & Salin Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
