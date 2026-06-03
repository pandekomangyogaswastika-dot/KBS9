import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus, Copy, ExternalLink, FileText, Check, Trash2, Loader2,
  Inbox, Send, Sparkles, ChevronDown, ChevronRight, BookTemplate,
  Eye, EyeOff, Pencil, X, Users, Calendar, ArrowRight, ClipboardList,
  LayoutList, Upload, Download, FileSpreadsheet,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, apiError } from "@/lib/apiClient";
import SessionDetailModal from "@/features/admin/assessment/SessionDetailModal";
import TemplateEditorV2 from "@/features/admin/assessment/TemplateEditorV2";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import { pdfUrl, loc } from "@/features/assessment/assessmentApi";
import { ASSESS } from "@/constants/testIds";

const fieldCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]";

const QTYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Single Choice" },
  { value: "multiselect", label: "Multi Choice" },
  { value: "yesno", label: "Yes/No" },
  { value: "scale", label: "Scale (1-10)" },
  { value: "number", label: "Number" },
];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "it_maturity", label: "IT Maturity" },
  { value: "security", label: "Security Baseline" },
  { value: "digital_ops", label: "Digital Operations" },
  { value: "custom", label: "Custom" },
];

function TemplateBuilderModal({ template, onClose, onSaved }) {
  const { i18n } = useTranslation();
  const isEdit = !!template;
  const [name, setName] = useState({ id: template?.name?.id || "", en: template?.name?.en || "" });
  const [desc, setDesc] = useState({ id: template?.description?.id || "", en: template?.description?.en || "" });
  const [category, setCategory] = useState(template?.category || "general");
  const [sections, setSections] = useState(template?.sections || []);
  const [busy, setBusy] = useState(false);
  const lang = i18n.language?.startsWith("en") ? "en" : "id";

  const addSection = () => {
    setSections((s) => [...s, { id: null, title: { id: "", en: "" }, description: null, questions: [] }]);
  };

  const removeSection = (si) => setSections((s) => s.filter((_, i) => i !== si));

  const updateSection = (si, field, val) =>
    setSections((s) => s.map((sec, i) => i === si ? { ...sec, [field]: val } : sec));

  const updateSectionTitle = (si, lang, val) =>
    setSections((s) => s.map((sec, i) => i === si ? { ...sec, title: { ...sec.title, [lang]: val } } : sec));

  const addQuestion = (si) =>
    setSections((s) => s.map((sec, i) => i === si
      ? { ...sec, questions: [...sec.questions, { id: null, text: { id: "", en: "" }, type: "text", required: true, weight: 1.0, options: [] }] }
      : sec));

  const removeQuestion = (si, qi) =>
    setSections((s) => s.map((sec, i) => i === si ? { ...sec, questions: sec.questions.filter((_, j) => j !== qi) } : sec));

  const updateQuestion = (si, qi, field, val) =>
    setSections((s) => s.map((sec, i) =>
      i === si ? { ...sec, questions: sec.questions.map((q, j) => j === qi ? { ...q, [field]: val } : q) } : sec));

  const updateQText = (si, qi, lang, val) =>
    setSections((s) => s.map((sec, i) =>
      i === si ? { ...sec, questions: sec.questions.map((q, j) => j === qi ? { ...q, text: { ...q.text, [lang]: val } } : q) } : sec));

  const handleSubmit = async () => {
    if (!name.id.trim()) { toast.error("Nama template (ID) wajib diisi"); return; }
    setBusy(true);
    try {
      const payload = { name, description: desc, category, sections };
      if (isEdit) {
        await api.patch(`/assessment/templates/${template.id}`, payload);
        toast.success("Template diperbarui");
      } else {
        await api.post("/assessment/templates", payload);
        toast.success("Template dibuat");
      }
      onSaved();
      onClose();
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/10 overflow-y-auto" style={{ background: "#0B0D17" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0B0D17]/95 px-6 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-semibold text-white">{isEdit ? "Edit Template" : "Buat Template Baru"}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-white/10 hover:bg-white/[0.06]"><X className="size-4 text-white/60" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Name */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Nama Template</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>Bahasa Indonesia *</label><input value={name.id} onChange={(e) => setName({ ...name, id: e.target.value })} className={fieldCls} placeholder="Nama template" /></div>
              <div><label className={labelCls}>English</label><input value={name.en} onChange={(e) => setName({ ...name, en: e.target.value })} className={fieldCls} placeholder="Template name" /></div>
            </div>
          </div>
          {/* Description */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Deskripsi</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>ID</label><textarea value={desc.id} onChange={(e) => setDesc({ ...desc, id: e.target.value })} className={fieldCls} rows={2} placeholder="Deskripsi" /></div>
              <div><label className={labelCls}>EN</label><textarea value={desc.en} onChange={(e) => setDesc({ ...desc, en: e.target.value })} className={fieldCls} rows={2} placeholder="Description" /></div>
            </div>
          </div>
          {/* Category */}
          <div>
            <label className={labelCls}>Kategori</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-white/12 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Sections */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Seksi & Pertanyaan ({sections.reduce((a, s) => a + s.questions.length, 0)} total)</p>
              <button onClick={addSection} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.08]">
                <Plus className="size-3" /> Tambah Seksi
              </button>
            </div>
            <div className="space-y-4">
              {sections.map((sec, si) => (
                <div key={si} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <input value={sec.title?.id || ""} onChange={(e) => updateSectionTitle(si, "id", e.target.value)} className={fieldCls} placeholder={`Judul seksi ${si + 1} (ID)`} />
                      <input value={sec.title?.en || ""} onChange={(e) => updateSectionTitle(si, "en", e.target.value)} className={fieldCls} placeholder="Section title (EN)" />
                    </div>
                    <button onClick={() => removeSection(si)} className="mt-0.5 grid size-8 place-items-center rounded-lg border border-white/10 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><X className="size-3.5" /></button>
                  </div>
                  <div className="space-y-3">
                    {sec.questions.map((q, qi) => (
                      <div key={qi} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                        <div className="mb-2 grid gap-2 sm:grid-cols-2">
                          <input value={q.text?.id || ""} onChange={(e) => updateQText(si, qi, "id", e.target.value)} className={fieldCls} placeholder="Pertanyaan (ID) *" />
                          <input value={q.text?.en || ""} onChange={(e) => updateQText(si, qi, "en", e.target.value)} className={fieldCls} placeholder="Question (EN)" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Select value={q.type} onValueChange={(v) => updateQuestion(si, qi, "type", v)}>
                            <SelectTrigger className="h-8 w-36 border-white/10 bg-white/[0.04] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{QTYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <label className="flex items-center gap-1.5 text-xs text-[color:var(--kti-text-dim)] cursor-pointer">
                            <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(si, qi, "required", e.target.checked)} className="rounded" />
                            Wajib
                          </label>
                          <button onClick={() => removeQuestion(si, qi)} className="ml-auto grid size-7 place-items-center rounded-lg border border-white/10 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><Trash2 className="size-3" /></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addQuestion(si)} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2.5 text-xs text-[color:var(--kti-text-dim)] hover:border-white/25 hover:text-white">
                      <Plus className="size-3.5" /> Tambah Pertanyaan
                    </button>
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <button onClick={addSection} className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/12 py-8 text-[color:var(--kti-text-dim)] hover:border-white/25">
                  <ClipboardList className="size-8 text-white/20" />
                  <span className="text-sm">Klik untuk menambah seksi pertama</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-white/10 bg-[#0B0D17]/95 px-6 py-4 backdrop-blur flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.04]">Batal</button>
          <button onClick={handleSubmit} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Buat Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAssessments() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | templates
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [builderTemplate, setBuilderTemplate] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [detailSessionId, setDetailSessionId] = useState(null); // for SessionDetailModal
  const [form, setForm] = useState({
    template_id: "", client_name: "", client_user_id: "",
    project_name: "", contact_person: "", contact_email: "", due_date: "", notes: "",
    company_name: "", brand_color: "#5B49C9", company_logo_url: "",
  });
  const [busy, setBusy] = useState(false);

  // Excel import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importForm, setImportForm] = useState({ name_id: "", name_en: "", description: "", category: "general" });
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, st] = await Promise.all([api.get("/assessment/sessions"), api.get("/assessment/stats")]);
      setSessions(s.data?.data || []);
      setStats(st.data?.data || null);
    } catch (err) { setError(apiError(err, t("admin.loadError"))); }
    finally { setLoading(false); }
  }, [t]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.get("/assessment/templates");
      const list = res.data?.data || [];
      setTemplates(list);
      if (list[0]) setForm((f) => ({ ...f, template_id: f.template_id || list[0].id }));
    } catch { /* ignore */ }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await api.get("/admin/clients");
      setClients(res.data?.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); loadTemplates(); loadClients(); }, [load, loadTemplates, loadClients]);

  const origin = window.location.origin;
  const copyLink = async (shareUrl) => {
    try { await navigator.clipboard.writeText(origin + shareUrl); toast.success(t("assess.linkCopied")); } catch { /* ignore */ }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.client_user_id) delete payload.client_user_id;
      if (!payload.due_date) delete payload.due_date;
      if (!payload.notes) delete payload.notes;
      if (!payload.company_name) delete payload.company_name;
      if (!payload.company_logo_url) delete payload.company_logo_url;
      const res = await api.post("/assessment/sessions", payload);
      const created = res.data?.data;
      toast.success(t("assess.linkCreated"));
      setCreateOpen(false);
      setForm({ template_id: templates[0]?.id || "", client_name: "", client_user_id: "", project_name: "", contact_person: "", contact_email: "", due_date: "", notes: "", company_name: "", brand_color: "#5B49C9", company_logo_url: "" });
      load();
      if (created?.share_url) {
        try { await navigator.clipboard.writeText(origin + created.share_url); toast.success(t("assess.linkCopied")); } catch { /* ignore */ }
      }
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  const acknowledge = async (id) => {
    try { await api.post(`/assessment/sessions/${id}/acknowledge`); load(); } catch (err) { toast.error(apiError(err)); }
  };
  const remove = async (id) => {
    try { await api.delete(`/assessment/sessions/${id}`); toast.success(t("assess.delete")); load(); } catch (err) { toast.error(apiError(err)); }
  };

  const togglePublish = async (tpl) => {
    try {
      const res = await api.post(`/assessment/templates/${tpl.id}/publish`);
      const newState = res.data?.data?.published;
      toast.success(newState ? "Template dipublish" : "Template di-unpublish");
      loadTemplates();
    } catch (err) { toast.error(apiError(err)); }
  };

  const deleteTemplate = async (tpl) => {
    try { await api.delete(`/assessment/templates/${tpl.id}`); toast.success("Template dihapus"); loadTemplates(); }
    catch (err) { toast.error(apiError(err)); }
  };

  const downloadExcelTemplate = async () => {
    try {
      const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
      const token = localStorage.getItem("kti_token") || sessionStorage.getItem("kti_token") || "";
      const resp = await fetch(`${BACKEND}/api/assessment/templates/excel-template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Gagal mengunduh template");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "assessment_template.xlsx"; a.click(); URL.revokeObjectURL(url);
    } catch (err) { toast.error("Gagal mengunduh: " + err.message); }
  };

  const handleImportExcel = async () => {
    if (!importFile) { toast.error("Pilih file Excel terlebih dahulu"); return; }
    if (!importForm.name_id.trim()) { toast.error("Nama template wajib diisi"); return; }
    setImportBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("name_id", importForm.name_id.trim());
      fd.append("name_en", importForm.name_en.trim());
      fd.append("description", importForm.description.trim());
      fd.append("category", importForm.category);
      const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
      const token = localStorage.getItem("kti_token") || sessionStorage.getItem("kti_token") || "";
      const resp = await fetch(`${BACKEND}/api/assessment/templates/import-excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || "Import gagal");
      toast.success(`Template berhasil diimport: ${data.data?.sections_count || 0} domain, ${data.data?.questions_count || 0} pertanyaan`);
      setImportOpen(false); setImportFile(null);
      setImportForm({ name_id: "", name_en: "", description: "", category: "general" });
      loadTemplates();
    } catch (err) { toast.error("Import gagal: " + err.message); }
    finally { setImportBusy(false); }
  };

  const statCards = [
    { label: t("assess.totalSessions"), value: stats?.total_sessions ?? 0, icon: Inbox },
    { label: t("assess.submittedCount"), value: stats?.submitted_sessions ?? 0, icon: Send },
    { label: t("assess.newCount"), value: stats?.new_submissions ?? 0, icon: Sparkles },
    { label: "Total Template", value: stats?.total_templates ?? 0, icon: BookTemplate },
  ];

  return (
    <div data-testid={ASSESS.adminPage}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("assess.title")}</h1>
        <div className="flex items-center gap-2">
          {activeTab === "templates" && (
            <>
              <button onClick={downloadExcelTemplate} title="Download Template Excel" className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white">
                <Download className="size-4" /> Template Excel
              </button>
              <button onClick={() => setImportOpen(true)} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(245,190,100,0.45)] bg-[rgba(245,190,100,0.12)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(245,190,100,0.22)]" data-testid="btn-import-excel">
                <FileSpreadsheet className="size-4" /> Import Excel
              </button>
              <button onClick={() => setBuilderTemplate(null)} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.15)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.25)]" data-testid="btn-new-template">
                <Plus className="size-4" /> Buat Template
              </button>
            </>
          )}
          {activeTab === "sessions" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button data-testid={ASSESS.createBtn} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)]">
                  <Plus className="size-4" /> {t("assess.create")}
                </button>
              </DialogTrigger>
              <DialogContent className="border-white/10 max-w-lg" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                <DialogHeader><DialogTitle>{t("assess.create")}</DialogTitle></DialogHeader>
                <form onSubmit={submitCreate} className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>{t("assess.template")}</label>
                    <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                      <SelectTrigger className="border-white/12 bg-white/[0.04]" data-testid={ASSESS.templateSelect}><SelectValue placeholder="Pilih template" /></SelectTrigger>
                      <SelectContent>{templates.filter(tp => tp.published).map((tp) => <SelectItem key={tp.id} value={tp.id}>{loc(tp.name, i18n.language)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={labelCls}>{t("assess.clientName")} *</label><input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={fieldCls} data-testid={ASSESS.clientInput} /></div>
                    <div>
                      <label className={labelCls}>Assign ke Client User</label>
                      <Select value={form.client_user_id || "_none"} onValueChange={(v) => setForm({ ...form, client_user_id: v === "_none" ? "" : v })}>
                        <SelectTrigger className="border-white/12 bg-white/[0.04]" data-testid="assess-client-user-select"><SelectValue placeholder="— Tanpa binding —" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">— Tanpa binding —</SelectItem>
                          {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={labelCls}>{t("assess.projectName")}</label><input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} className={fieldCls} /></div>
                    <div><label className={labelCls}>Tenggat (Due Date)</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={fieldCls} /></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={labelCls}>{t("assess.contactPerson")}</label><input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className={fieldCls} /></div>
                    <div><label className={labelCls}>{t("assess.contactEmail")}</label><input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={fieldCls} /></div>
                  </div>
                  <div><label className={labelCls}>Catatan</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fieldCls} rows={2} /></div>

                  {/* Branding Section */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Branding Klien (Opsional)</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Nama Perusahaan (untuk PDF)</label>
                        <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className={fieldCls} placeholder="Contoh: PT Maju Bersama" />
                      </div>
                      <div>
                        <label className={labelCls}>Warna Brand (hex)</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-white/12 bg-transparent p-0.5" />
                          <input value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                            className={`${fieldCls} flex-1`} placeholder="#5B49C9" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>URL Logo Perusahaan (opsional)</label>
                      <input value={form.company_logo_url} onChange={(e) => setForm({ ...form, company_logo_url: e.target.value })}
                        className={fieldCls} placeholder="https://... atau kosongkan. Upload via Media Library lalu paste URL-nya." />
                      <p className="mt-1 text-[11px] text-white/30">Tip: Upload logo ke Media Library terlebih dahulu, lalu paste URL-nya di sini.</p>
                    </div>
                  </div>

                  <DialogFooter>
                    <button type="submit" disabled={busy || !form.template_id || !form.client_name} data-testid={ASSESS.createSubmit} className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60">{busy && <Loader2 className="size-4 animate-spin" />} {t("assess.generate")}</button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between"><span className="grid size-8 place-items-center rounded-lg border border-white/12 bg-white/[0.04]"><s.icon className="size-4 text-[#73D1AD]" /></span></div>
            <p className="font-display text-2xl font-semibold text-white">{s.value}</p>
            <p className="text-xs text-[color:var(--kti-text-dim)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit">
        <button onClick={() => setActiveTab("sessions")} data-testid="tab-sessions" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${ activeTab === "sessions" ? "bg-white/[0.09] text-white border border-white/12" : "text-[color:var(--kti-text-dim)] hover:text-white" }`}>
          <Inbox className="size-4" /> Sesi Assessment
        </button>
        <button onClick={() => setActiveTab("templates")} data-testid="tab-templates" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${ activeTab === "templates" ? "bg-white/[0.09] text-white border border-white/12" : "text-[color:var(--kti-text-dim)] hover:text-white" }`}>
          <ClipboardList className="size-4" /> Template
        </button>
      </div>

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04]">
          {loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={load} /> : sessions.length === 0 ? <EmptyView message={t("assess.noSessions")} /> : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-white/70">Client / User</TableHead>
                  <TableHead className="text-white/70">Template</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Progress</TableHead>
                  <TableHead className="text-white/70">Due Date</TableHead>
                  <TableHead className="text-right text-white/70">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id} className="border-white/8 hover:bg-white/[0.03]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{s.client_name}</span>
                        {s.is_new_submission ? <span className="rounded-full border border-[rgba(115,209,173,0.5)] bg-[rgba(115,209,173,0.16)] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#a9ecd2]">{t("assess.newBadge")}</span> : null}
                      </div>
                      {s.client_user_name && <p className="flex items-center gap-1 text-xs text-[#73D1AD]"><Users className="size-3" /> {s.client_user_name}</p>}
                      {s.project_name ? <p className="text-xs text-[color:var(--kti-text-dim)]">{s.project_name}</p> : null}
                    </TableCell>
                    <TableCell className="text-xs text-[color:var(--kti-text-dim)]">{s.template_name ? loc(s.template_name, i18n.language) : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs ${ s.status === "submitted" ? "text-[#a9ecd2]" : "text-white/45" }`}>
                        <span className={`size-1.5 rounded-full ${ s.status === "submitted" ? "bg-[#73D1AD]" : "bg-white/30" }`} />
                        {s.status === "submitted" ? t("assess.statusSubmitted") : t("assess.statusDraft")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#7C68E1] to-[#73D1AD]" style={{ width: `${s.progress?.percent || 0}%` }} /></div>
                        <span className="text-xs text-[color:var(--kti-text-dim)]">{s.progress?.percent || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[color:var(--kti-text-dim)]">{s.due_date ? new Date(s.due_date).toLocaleDateString("id") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => copyLink(s.share_url)} data-testid={`${ASSESS.copyLink}-${s.id}`} title={t("assess.copyLink")} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.06]"><Copy className="size-3.5" /></button>
                        <a href={origin + s.share_url} target="_blank" rel="noreferrer" title={t("assess.open")} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.06]"><ExternalLink className="size-3.5" /></a>
                        <button onClick={() => setDetailSessionId(s.id)} data-testid={`view-responses-${s.id}`} title="Lihat Jawaban" className="kti-focus grid size-8 place-items-center rounded-lg border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.08)] text-[#7C68E1] hover:bg-[rgba(124,104,225,0.16)]"><LayoutList className="size-3.5" /></button>
                        {s.status === "submitted" && <a href={pdfUrl(s.token, i18n.language.startsWith("en") ? "en" : "id")} target="_blank" rel="noreferrer" title={t("assess.exportPdf")} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.06]"><FileText className="size-3.5" /></a>}
                        {s.is_new_submission ? <button onClick={() => acknowledge(s.id)} data-testid={`${ASSESS.ackBtn}-${s.id}`} title={t("assess.acknowledge")} className="kti-focus grid size-8 place-items-center rounded-lg border border-[rgba(115,209,173,0.4)] text-[#a9ecd2] hover:bg-[rgba(115,209,173,0.1)]"><Check className="size-3.5" /></button> : null}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button data-testid={`${ASSESS.deleteBtn}-${s.id}`} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><Trash2 className="size-3.5" /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                            <AlertDialogHeader><AlertDialogTitle>{t("assess.confirmDelete")}</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]">{t("admin.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(s.id)} data-testid={ASSESS.confirmDeleteBtn} className="border border-[rgba(255,92,122,0.4)] bg-[rgba(255,92,122,0.18)] text-white hover:bg-[rgba(255,92,122,0.28)]">{t("assess.delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/12 py-16">
              <ClipboardList className="size-10 text-white/20" />
              <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada template. Klik &quot;Buat Template&quot; untuk mulai.</p>
            </div>
          ) : templates.map((tpl) => (
            <div key={tpl.id} data-testid={`template-row-${tpl.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{loc(tpl.name, i18n.language)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tpl.published ? "bg-[rgba(115,209,173,0.18)] text-[#73D1AD] border border-[rgba(115,209,173,0.35)]" : "bg-white/[0.05] text-white/40 border border-white/10"}`}>
                    {tpl.published ? "Published" : "Draft"}
                  </span>
                  <span className="rounded-full bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] text-white/50">{tpl.category}</span>
                </div>
                <p className="mt-0.5 text-xs text-[color:var(--kti-text-dim)]">{tpl.domain_count || tpl.section_count || 0} domain · {tpl.question_count || 0} pertanyaan</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setBuilderTemplate(tpl)} title="Edit" className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.06]"><Pencil className="size-3.5" /></button>
                <button onClick={() => togglePublish(tpl)} title={tpl.published ? "Unpublish" : "Publish"} className={`grid size-8 place-items-center rounded-lg border text-sm ${ tpl.published ? "border-[rgba(255,150,100,0.4)] text-[#ffb07a] hover:bg-[rgba(255,150,100,0.08)]" : "border-[rgba(115,209,173,0.4)] text-[#73D1AD] hover:bg-[rgba(115,209,173,0.08)]" }`}>
                  {tpl.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button disabled={tpl.published} title="Hapus" className="grid size-8 place-items-center rounded-lg border border-white/10 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)] disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="size-3.5" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                    <AlertDialogHeader><AlertDialogTitle>Hapus template ini?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]">Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTemplate(tpl)} className="border border-[rgba(255,92,122,0.4)] bg-[rgba(255,92,122,0.18)] text-white">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Excel Import Dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setImportOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: "#0B0D17" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Import Template dari Excel</h2>
              <button onClick={() => setImportOpen(false)} className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.05]"><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Nama Template (ID) *</label>
                <input value={importForm.name_id} onChange={(e) => setImportForm({ ...importForm, name_id: e.target.value })}
                  className={fieldCls} placeholder="Nama template (Bahasa Indonesia)" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Nama Template (EN)</label>
                <input value={importForm.name_en} onChange={(e) => setImportForm({ ...importForm, name_en: e.target.value })}
                  className={fieldCls} placeholder="Template name (English)" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Deskripsi (opsional)</label>
                <input value={importForm.description} onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                  className={fieldCls} placeholder="Deskripsi singkat template" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">File Excel (.xlsx) *</label>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.05]">
                    <Upload className="size-4" /> Pilih File
                  </button>
                  {importFile && <span className="truncate text-sm text-[#73D1AD]">{importFile.name}</span>}
                </div>
                <p className="mt-1.5 text-[11px] text-white/30">Format kolom: section_name_id, question_text_id, type, required, options_id, ... — <button type="button" onClick={downloadExcelTemplate} className="text-[#7C68E1] hover:underline">download template</button></p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setImportOpen(false)} className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.04]">Batal</button>
              <button onClick={handleImportExcel} disabled={importBusy || !importFile || !importForm.name_id.trim()}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,190,100,0.45)] bg-[rgba(245,190,100,0.15)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(245,190,100,0.25)] disabled:opacity-60">
                {importBusy && <Loader2 className="size-4 animate-spin" />}
                <FileSpreadsheet className="size-4" /> Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor V2 */}
      {builderTemplate !== undefined && (
        <TemplateEditorV2
          template={builderTemplate === null ? null : builderTemplate}
          onClose={() => setBuilderTemplate(undefined)}
          onSaved={loadTemplates}
        />
      )}

      {/* Session Detail Modal (V2) */}
      {detailSessionId && (
        <SessionDetailModal
          sessionId={detailSessionId}
          onClose={() => setDetailSessionId(null)}
        />
      )}
    </div>
  );
}
