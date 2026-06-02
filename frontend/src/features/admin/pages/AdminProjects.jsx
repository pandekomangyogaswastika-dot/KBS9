import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus, X, Loader2, FolderKanban, Edit3, Trash2,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Circle,
  FileUp, Trash, Check, MessageSquare, Download, History, PenLine
} from "lucide-react";
import { api, apiError, useFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STATUS_COLOR = { active: "#4ECBAF", completed: "#7C68E1", on_hold: "#F2A83E", cancelled: "#E05555" };
const STATUS_OPTS = ["active","on_hold","completed","cancelled"];
const MS_COLOR = { done: "#4ECBAF", in_progress: "#7C68E1", todo: "#555" };
const MS_ICON = { done: CheckCircle2, in_progress: Clock, todo: Circle };
const AP_COLOR = { pending: "#F2A83E", approved: "#4ECBAF", changes_requested: "#E05555" };

const fmtIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtBytes = (n) => n > 1024*1024 ? `${(n/1024/1024).toFixed(1)} MB` : `${Math.round(n/1024)} KB`;

export default function AdminProjects() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [milestones, setMilestones] = useState({});
  const [documents, setDocuments] = useState({});
  const [approvals, setApprovals] = useState({});
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name:"", code:"", client_id:"", staff_ids:[], status:"active", progress:0, start_date:"", due_date:"", summary:"" });
  const [saving, setSaving] = useState(false);
  const [msForm, setMsForm] = useState({});
  const [addingMs, setAddingMs] = useState({});
  const [uploading, setUploading] = useState({});
  const [approvalSignatures, setApprovalSignatures] = useState({});
  const [viewingAudit, setViewingAudit] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, id: null, projectId: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, approvalId: null, projectId: null });
  const [feedbackText, setFeedbackText] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data?.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data?.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadProjects(); loadUsers(); }, []);

  const loadProjectData = useCallback(async (pid) => {
    const [mRes, dRes, aRes] = await Promise.all([
      api.get(`/projects/${pid}/milestones`),
      api.get(`/projects/${pid}/documents`),
      api.get(`/projects/${pid}/approvals`),
    ]);
    setMilestones((prev) => ({ ...prev, [pid]: mRes.data?.data || [] }));
    setDocuments((prev) => ({ ...prev, [pid]: dRes.data?.data || [] }));
    setApprovals((prev) => ({ ...prev, [pid]: aRes.data?.data || [] }));
    // Load signatures for each approval
    const approvalIds = (aRes.data?.data || []).map(a => a.id);
    const sigMap = {};
    for (const aid of approvalIds) {
      try {
        const sigRes = await api.get(`/projects/${pid}/approvals/${aid}/signatures`);
        sigMap[aid] = sigRes.data?.data || [];
      } catch { sigMap[aid] = []; }
    }
    setApprovalSignatures(sigMap);
  }, []);

  const openProject = async (pid) => {
    if (expandedId === pid) { setExpandedId(null); return; }
    setExpandedId(pid);
    if (!activeTab[pid]) setActiveTab((prev) => ({ ...prev, [pid]: "milestones" }));
    await loadProjectData(pid);
  };

  const openForm = (p = null) => {
    if (p) {
      setForm({ name: p.name || "", code: p.code || "", client_id: p.client_id || "",
        staff_ids: p.staff_ids || [], status: p.status || "active", progress: p.progress ?? 0,
        start_date: p.start_date || "", due_date: p.due_date || "", summary: p.summary || "" });
      setEditProject(p);
    } else {
      setForm({ name:"", code:"", client_id:"", staff_ids:[], status:"active", progress:0, start_date:"", due_date:"", summary:"" });
      setEditProject(null);
    }
    setShowForm(true);
  };

  const saveProject = async () => {
    if (!form.name.trim()) { toast.error("Nama proyek wajib diisi"); return; }
    setSaving(true);
    try {
      if (editProject) {
        await api.patch(`/projects/${editProject.id}`, form);
        toast.success("Proyek diperbarui");
      } else {
        await api.post("/projects", form);
        toast.success("Proyek dibuat");
      }
      setShowForm(false);
      await loadProjects();
    } catch (err) { toast.error(apiError(err, "Gagal menyimpan")); }
    finally { setSaving(false); }
  };

  const deleteProject = async (pid) => {
    try { await api.delete(`/projects/${pid}`); toast.success("Proyek dihapus"); await loadProjects(); }
    catch (err) { toast.error(apiError(err, "Gagal menghapus")); }
  };

  // Milestones
  const saveMilestone = async (pid) => {
    const f = msForm[pid] || {};
    if (!f.title?.trim()) { toast.error("Judul wajib"); return; }
    try {
      if (f.id) await api.patch(`/projects/${pid}/milestones/${f.id}`, f);
      else await api.post(`/projects/${pid}/milestones`, f);
      toast.success(f.id ? "Milestone diperbarui" : "Milestone ditambahkan");
      setMsForm((prev) => ({ ...prev, [pid]: {} }));
      setAddingMs((prev) => ({ ...prev, [pid]: false }));
      await loadProjectData(pid);
    } catch (err) { toast.error(apiError(err, "Gagal")); }
  };

  const updateMilestoneStatus = async (pid, mid, status) => {
    try {
      await api.patch(`/projects/${pid}/milestones/${mid}`, { status });
      await loadProjectData(pid);
    } catch (err) { toast.error(apiError(err, "Gagal")); }
  };

  const deleteMilestone = async (pid, mid) => {
    try { await api.delete(`/projects/${pid}/milestones/${mid}`); await loadProjectData(pid); }
    catch (err) { toast.error(apiError(err, "Gagal")); }
  };

  // Documents
  const uploadDoc = async (pid, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, [pid]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/projects/${pid}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Dokumen diunggah");
      await loadProjectData(pid);
    } catch (err) { toast.error(apiError(err, "Gagal unggah")); }
    finally { setUploading((prev) => ({ ...prev, [pid]: false })); e.target.value = ""; }
  };

  const deleteDoc = async (pid, did) => {
    try { await api.delete(`/projects/${pid}/documents/${did}`); await loadProjectData(pid); }
    catch (err) { toast.error(apiError(err, "Gagal")); }
  };

  // Approvals
  const decideApproval = async (pid, aid, status) => {
    if (status === "changes_requested") {
      // Open feedback dialog
      setFeedbackDialog({ open: true, approvalId: aid, projectId: pid });
      return;
    }
    try {
      await api.patch(`/projects/${pid}/approvals/${aid}`, { status, feedback: "" });
      toast.success(status === "approved" ? "Disetujui" : "Perubahan diminta");
      await loadProjectData(pid);
    } catch (err) { toast.error(apiError(err, "Gagal")); }
  };

  const submitFeedback = async () => {
    const { projectId, approvalId } = feedbackDialog;
    if (!feedbackText.trim()) {
      toast.error("Feedback wajib diisi");
      return;
    }
    try {
      await api.patch(`/projects/${projectId}/approvals/${approvalId}`, { 
        status: "changes_requested", 
        feedback: feedbackText.trim() 
      });
      toast.success("Perubahan diminta");
      setFeedbackDialog({ open: false, approvalId: null, projectId: null });
      setFeedbackText("");
      await loadProjectData(projectId);
    } catch (err) { 
      toast.error(apiError(err, "Gagal")); 
    }
  };

  const viewAuditTrail = async (pid, aid) => {
    try {
      const res = await api.get(`/projects/${pid}/approvals/${aid}/history`);
      setAuditLogs(res.data?.data || []);
      setViewingAudit(aid);
    } catch (err) { toast.error(apiError(err, "Gagal load audit")); }
  };

  const downloadCertificate = async (pid, aid) => {
    try {
      const res = await api.get(`/projects/${pid}/approvals/${aid}/certificate`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate-${aid}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error(apiError(err, "Gagal unduh sertifikat")); }
  };

  const clientUsers = users.filter((u) => u.role === "client");
  const staffUsers = users.filter((u) => u.role === "staff" || u.role === "admin");

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Manajemen Proyek</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{projects.length} proyek terdaftar</p>
        </div>
        <button onClick={() => openForm()} data-testid={PORTAL.adminProjectCreate} className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[rgba(124,104,225,0.32)] transition-colors">
          <Plus className="size-4" /> Buat Proyek
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#0D0F1A] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">{editProject ? "Ubah Proyek" : "Buat Proyek Baru"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[color:var(--kti-text-dim)] hover:text-white"><X className="size-5" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Nama Proyek *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({...f, name: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="Nama proyek" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Kode</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({...f, code: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="Auto-generate jika kosong" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({...f, status: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3 py-2 text-sm text-white">
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Klien</label>
                <select value={form.client_id} onChange={(e) => setForm((f) => ({...f, client_id: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3 py-2 text-sm text-white">
                  <option value="">— Pilih klien —</option>
                  {clientUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Progress (%)</label>
                <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({...f, progress: parseInt(e.target.value)||0}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Tanggal Mulai</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({...f, start_date: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Tenggat</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({...f, due_date: e.target.value}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Staff Assigned</label>
                <div className="flex flex-wrap gap-2">
                  {staffUsers.map((su) => (
                    <label key={su.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.04]">
                      <input type="checkbox" checked={form.staff_ids.includes(su.id)}
                        onChange={(e) => setForm((f) => ({ ...f, staff_ids: e.target.checked ? [...f.staff_ids, su.id] : f.staff_ids.filter((id) => id !== su.id) }))}
                        className="accent-[#7C68E1]" />
                      <span className="text-[color:var(--kti-text-dim)]">{su.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Ringkasan</label>
                <textarea value={form.summary} onChange={(e) => setForm((f) => ({...f, summary: e.target.value}))} rows={3} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white resize-none" placeholder="Deskripsi singkat proyek..." />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={saveProject} disabled={saving} data-testid={PORTAL.adminProjectSave} className="inline-flex items-center gap-2 rounded-xl bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.45)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-60">
                {saving ? <><Loader2 className="size-4 animate-spin" /> Menyimpan...</> : "Simpan"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-[color:var(--kti-text-dim)] hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] py-20">
          <FolderKanban className="size-12" style={{ color: "var(--kti-text-faint)" }} />
          <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada proyek. Buat yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid={PORTAL.adminProjectList}>
          {projects.map((p) => {
            const isOpen = expandedId === p.id;
            const sc = STATUS_COLOR[p.status] || "#888";
            const tab = activeTab[p.id] || "milestones";
            const msList = milestones[p.id] || [];
            const docList = documents[p.id] || [];
            const apList = approvals[p.id] || [];

            return (
              <div key={p.id} className="rounded-2xl border border-white/8 bg-white/[0.04] overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button onClick={() => openProject(p.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-mono-kti text-[10px] text-[color:var(--kti-text-faint)]">{p.code}</p>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-[color:var(--kti-text-dim)]">{p.client_name || "No client"}</p>
                      </div>
                    </div>
                  </button>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="w-24">
                      <div className="mb-1 flex justify-between text-[10px]"><span className="text-[color:var(--kti-text-faint)]">Progress</span><span className="text-white">{p.progress}%</span></div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: "var(--kti-teal)" }} /></div>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44` }}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openForm(p)} className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white"><Edit3 className="size-4" /></button>
                    {user?.role === "admin" && <button onClick={() => setConfirmDelete({ open: true, type: "project", id: p.id, projectId: null })} className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:bg-red-500/20 hover:text-red-400"><Trash2 className="size-4" /></button>}
                    <button onClick={() => openProject(p.id)} className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-white">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className="border-t border-white/8">
                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-white/8 px-4 py-2">
                      {["milestones","documents","approvals"].map((t_) => (
                        <button key={t_} onClick={() => setActiveTab((prev) => ({...prev, [p.id]: t_}))} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${ tab === t_ ? "bg-white/[0.08] text-white" : "text-[color:var(--kti-text-dim)] hover:text-white" }`}>
                          {t_ === "milestones" ? "Milestone" : t_ === "documents" ? "Dokumen" : "Persetujuan"}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {tab === "milestones" && (
                        <div className="space-y-3">
                          {msList.map((m) => {
                            const Icon = MS_ICON[m.status] || Circle;
                            const col = MS_COLOR[m.status] || "#555";
                            return (
                              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                                <Icon className="size-4 shrink-0" style={{ color: col }} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white">{m.title}</p>
                                  {m.due_date && <p className="text-xs text-[color:var(--kti-text-faint)]">Tenggat: {new Date(m.due_date).toLocaleDateString("id-ID")}</p>}
                                </div>
                                <select value={m.status} onChange={(e) => updateMilestoneStatus(p.id, m.id, e.target.value)} className="rounded-lg border border-white/10 bg-[#0B0D17] px-2 py-1 text-xs text-white">
                                  {["todo","in_progress","done"].map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => setMsForm((prev) => ({...prev, [p.id]: {...m}})) || setAddingMs((prev) => ({...prev, [p.id]: true}))} className="grid size-7 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-white"><Edit3 className="size-3.5" /></button>
                                <button onClick={() => setConfirmDelete({ open: true, type: "milestone", id: m.id, projectId: p.id })} className="grid size-7 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-red-400"><Trash className="size-3.5" /></button>
                              </div>
                            );
                          })}
                          {addingMs[p.id] ? (
                            <div className="rounded-xl border border-white/12 bg-white/[0.06] p-4 space-y-3">
                              <input value={msForm[p.id]?.title || ""} onChange={(e) => setMsForm((prev) => ({...prev, [p.id]: {...(prev[p.id]||{}), title: e.target.value}}))} placeholder="Judul milestone *" className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                              <input value={msForm[p.id]?.description || ""} onChange={(e) => setMsForm((prev) => ({...prev, [p.id]: {...(prev[p.id]||{}), description: e.target.value}}))} placeholder="Deskripsi" className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                              <input type="date" value={msForm[p.id]?.due_date || ""} onChange={(e) => setMsForm((prev) => ({...prev, [p.id]: {...(prev[p.id]||{}), due_date: e.target.value}}))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                              <div className="flex gap-2">
                                <button onClick={() => saveMilestone(p.id)} className="rounded-xl bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.45)] px-3 py-1.5 text-xs font-medium text-white">{msForm[p.id]?.id ? "Simpan" : "Tambah"}</button>
                                <button onClick={() => { setAddingMs((prev) => ({...prev, [p.id]: false})); setMsForm((prev) => ({...prev, [p.id]: {}})); }} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-[color:var(--kti-text-dim)]">Batal</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingMs((prev) => ({...prev, [p.id]: true}))} data-testid={PORTAL.milestoneAddBtn} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs text-[color:var(--kti-text-dim)] hover:border-white/40 hover:text-white transition-colors">
                              <Plus className="size-3.5" /> Tambah Milestone
                            </button>
                          )}
                        </div>
                      )}

                      {tab === "documents" && (
                        <div className="space-y-3">
                          {docList.map((d) => (
                            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-white">{d.name}</p>
                                <p className="text-xs text-[color:var(--kti-text-faint)]">{fmtBytes(d.size)} · {new Date(d.created_at).toLocaleDateString("id-ID")}</p>
                              </div>
                              {d.url && <a href={d.url} download target="_blank" rel="noreferrer" className="text-xs text-[color:var(--kti-text-dim)] hover:text-white">Unduh</a>}
                              <button onClick={() => setConfirmDelete({ open: true, type: "document", id: d.id, projectId: p.id })} className="grid size-7 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-red-400"><Trash className="size-3.5" /></button>
                            </div>
                          ))}
                          <label data-testid={PORTAL.documentUploadBtn} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs text-[color:var(--kti-text-dim)] hover:border-white/40 hover:text-white transition-colors">
                            {uploading[p.id] ? <><Loader2 className="size-3.5 animate-spin" /> Mengunggah...</> : <><FileUp className="size-3.5" /> Unggah Dokumen</>}
                            <input type="file" className="hidden" onChange={(e) => uploadDoc(p.id, e)} accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt" />
                          </label>
                        </div>
                      )}

                      {tab === "approvals" && (
                        <div className="space-y-3">
                          {apList.length === 0 && <p className="text-sm text-[color:var(--kti-text-faint)]">Belum ada permintaan persetujuan.</p>}
                          {apList.map((a) => {
                            const col = AP_COLOR[a.status] || "#888";
                            const sigs = approvalSignatures[a.id] || [];
                            return (
                              <div key={a.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-white">{a.title}</p>
                                    {a.note && <p className="mt-1 text-xs text-[color:var(--kti-text-dim)]">{a.note}</p>}
                                  </div>
                                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}>{a.status}</span>
                                </div>
                                
                                {/* Signature info */}
                                {sigs.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-white/8">
                                    <p className="text-xs text-[color:var(--kti-text-faint)] mb-2">
                                      <PenLine className="inline size-3 mr-1" />
                                      Ditandatangani oleh: {sigs.map(s => s.signer_name).join(", ")}
                                    </p>
                                  </div>
                                )}
                                
                                {a.status === "pending" && (
                                  <div className="mt-3 flex gap-2">
                                    <button onClick={() => decideApproval(p.id, a.id, "approved")} data-testid={PORTAL.approvalDecideBtn} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(78,203,175,0.15)] border border-[rgba(78,203,175,0.3)] px-3 py-1.5 text-xs font-medium text-[#4ECBAF] hover:bg-[rgba(78,203,175,0.25)]">
                                      <Check className="size-3.5" /> Setujui
                                    </button>
                                    <button onClick={() => decideApproval(p.id, a.id, "changes_requested")} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(224,85,85,0.15)] border border-[rgba(224,85,85,0.3)] px-3 py-1.5 text-xs font-medium text-[#E05555] hover:bg-[rgba(224,85,85,0.25)]">
                                      <X className="size-3.5" /> Minta Revisi
                                    </button>
                                  </div>
                                )}
                                
                                {/* Actions for signed approvals */}
                                {sigs.length > 0 && (
                                  <div className="mt-3 flex gap-2">
                                    <button onClick={() => downloadCertificate(p.id, a.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(78,203,175,0.3)] bg-[rgba(78,203,175,0.12)] px-3 py-1.5 text-xs font-medium text-[#4ECBAF] hover:bg-[rgba(78,203,175,0.22)]">
                                      <Download className="size-3.5" /> Unduh Sertifikat
                                    </button>
                                    <button onClick={() => viewAuditTrail(p.id, a.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white">
                                      <History className="size-3.5" /> Audit Trail
                                    </button>
                                  </div>
                                )}
                                
                                {a.feedback && <p className="mt-2 text-xs text-[color:var(--kti-text-dim)] italic">{a.feedback}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Audit Trail Modal */}
      {viewingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setViewingAudit(null); }}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#0D0F1A] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-white">Audit Trail</h2>
              <button onClick={() => setViewingAudit(null)} className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-white"><X className="size-5" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-[color:var(--kti-text-faint)]">Tidak ada log audit.</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log, i) => (
                    <div key={log.id} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.04]">
                        <span className="text-xs font-mono text-[color:var(--kti-text-dim)]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white capitalize">{log.action}</p>
                        <p className="text-xs text-[color:var(--kti-text-dim)] mt-0.5">oleh {log.actor_name} ({log.actor_role})</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 rounded-lg border border-white/8 bg-[#0B0D17] px-3 py-2">
                            <p className="font-mono text-[11px] text-[color:var(--kti-text-faint)]">{JSON.stringify(log.details, null, 2)}</p>
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-[color:var(--kti-text-faint)]">{new Date(log.timestamp).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => !open && setConfirmDelete({ open: false, type: null, id: null, projectId: null })}
        title={
          confirmDelete.type === "project" ? "Hapus Proyek" :
          confirmDelete.type === "milestone" ? "Hapus Milestone" :
          "Hapus Dokumen"
        }
        description={
          confirmDelete.type === "project" 
            ? "Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan."
            : confirmDelete.type === "milestone"
            ? "Apakah Anda yakin ingin menghapus milestone ini?"
            : "Apakah Anda yakin ingin menghapus dokumen ini?"
        }
        confirmText="Hapus"
        cancelText="Batal"
        destructive
        testId="confirm-delete-dialog"
        onConfirm={() => {
          const { type, id, projectId } = confirmDelete;
          if (type === "project") deleteProject(id);
          else if (type === "milestone") deleteMilestone(projectId, id);
          else if (type === "document") deleteDoc(projectId, id);
          setConfirmDelete({ open: false, type: null, id: null, projectId: null });
        }}
      />

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => {
        setFeedbackDialog({ open, approvalId: null, projectId: null });
        setFeedbackText("");
      }}>
        <DialogContent className="max-w-md rounded-2xl border border-white/10 bg-[#0D0F1A]" data-testid="feedback-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Berikan Feedback</DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--kti-text-dim)]">
              Jelaskan perubahan apa yang perlu dilakukan
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tulis feedback Anda di sini..."
            rows={4}
            className="border-white/10 bg-white/[0.04] text-sm text-white focus:border-[rgba(124,104,225,0.5)] focus-visible:ring-[rgba(124,104,225,0.3)]"
            data-testid="feedback-textarea"
          />
          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setFeedbackDialog({ open: false, approvalId: null, projectId: null });
                setFeedbackText("");
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white hover:bg-white/[0.08]"
            >
              Batal
            </Button>
            <Button
              onClick={submitFeedback}
              data-testid="submit-feedback-button"
              className="rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.32)]"
            >
              Kirim Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
