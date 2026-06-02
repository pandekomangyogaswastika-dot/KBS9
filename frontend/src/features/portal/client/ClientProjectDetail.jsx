import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock, Circle,
  FileText, Upload, Trash2, CheckSquare, XSquare, Plus, X, PenLine, Download
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";
import SignatureModal from "@/components/SignatureModal";

const TABS = ["overview", "milestones", "documents", "approvals"];
const TAB_LABELS = { overview: "Ringkasan", milestones: "Milestone", documents: "Dokumen", approvals: "Persetujuan" };

const STATUS_COLOR = { active: "#4ECBAF", completed: "#7C68E1", on_hold: "#F2A83E", cancelled: "#E05555" };
const MS_COLOR = { done: "#4ECBAF", in_progress: "#7C68E1", todo: "#555" };
const MS_ICON = { done: CheckCircle2, in_progress: Clock, todo: Circle };

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: "var(--kti-teal)" }} />
    </div>
  );
}

function MilestoneTimeline({ milestones }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-0" data-testid={PORTAL.milestoneList}>
      {milestones.map((m, i) => {
        const Icon = MS_ICON[m.status] || Circle;
        const color = MS_COLOR[m.status] || "#555";
        return (
          <div key={m.id} className="flex gap-4" data-testid={PORTAL.milestoneItem}>
            <div className="flex flex-col items-center">
              <div className="grid size-8 shrink-0 place-items-center rounded-full border" style={{ borderColor: color, background: `${color}22` }}>
                <Icon className="size-4" style={{ color }} />
              </div>
              {i < milestones.length - 1 && <div className="w-px flex-1 my-1" style={{ background: "rgba(255,255,255,0.08)" }} />}
            </div>
            <div className="pb-6 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-white">{m.title}</p>
                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                  {t(`portal.milestone.${m.status}`)}
                </span>
              </div>
              {m.description && <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{m.description}</p>}
              <div className="mt-2 flex gap-4 text-xs text-[color:var(--kti-text-faint)]">
                {m.due_date && <span>Tenggat: {new Date(m.due_date).toLocaleDateString("id-ID")}</span>}
                {m.completed_at && <span>Selesai: {new Date(m.completed_at).toLocaleDateString("id-ID")}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const APPROVAL_COLOR = { pending: "#F2A83E", approved: "#4ECBAF", changes_requested: "#E05555" };
const APPROVAL_LABEL = { pending: "Menunggu", approved: "Disetujui", changes_requested: "Perlu Revisi" };

function fmtBytes(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

export default function ClientProjectDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalForm, setApprovalForm] = useState({ title: "", note: "", milestone_id: "" });
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSigningApproval, setCurrentSigningApproval] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [approvalSignatures, setApprovalSignatures] = useState({});

  const load = useCallback(async () => {
    try {
      const [pRes, mRes, dRes, aRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/milestones`),
        api.get(`/projects/${id}/documents`),
        api.get(`/projects/${id}/approvals`),
      ]);
      setProject(pRes.data?.data);
      setMilestones(mRes.data?.data || []);
      setDocuments(dRes.data?.data || []);
      setApprovals(aRes.data?.data || []);
      // Load signatures for each approval
      const approvalIds = (aRes.data?.data || []).map(a => a.id);
      const sigMap = {};
      for (const aid of approvalIds) {
        try {
          const sigRes = await api.get(`/projects/${id}/approvals/${aid}/signatures`);
          sigMap[aid] = sigRes.data?.data || [];
        } catch { sigMap[aid] = []; }
      }
      setApprovalSignatures(sigMap);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitApproval = async () => {
    if (!approvalForm.title.trim()) { toast.error("Judul wajib diisi"); return; }
    setSubmittingApproval(true);
    try {
      await api.post(`/projects/${id}/approvals`, { ...approvalForm, milestone_id: approvalForm.milestone_id || null });
      toast.success("Permintaan persetujuan terkirim");
      setShowApprovalForm(false);
      setApprovalForm({ title: "", note: "", milestone_id: "" });
      const aRes = await api.get(`/projects/${id}/approvals`);
      setApprovals(aRes.data?.data || []);
    } catch (err) {
      toast.error(apiError(err, "Gagal mengirim"));
    } finally { setSubmittingApproval(false); }
  };

  const openSignatureModal = (approval) => {
    setCurrentSigningApproval(approval);
    setShowSignatureModal(true);
  };

  const handleSign = async (signatureType, signatureData, signerName) => {
    if (!currentSigningApproval) return;
    setSigningLoading(true);
    try {
      await api.post(`/projects/${id}/approvals/${currentSigningApproval.id}/sign`, {
        signature_type: signatureType,
        signature_data: signatureData,
        signer_name: signerName,
      });
      toast.success("Approval berhasil ditandatangani!");
      setShowSignatureModal(false);
      setCurrentSigningApproval(null);
      await load(); // Reload data
    } catch (err) {
      toast.error(apiError(err, "Gagal menandatangani"));
    } finally { setSigningLoading(false); }
  };

  const downloadCertificate = async (approvalId) => {
    try {
      const res = await api.get(`/projects/${id}/approvals/${approvalId}/certificate`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate-${approvalId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiError(err, "Gagal mengunduh sertifikat"));
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;
  if (!project) return <div className="text-center py-20"><AlertCircle className="size-10 mx-auto mb-3" style={{ color: "#E05555" }} /><p>Proyek tidak ditemukan</p></div>;

  const statusColor = STATUS_COLOR[project.status] || "#888";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/portal/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--kti-text-dim)] hover:text-white">
          <ArrowLeft className="size-4" /> Semua Proyek
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono-kti text-[10px] tracking-wider text-[color:var(--kti-text-faint)]">{project.code}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-white">{project.name}</h1>
          </div>
          <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
            {t(`portal.status.${project.status}`) || project.status}
          </span>
        </div>
        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs"><span className="text-[color:var(--kti-text-dim)]">{t("portal.progress")}</span><span className="text-white">{project.progress}%</span></div>
          <ProgressBar value={project.progress} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-testid={`${PORTAL.projectDetailTab}-${tab}`}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white/[0.09] text-white"
                : "text-[color:var(--kti-text-dim)] hover:text-white"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
            <h3 className="mb-4 font-semibold text-white">Informasi Proyek</h3>
            <dl className="space-y-3 text-sm">
              {[{label:"Kode",value:project.code},{label:"Status",value:project.status},{label:"Progress",value:`${project.progress}%`},
                {label:"Mulai",value:project.start_date?new Date(project.start_date).toLocaleDateString("id-ID"):"—"},
                {label:"Tenggat",value:project.due_date?new Date(project.due_date).toLocaleDateString("id-ID"):"—"}].map(({label,value})=>(
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-[color:var(--kti-text-dim)]">{label}</dt>
                  <dd className="text-right font-medium text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
            <h3 className="mb-3 font-semibold text-white">Ringkasan Proyek</h3>
            <p className="text-sm text-[color:var(--kti-text-dim)] leading-relaxed">{project.summary || "—"}</p>
            {project.staff_details?.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Tim Assigned</h4>
                <div className="space-y-2">
                  {project.staff_details.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <div className="grid size-7 place-items-center rounded-full border border-white/15 bg-white/8 text-[10px] font-bold text-white">{s.name[0]}</div>
                      <span className="text-[color:var(--kti-text-dim)]">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
          <h3 className="mb-6 font-semibold text-white">Milestone & Timeline</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-[color:var(--kti-text-faint)]">Belum ada milestone.</p>
          ) : (
            <MilestoneTimeline milestones={milestones} />
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
          <h3 className="mb-6 font-semibold text-white">{t("portal.document.title")}</h3>
          {documents.length === 0 ? (
            <p className="text-sm text-[color:var(--kti-text-faint)]">{t("portal.document.noDocuments")}</p>
          ) : (
            <div className="space-y-3" data-testid={PORTAL.documentList}>
              {documents.map((d) => (
                <div key={d.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/8">
                    <FileText className="size-4" style={{ color: "var(--kti-indigo)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">{d.name}</p>
                    <p className="text-xs text-[color:var(--kti-text-faint)]">{fmtBytes(d.size)} · {new Date(d.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                  {d.url ? (
                    <a href={d.url} download={d.name} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[color:var(--kti-text-dim)] hover:text-white hover:bg-white/[0.06]">
                      Unduh
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] text-[color:var(--kti-text-faint)]">Demo</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{t("portal.approval.title")}</h3>
            {user?.role === "client" && (
              <button
                onClick={() => setShowApprovalForm(true)}
                data-testid={PORTAL.approvalRequestBtn}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.12)] px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(124,104,225,0.22)] transition-colors"
              >
                <Plus className="size-3.5" /> {t("portal.approval.request")}
              </button>
            )}
          </div>

          {showApprovalForm && (
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-medium text-white">Ajukan Permintaan Persetujuan</h4>
                <button onClick={() => setShowApprovalForm(false)} className="text-[color:var(--kti-text-dim)] hover:text-white"><X className="size-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Judul *</label>
                  <input value={approvalForm.title} onChange={(e) => setApprovalForm((f) => ({ ...f, title: e.target.value }))} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="Judul persetujuan" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Catatan</label>
                  <textarea value={approvalForm.note} onChange={(e) => setApprovalForm((f) => ({ ...f, note: e.target.value }))} rows={3} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white resize-none" placeholder="Deskripsi / konteks..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[color:var(--kti-text-dim)]">Terkait Milestone (opsional)</label>
                  <select value={approvalForm.milestone_id} onChange={(e) => setApprovalForm((f) => ({ ...f, milestone_id: e.target.value }))} className="kti-focus w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3 py-2 text-sm text-white">
                    <option value="">— Tidak ada —</option>
                    {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={submitApproval} disabled={submittingApproval} className="inline-flex items-center gap-1.5 rounded-xl bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.45)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-60">
                    {submittingApproval ? <><Loader2 className="size-3.5 animate-spin" /> Mengirim...</> : "Kirim"}
                  </button>
                  <button onClick={() => setShowApprovalForm(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white">Batal</button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3" data-testid={PORTAL.approvalList}>
            {approvals.length === 0 ? (
              <p className="text-sm text-[color:var(--kti-text-faint)]">Belum ada permintaan persetujuan.</p>
            ) : approvals.map((a) => {
              const col = APPROVAL_COLOR[a.status] || "#888";
              const sigs = approvalSignatures[a.id] || [];
              const userSigned = sigs.find(s => s.signer_id === user?.id);
              const canSign = a.status === "approved" && !userSigned && user?.role === "client";
              return (
                <div key={a.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-medium text-white">{a.title}</p>
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}>
                      {APPROVAL_LABEL[a.status] || a.status}
                    </span>
                  </div>
                  {a.note && <p className="mb-2 text-sm text-[color:var(--kti-text-dim)]">{a.note}</p>}
                  {a.feedback && <p className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-sm italic text-[color:var(--kti-text-dim)]">Feedback: {a.feedback}</p>}
                  
                  {/* Signature actions */}
                  {sigs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/8">
                      <p className="text-xs text-[color:var(--kti-text-faint)] mb-2">Ditandatangani oleh: {sigs.map(s => s.signer_name).join(", ")}</p>
                      <button
                        onClick={() => downloadCertificate(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(78,203,175,0.3)] bg-[rgba(78,203,175,0.12)] px-3 py-1.5 text-xs font-medium text-[#4ECBAF] hover:bg-[rgba(78,203,175,0.22)] transition-colors"
                        data-testid="approval-download-cert-btn"
                      >
                        <Download className="size-3.5" /> Unduh Sertifikat (PDF)
                      </button>
                    </div>
                  )}
                  
                  {canSign && (
                    <div className="mt-3 pt-3 border-t border-white/8">
                      <button
                        onClick={() => openSignatureModal(a)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.18)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[rgba(124,104,225,0.28)] transition-colors"
                        data-testid="approval-sign-btn"
                      >
                        <PenLine className="size-3.5" /> Tanda Tangani
                      </button>
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-[color:var(--kti-text-faint)]">{new Date(a.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Signature Modal */}
      <SignatureModal
        open={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setCurrentSigningApproval(null);
        }}
        onSign={handleSign}
        approvalTitle={currentSigningApproval?.title || ""}
        loading={signingLoading}
      />
    </div>
  );
}
