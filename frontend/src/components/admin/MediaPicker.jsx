import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Upload, Search, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, EmptyView } from "@/components/StateViews";
import MediaThumb from "@/features/admin/media/MediaThumb";
import { uploadFiles } from "@/features/admin/media/mediaApi";
import { MEDIA } from "@/constants/testIds";

// Reusable picker dialog. onSelect(asset) returns the chosen media asset.
export default function MediaPicker({ open, onOpenChange, onSelect, kind = "image" }) {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (kind && kind !== "all") params.set("kind", kind);
      if (search) params.set("search", search);
      const res = await api.get(`/admin/media?${params.toString()}`);
      setAssets(res.data?.data || []);
    } catch (err) {
      toast.error(apiError(err, t("admin.loadError")));
    } finally {
      setLoading(false);
    }
  }, [kind, search, t]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const created = await uploadFiles(files, null);
      toast.success(t("media.uploaded"));
      if (created[0]) { onSelect(created[0]); onOpenChange(false); }
    } catch (err) {
      toast.error(apiError(err, t("media.uploadError")));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }} data-testid={MEDIA.picker}>
        <DialogHeader><DialogTitle>{t("media.pick")}</DialogTitle></DialogHeader>
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("media.search")} className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30" />
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {t("media.upload")}
          </button>
          <input ref={fileRef} type="file" multiple={false} accept={kind === "image" ? "image/*" : "image/*,video/mp4,video/webm,application/pdf"} className="hidden" data-testid={MEDIA.pickerUploadInput} onChange={(e) => handleFiles(e.target.files)} />
        </div>
        <div className="max-h-[55vh] overflow-y-auto">
          {loading ? <LoadingView /> : assets.length === 0 ? <EmptyView message={t("media.empty")} /> : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {assets.map((a) => (
                <button key={a.id} onClick={() => { onSelect(a); onOpenChange(false); }} className="kti-focus group relative overflow-hidden rounded-xl border border-white/10 bg-black/20 transition-colors hover:border-[rgba(124,104,225,0.6)]">
                  <div className="aspect-square"><MediaThumb asset={a} /></div>
                  <span className="absolute right-1.5 top-1.5 hidden size-6 place-items-center rounded-full bg-[rgba(124,104,225,0.9)] group-hover:grid"><Check className="size-3.5 text-white" /></span>
                  <p className="truncate px-2 py-1.5 text-[10px] text-white/80">{a.original_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
