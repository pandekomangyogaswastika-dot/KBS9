import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Upload, Search, FolderPlus, Loader2, Copy, RefreshCw, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, EmptyView } from "@/components/StateViews";
import MediaThumb from "@/features/admin/media/MediaThumb";
import { uploadFiles, formatBytes, absUrl } from "@/features/admin/media/mediaApi";
import { MEDIA } from "@/constants/testIds";

const fieldCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]";

export default function MediaLibrary() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [folderId, setFolderId] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState(null);
  // New folder dialog state
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderSaving, setFolderSaving] = useState(false);
  const fileRef = useRef(null);

  const loadFolders = useCallback(async () => {
    try {
      const res = await api.get("/admin/media/folders");
      setFolders(res.data?.data || []);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      if (kind !== "all") params.set("kind", kind);
      if (folderId !== "all") params.set("folder_id", folderId);
      const res = await api.get(`/admin/media?${params.toString()}`);
      setAssets(res.data?.data || []);
    } catch (err) {
      toast.error(apiError(err, t("admin.loadError")));
    } finally {
      setLoading(false);
    }
  }, [search, kind, folderId, t]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const created = await uploadFiles(files, folderId !== "all" ? folderId : null);
      toast.success(`${created.length} \u00b7 ${t("media.uploaded")}`);
      load();
    } catch (err) {
      toast.error(apiError(err, t("media.uploadError")));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const openNewFolderDialog = () => {
    setNewFolderName("");
    setNewFolderOpen(true);
  };

  const submitNewFolder = async (e) => {
    e?.preventDefault?.();
    const name = newFolderName.trim();
    if (!name) {
      toast.error(t("media.folderNameRequired") || "Nama folder wajib diisi");
      return;
    }
    setFolderSaving(true);
    try {
      await api.post("/admin/media/folders", { name });
      toast.success(t("media.folderCreated"));
      setNewFolderOpen(false);
      setNewFolderName("");
      loadFolders();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setFolderSaving(false);
    }
  };

  return (
    <div data-testid={MEDIA.page}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("media.title")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={openNewFolderDialog} data-testid={MEDIA.newFolderButton} className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white hover:bg-white/[0.06]">
            <FolderPlus className="size-4" /> {t("media.newFolder")}
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid={MEDIA.uploadButton} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {uploading ? t("media.uploading") : t("media.upload")}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/mp4,video/webm,application/pdf" className="hidden" data-testid={MEDIA.uploadInput} onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("media.search")} data-testid={MEDIA.search} className={`${fieldCls} pl-9`} />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-36 border-white/12 bg-white/[0.04]" data-testid={MEDIA.kindFilter}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("media.all")}</SelectItem>
            <SelectItem value="image">{t("media.images")}</SelectItem>
            <SelectItem value="video">{t("media.videos")}</SelectItem>
            <SelectItem value="document">{t("media.documents")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={folderId} onValueChange={setFolderId}>
          <SelectTrigger className="w-44 border-white/12 bg-white/[0.04]" data-testid={MEDIA.folderFilter}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("media.allFolders")}</SelectItem>
            {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-[var(--kti-radius-card)] border bg-white/[0.03] p-4 transition-colors ${dragOver ? "border-[rgba(124,104,225,0.6)] bg-[rgba(124,104,225,0.08)]" : "border-white/10"}`}
      >
        {loading ? <LoadingView /> : assets.length === 0 ? (
          <div className="py-10">
            <EmptyView message={t("media.empty")} />
            <p className="mt-2 text-center text-xs text-[color:var(--kti-text-dim)]">{t("media.dropHint")} <button onClick={() => fileRef.current?.click()} className="underline">{t("media.browse")}</button></p>
          </div>
        ) : (
          <div data-testid={MEDIA.grid} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {assets.map((a) => (
              <button key={a.id} data-testid={MEDIA.card} onClick={() => setSelected({ ...a })} className="kti-focus group overflow-hidden rounded-xl border border-white/10 bg-black/20 text-left transition-colors hover:border-white/25">
                <div className="aspect-square overflow-hidden"><MediaThumb asset={a} className="transition-transform duration-300 group-hover:scale-105" /></div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs text-white">{a.original_name}</p>
                  <p className="mt-0.5 text-[10px] text-[color:var(--kti-text-dim)]">{a.kind} · {formatBytes(a.size_bytes)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <MediaDetail selected={selected} setSelected={setSelected} folders={folders} reload={load} t={t} />

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }} data-testid="media-new-folder-dialog">
          <DialogHeader>
            <DialogTitle>{t("media.newFolder") || "Folder Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitNewFolder} className="space-y-4">
            <div>
              <label className={labelCls}>{t("media.folderName") || "Nama Folder"}</label>
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t("media.folderNamePlaceholder") || "Contoh: Produk 2026"}
                className={fieldCls}
                data-testid="media-new-folder-input"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white hover:bg-white/[0.06]"
              >
                {t("admin.cancel") || "Batal"}
              </button>
              <button
                type="submit"
                disabled={folderSaving || !newFolderName.trim()}
                data-testid="media-create-folder-submit"
                className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60"
              >
                {folderSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("media.createFolder") || "Buat Folder"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MediaDetail({ selected, setSelected, folders, reload, t }) {
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const replaceRef = useRef(null);

  if (!selected) return null;

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/media/${selected.id}`, {
        alt: selected.alt,
        title: selected.title,
        tags: (selected._tagsStr ?? (selected.tags || []).join(", ")).split(",").map((s) => s.trim()).filter(Boolean),
        folder_id: selected.folder_id || null,
        folder_id_set: true,
      });
      toast.success(t("media.saved"));
      setSelected(null);
      reload();
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };

  const doReplace = async (files) => {
    if (!files || !files[0]) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      await api.post(`/admin/media/${selected.id}/replace`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t("media.saved"));
      setSelected(null);
      reload();
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/media/${selected.id}`);
      toast.success(t("media.deleted"));
      setDeleteOpen(false);
      setSelected(null);
      reload();
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(absUrl(selected.url)); toast.success(t("media.urlCopied")); } catch { /* ignore */ }
  };

  return (<>
    <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
      <DialogContent className="max-w-2xl border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }} data-testid="media-detail-dialog">
        <DialogHeader><DialogTitle>{t("media.details")}</DialogTitle></DialogHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30"><div className="aspect-video"><MediaThumb asset={selected} /></div></div>
            <dl className="mt-3 space-y-1 text-xs text-[color:var(--kti-text-dim)]">
              <div className="flex justify-between"><dt>{t("media.type")}</dt><dd className="text-white">{selected.mime_type}</dd></div>
              {selected.width && <div className="flex justify-between"><dt>{t("media.dimensions")}</dt><dd className="text-white">{selected.width}×{selected.height}</dd></div>}
              <div className="flex justify-between"><dt>{t("media.size")}</dt><dd className="text-white">{formatBytes(selected.size_bytes)}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={copyUrl} data-testid={MEDIA.copyUrlButton} className="kti-focus inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white hover:bg-white/[0.06]"><Copy className="size-3.5" /> {t("media.copyUrl")}</button>
              <button onClick={() => replaceRef.current?.click()} className="kti-focus inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white hover:bg-white/[0.06]"><RefreshCw className="size-3.5" /> {t("media.replace")}</button>
              <input ref={replaceRef} type="file" className="hidden" data-testid={MEDIA.replaceInput} onChange={(e) => doReplace(e.target.files)} />
              <button onClick={() => setDeleteOpen(true)} data-testid={MEDIA.deleteButton} className="kti-focus inline-flex items-center gap-1.5 rounded-lg border border-[rgba(255,92,122,0.4)] px-3 py-2 text-xs text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]"><Trash2 className="size-3.5" /> {t("media.delete")}</button>
            </div>
          </div>
          <div className="space-y-3">
            <div><label className={labelCls}>{t("media.altId")}</label><input value={selected.alt?.id || ""} onChange={(e) => setSelected({ ...selected, alt: { ...selected.alt, id: e.target.value } })} className={fieldCls} data-testid={MEDIA.altIdInput} /></div>
            <div><label className={labelCls}>{t("media.altEn")}</label><input value={selected.alt?.en || ""} onChange={(e) => setSelected({ ...selected, alt: { ...selected.alt, en: e.target.value } })} className={fieldCls} data-testid={MEDIA.altEnInput} /></div>
            <div><label className={labelCls}>{t("media.tags")}</label><input value={selected._tagsStr ?? (selected.tags || []).join(", ")} onChange={(e) => setSelected({ ...selected, _tagsStr: e.target.value })} className={fieldCls} data-testid={MEDIA.tagsInput} /></div>
            <div>
              <label className={labelCls}>{t("media.folder")}</label>
              <Select value={selected.folder_id || "none"} onValueChange={(v) => setSelected({ ...selected, folder_id: v === "none" ? null : v })}>
                <SelectTrigger className="border-white/12 bg-white/[0.04]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("media.noFolder")}</SelectItem>
                  {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button onClick={save} disabled={busy} data-testid={MEDIA.saveButton} className="kti-focus mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : null} {t("media.save")}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("media.confirmDelete") || "Hapus aset ini?"}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/50">
            {t("media.confirmDeleteDesc") || "Tindakan ini tidak dapat dibatalkan. Aset akan dihapus permanen."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]" disabled={busy}>
            {t("admin.cancel") || "Batal"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={doDelete}
            disabled={busy}
            data-testid="media-confirm-delete-button"
            className="border border-[rgba(255,92,122,0.4)] bg-[rgba(255,92,122,0.18)] text-white hover:bg-[rgba(255,92,122,0.28)]"
          >
            {busy ? <Loader2 className="size-4 animate-spin mr-2 inline" /> : null}
            {t("media.delete") || "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}
