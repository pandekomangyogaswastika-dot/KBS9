import { useEffect, useState } from "react";
import { discoveryApi } from "./api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Link2, Download, Trash2, Copy, ExternalLink,
  FileText, ClipboardCheck, RefreshCw, Eye, ShieldCheck, Loader2,
  BellRing, CheckCheck, Inbox,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const formatRelative = (iso) => {
  if (!iso) return null;
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(iso);
};

export const DiscoveryAdmin = ({ onNavigate }) => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_name: "", project_name: "", contact_person: "", contact_email: "", notes: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sList, sStats] = await Promise.all([
        discoveryApi.listSessions(),
        discoveryApi.fetchStats(),
      ]);
      setSessions(sList);
      setStats(sStats);
    } catch {
      toast({ title: "Gagal memuat", description: "Tidak bisa ambil daftar session.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Auto-refresh setiap 30 detik agar badge "New" responsif
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const buildLink = (sessionId) => `${window.location.origin}/discovery/${sessionId}`;

  const copyLink = async (sessionId) => {
    try {
      await navigator.clipboard.writeText(buildLink(sessionId));
      toast({ title: "Tersalin", description: "Link discovery sudah disalin ke clipboard." });
    } catch {
      toast({ title: "Tidak bisa salin", description: "Salin manual dari kolom Link.", variant: "destructive" });
    }
  };

  const submitCreate = async () => {
    if (!form.client_name.trim()) {
      toast({ title: "Wajib diisi", description: "Client Name tidak boleh kosong.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const created = await discoveryApi.createSession({
        client_name: form.client_name.trim(),
        project_name: form.project_name.trim() || null,
        contact_person: form.contact_person.trim() || null,
        contact_email: form.contact_email.trim() || null,
        notes: form.notes.trim() || null,
      });
      setShowCreate(false);
      setForm({ client_name: "", project_name: "", contact_person: "", contact_email: "", notes: "" });
      await fetchAll();
      // Auto-copy link
      try {
        await navigator.clipboard.writeText(buildLink(created.id));
        toast({ title: "Session dibuat", description: "Link sudah disalin ke clipboard." });
      } catch {
        toast({ title: "Session dibuat", description: `ID: ${created.id}` });
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || "Gagal create session.";
      toast({ title: "Error", description: detail, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await discoveryApi.deleteSession(sessionId);
      await fetchAll();
      toast({ title: "Session dihapus" });
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const handleAcknowledge = async (sessionId) => {
    try {
      await discoveryApi.acknowledgeSession(sessionId);
      await fetchAll();
      toast({ title: "Submission ditandai sudah dibaca" });
    } catch {
      toast({ title: "Gagal acknowledge", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-discovery-primary text-xs font-bold text-white">KN</span>
              <Badge className="border-0 bg-discovery-soft text-[10px] font-semibold uppercase tracking-widest text-discovery-primary">
                <ShieldCheck size={10} className="mr-1" /> Vendor Console
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-discovery-text sm:text-3xl">Discovery E-Questionnaire</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-discovery-muted">
              Buat dan kelola session discovery untuk setiap klien. Setiap session menghasilkan link unik
              yang bisa Anda kirim ke klien — tanpa perlu login.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="admin-refresh"
              variant="outline"
              onClick={fetchAll}
              className="border-discovery-border text-discovery-text hover:border-discovery-primary"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button
                  data-testid="admin-create-session"
                  className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
                >
                  <Plus size={14} className="mr-1.5" /> Buat Session Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="border-discovery-border bg-white">
                <DialogHeader>
                  <DialogTitle className="text-discovery-text">Buat Session Discovery</DialogTitle>
                  <DialogDescription className="text-discovery-muted">
                    Isi data klien. Setelah create, link akan otomatis disalin ke clipboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div>
                    <Label htmlFor="client_name" className="text-discovery-text">Nama Klien <span className="text-discovery-danger">*</span></Label>
                    <Input
                      id="client_name"
                      data-testid="admin-form-client-name"
                      value={form.client_name}
                      onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                      placeholder="PT. Demo Company"
                      className="border-discovery-border focus:border-discovery-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project_name" className="text-discovery-text">Nama Project</Label>
                    <Input
                      id="project_name"
                      data-testid="admin-form-project-name"
                      value={form.project_name}
                      onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                      placeholder="ERP Implementation 2026"
                      className="border-discovery-border focus:border-discovery-primary"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact_person" className="text-discovery-text">Contact Person</Label>
                      <Input
                        id="contact_person"
                        data-testid="admin-form-contact-person"
                        value={form.contact_person}
                        onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                        placeholder="Budi Santoso"
                        className="border-discovery-border focus:border-discovery-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email" className="text-discovery-text">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        data-testid="admin-form-contact-email"
                        value={form.contact_email}
                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                        placeholder="budi@klien.com"
                        className="border-discovery-border focus:border-discovery-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-discovery-text">Catatan Internal (opsional)</Label>
                    <Textarea
                      id="notes"
                      data-testid="admin-form-notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Catatan untuk tim vendor — tidak ditampilkan ke klien"
                      rows={2}
                      className="border-discovery-border focus:border-discovery-primary"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-testid="admin-form-cancel"
                    onClick={() => setShowCreate(false)}
                    className="border-discovery-border"
                  >
                    Batal
                  </Button>
                  <Button
                    data-testid="admin-form-submit"
                    onClick={submitCreate}
                    disabled={creating || !form.client_name.trim()}
                    className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
                  >
                    {creating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
                    {creating ? "Membuat..." : "Buat & Salin Link"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {loading ? (
          <Card className="border-discovery-border p-8 text-center">
            <Loader2 size={20} className="mx-auto animate-spin text-discovery-muted" />
            <p className="mt-2 text-sm text-discovery-muted">Memuat session...</p>
          </Card>
        ) : (
          <>
            {/* Stats banner */}
            {stats ? (
              <div className="mb-6 grid gap-3 sm:grid-cols-4" data-testid="admin-stats-banner">
                <Card className={`border-discovery-border bg-white p-4 ${stats.new_submissions > 0 ? "ring-2 ring-discovery-warn/40" : ""}`}>
                  <div className="flex items-center gap-2 text-xs text-discovery-muted">
                    <BellRing size={13} className={stats.new_submissions > 0 ? "text-discovery-warn" : ""} />
                    Submission Baru
                  </div>
                  <p
                    className={`mt-1 text-2xl font-bold ${stats.new_submissions > 0 ? "text-discovery-warn" : "text-discovery-text"}`}
                    data-testid="admin-stats-new-submissions"
                  >
                    {stats.new_submissions}
                  </p>
                  {stats.new_submissions > 0 ? (
                    <p className="mt-1 text-[11px] text-discovery-warn">Perlu ditinjau</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-discovery-muted">Semua sudah ditinjau</p>
                  )}
                </Card>
                <Card className="border-discovery-border bg-white p-4">
                  <div className="flex items-center gap-2 text-xs text-discovery-muted">
                    <Inbox size={13} /> Total Session
                  </div>
                  <p className="mt-1 text-2xl font-bold text-discovery-text" data-testid="admin-stats-total">{stats.total_sessions}</p>
                  <p className="mt-1 text-[11px] text-discovery-muted">{stats.draft_sessions} draft, {stats.submitted_sessions} submitted</p>
                </Card>
                <Card className="border-discovery-border bg-white p-4">
                  <div className="flex items-center gap-2 text-xs text-discovery-muted">
                    <ClipboardCheck size={13} /> Submitted
                  </div>
                  <p className="mt-1 text-2xl font-bold text-discovery-success" data-testid="admin-stats-submitted">{stats.submitted_sessions}</p>
                  <p className="mt-1 text-[11px] text-discovery-muted">Siap di-review</p>
                </Card>
                <Card className="border-discovery-border bg-white p-4">
                  <div className="flex items-center gap-2 text-xs text-discovery-muted">
                    <FileText size={13} /> Submisi Terakhir
                  </div>
                  {stats.latest_submission ? (
                    <>
                      <p className="mt-1 truncate text-sm font-semibold text-discovery-text" data-testid="admin-stats-latest-client">
                        {stats.latest_submission.client_name}
                      </p>
                      <p className="mt-1 text-[11px] text-discovery-muted">
                        {formatRelative(stats.latest_submission.submitted_at)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm italic text-discovery-muted">Belum ada</p>
                  )}
                </Card>
              </div>
            ) : null}
            {sessions.length === 0 ? (
          <Card className="border-2 border-dashed border-discovery-border bg-white p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-discovery-muted" />
            <h3 className="mb-1 text-lg font-semibold text-discovery-text">Belum ada session</h3>
            <p className="mb-4 text-sm text-discovery-muted">
              Klik tombol "Buat Session Baru" untuk membuat link discovery pertama Anda.
            </p>
            <Button
              data-testid="admin-empty-create"
              onClick={() => setShowCreate(true)}
              className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
            >
              <Plus size={14} className="mr-1.5" /> Buat Session Baru
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sessions.map((s) => (
              <Card
                key={s.id}
                data-testid={`admin-session-${s.id}`}
                className="border-discovery-border bg-white p-5 transition-shadow hover:shadow-discovery"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-discovery-text">{s.client_name}</h3>
                      {s.status === "submitted" ? (
                        <Badge className="border-0 bg-discovery-success/15 text-[10px] font-semibold text-discovery-success">
                          <ClipboardCheck size={10} className="mr-1" /> Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-discovery-border text-[10px] font-medium text-discovery-muted">
                          Draft
                        </Badge>
                      )}
                      {s.is_new_submission ? (
                        <Badge
                          data-testid={`admin-session-${s.id}-new-badge`}
                          className="animate-pulse border-0 bg-discovery-warn text-[10px] font-bold uppercase tracking-widest text-white"
                        >
                          <BellRing size={10} className="mr-1" /> Baru!
                        </Badge>
                      ) : null}
                    </div>
                    {s.project_name ? (
                      <p className="text-sm text-discovery-muted">Project: {s.project_name}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-discovery-muted">
                      {s.contact_person ? <span>👤 {s.contact_person}</span> : null}
                      {s.contact_email ? <span>📧 {s.contact_email}</span> : null}
                      <span>📅 {formatDate(s.created_at)}</span>
                      {s.submitted_at ? (
                        <span data-testid={`admin-session-${s.id}-submitted-at`}>
                          ✅ Submitted {formatRelative(s.submitted_at)}
                        </span>
                      ) : null}
                      <span className="font-semibold text-discovery-primary">
                        {s.progress?.answered ?? 0}/{s.progress?.total ?? 0} terjawab ({s.progress?.percent ?? 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.is_new_submission ? (
                      <Button
                        data-testid={`admin-session-${s.id}-acknowledge`}
                        size="sm"
                        onClick={() => handleAcknowledge(s.id)}
                        className="bg-discovery-warn text-white hover:bg-discovery-warn/85"
                      >
                        <CheckCheck size={13} className="mr-1.5" /> Tandai Sudah Dibaca
                      </Button>
                    ) : null}
                    <Button
                      data-testid={`admin-session-${s.id}-copy`}
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(s.id)}
                      className="border-discovery-border text-discovery-text hover:border-discovery-primary"
                    >
                      <Copy size={13} className="mr-1.5" /> Salin Link
                    </Button>
                    <Button
                      data-testid={`admin-session-${s.id}-open`}
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(`/discovery/${s.id}`)}
                      className="border-discovery-border text-discovery-text hover:border-discovery-primary"
                    >
                      <Eye size={13} className="mr-1.5" /> Buka
                    </Button>
                    <Button
                      data-testid={`admin-session-${s.id}-pdf`}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(discoveryApi.exportPdfUrl(s.id), "_blank")}
                      className="border-discovery-accent/50 text-discovery-accent hover:bg-discovery-accent/10"
                    >
                      <Download size={13} className="mr-1.5" /> PDF
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          data-testid={`admin-session-${s.id}-delete`}
                          size="sm"
                          variant="outline"
                          className="border-discovery-danger/40 text-discovery-danger hover:bg-discovery-danger/10"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-discovery-border bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus session ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Session <strong>{s.client_name}</strong> dan semua jawaban akan dihapus permanen.
                            Tindakan ini tidak bisa di-undo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            data-testid={`admin-session-${s.id}-delete-confirm`}
                            onClick={() => handleDelete(s.id)}
                            className="bg-discovery-danger text-white hover:bg-discovery-danger/90"
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-discovery-bg-deep/40 px-3 py-2">
                  <Link2 size={12} className="shrink-0 text-discovery-muted" />
                  <code className="flex-1 truncate text-[11px] text-discovery-text">{buildLink(s.id)}</code>
                  <a
                    href={buildLink(s.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`admin-session-${s.id}-open-link`}
                    className="text-discovery-primary hover:text-discovery-primary-hover"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
