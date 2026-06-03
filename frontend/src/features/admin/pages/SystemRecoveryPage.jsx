import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Upload, RefreshCw, CheckCircle, AlertTriangle, Loader2, Database, Trash2, X, FileArchive } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/apiClient";

const STRATEGY_OPTIONS = [
  { value: "add_missing", label: "Tambah yang Belum Ada", desc: "Hanya insert dokumen yang belum ada (aman, tidak menimpa data existing)" },
  { value: "replace_all", label: "Ganti Semua (Upsert)", desc: "Insert baru + update existing berdasarkan ID (dokumen yang tidak ada di backup dibiarkan)" },
  { value: "replace_collection", label: "Ganti Seluruh Collection (HAPUS DULU)", desc: "⚠️ Hapus semua data lalu isi ulang dari backup. TIDAK BISA DIBATALKAN." },
];

export default function SystemRecoveryPage() {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loadingCols, setLoadingCols] = useState(true);
  const [exportFormat, setExportFormat] = useState("zip");
  const [exportBusy, setExportBusy] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStrategy, setImportStrategy] = useState("add_missing");
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dedupBusy, setDedupBusy] = useState(false);
  const [dedupResult, setDedupResult] = useState(null);
  const fileRef = useRef(null);

  const loadCollections = useCallback(async () => {
    setLoadingCols(true);
    try {
      const res = await api.get("/admin/recovery/collections");
      const list = res.data?.data || [];
      setCollections(list);
      setSelected(new Set(list.map((c) => c.collection)));
    } catch (err) { toast.error("Gagal memuat daftar collection: " + apiError(err)); }
    finally { setLoadingCols(false); }
  }, []);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const toggleAll = () => {
    if (selected.size === collections.length) setSelected(new Set());
    else setSelected(new Set(collections.map((c) => c.collection)));
  };

  const toggleCol = (col) => {
    const next = new Set(selected);
    if (next.has(col)) next.delete(col); else next.add(col);
    setSelected(next);
  };

  const handleExport = async () => {
    if (selected.size === 0) { toast.error("Pilih minimal 1 collection"); return; }
    setExportBusy(true);
    try {
      const colList = [...selected].join(",");
      const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
      const token = localStorage.getItem("kti_token") || sessionStorage.getItem("kti_token") || "";
      const resp = await fetch(`${BACKEND}/api/admin/recovery/export?collections=${colList}&format=${exportFormat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Export gagal: " + resp.statusText);
      const blob = await resp.blob();
      const cd = resp.headers.get("content-disposition") || "";
      const fnMatch = cd.match(/filename=([^;]+)/);
      const filename = fnMatch ? fnMatch[1].replace(/"/g, "") : `kbs_backup.${exportFormat}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      toast.success(`Export berhasil: ${filename}`);
    } catch (err) { toast.error("Export gagal: " + err.message); }
    finally { setExportBusy(false); }
  };

  const handleImport = async () => {
    if (!importFile) { toast.error("Pilih file backup terlebih dahulu"); return; }
    setImportBusy(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
      const token = localStorage.getItem("kti_token") || sessionStorage.getItem("kti_token") || "";
      const colParam = selected.size > 0 ? `&collections=${[...selected].join(",")}` : "";
      const resp = await fetch(`${BACKEND}/api/admin/recovery/import?strategy=${importStrategy}${colParam}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || "Import gagal");
      setImportResult(data.data);
      toast.success(`Import selesai: ${data.data?.total_inserted || 0} inserted, ${data.data?.total_updated || 0} updated`);
    } catch (err) { toast.error("Import gagal: " + err.message); }
    finally { setImportBusy(false); }
  };

  const handleDedup = async () => {
    setDedupBusy(true); setDedupResult(null);
    try {
      const colParam = selected.size > 0 ? `?collections=${[...selected].join(",")}` : "";
      const res = await api.post(`/admin/recovery/dedup${colParam}`);
      setDedupResult(res.data?.data);
      const totalRemoved = Object.values(res.data?.data || {}).reduce((s, v) => s + (v?.removed_duplicates || 0), 0);
      toast.success(`Dedup selesai: ${totalRemoved} dokumen duplikat dihapus`);
      loadCollections();
    } catch (err) { toast.error("Dedup gagal: " + apiError(err)); }
    finally { setDedupBusy(false); }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">System Recovery</h1>
        <p className="mt-1 text-sm text-white/50">Export, import, dan bersihkan data sistem. Gunakan dengan hati-hati.</p>
      </div>

      {/* Collection Selector */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pilih Collection</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">{selected.size}/{collections.length} dipilih</span>
            <button onClick={toggleAll} className="text-xs text-[#7C68E1] hover:underline">
              {selected.size === collections.length ? "Deselect All" : "Select All"}
            </button>
            <button onClick={loadCollections} className="grid size-7 place-items-center rounded-lg border border-white/10 text-white/40 hover:bg-white/[0.05]">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>
        {loadingCols ? (
          <div className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" /> Memuat...</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <label key={col.collection} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${selected.has(col.collection) ? "border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.08)]" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                <input type="checkbox" checked={selected.has(col.collection)} onChange={() => toggleCol(col.collection)} className="sr-only" />
                <div className={`size-4 rounded flex-shrink-0 flex items-center justify-center ${selected.has(col.collection) ? "bg-[#7C68E1]" : "border border-white/20 bg-transparent"}`}>
                  {selected.has(col.collection) && <CheckCircle className="size-3.5 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{col.label}</p>
                  <p className="text-[10px] text-white/30">{col.count} dokumen</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Export */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.1)]">
              <Download className="size-4 text-[#73D1AD]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Export Backup</h2>
              <p className="text-xs text-white/40">Download data sebagai file backup</p>
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-white/50">Format</label>
            <div className="flex gap-2">
              {["zip", "json"].map((fmt) => (
                <button key={fmt} onClick={() => setExportFormat(fmt)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${exportFormat === fmt ? "border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.12)] text-[#73D1AD]" : "border-white/10 text-white/50 hover:text-white"}`}>
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleExport} disabled={exportBusy || selected.size === 0} data-testid="btn-export-backup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.1)] py-2.5 text-sm font-semibold text-white hover:bg-[rgba(115,209,173,0.18)] disabled:opacity-50">
            {exportBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export {selected.size > 0 ? `(${selected.size} collection)` : ""}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.1)]">
              <Upload className="size-4 text-[#7C68E1]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Import / Restore</h2>
              <p className="text-xs text-white/40">Pulihkan data dari file backup</p>
            </div>
          </div>
          <div className="mb-3 space-y-2">
            {STRATEGY_OPTIONS.map((s) => (
              <label key={s.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${importStrategy === s.value ? "border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.08)]" : "border-white/8 hover:bg-white/[0.02]"}`}>
                <input type="radio" name="strategy" value={s.value} checked={importStrategy === s.value} onChange={() => setImportStrategy(s.value)} className="mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-white">{s.label}</p>
                  <p className="text-[11px] text-white/35">{s.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mb-3">
            <input ref={fileRef} type="file" accept=".json,.zip" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm text-white/70 hover:bg-white/[0.05]">
              <FileArchive className="size-4" />
              {importFile ? importFile.name : "Pilih File (.json atau .zip)"}
            </button>
          </div>
          <button onClick={handleImport} disabled={importBusy || !importFile} data-testid="btn-import-backup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.1)] py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.18)] disabled:opacity-50">
            {importBusy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import / Restore
          </button>
          {importResult && (
            <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-white/60 space-y-1">
              <p className="font-semibold text-[#73D1AD]">Hasil Import:</p>
              <p>✓ Inserted: <span className="text-white">{importResult.total_inserted}</span></p>
              <p>✓ Updated: <span className="text-white">{importResult.total_updated}</span></p>
              <p>− Skipped: <span className="text-white">{importResult.total_skipped}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Dedup */}
      <div className="mt-6 rounded-2xl border border-[rgba(255,150,100,0.2)] bg-[rgba(255,150,100,0.04)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl border border-[rgba(255,150,100,0.3)] bg-[rgba(255,150,100,0.1)]">
            <Trash2 className="size-4 text-[#ffb07a]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Hapus Data Duplikat</h2>
            <p className="text-xs text-white/40">Hapus entri CMS yang terduplikasi (contoh: akibat server restart). Menyimpan yang paling lama.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDedup} disabled={dedupBusy} data-testid="btn-dedup"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,150,100,0.4)] bg-[rgba(255,150,100,0.1)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(255,150,100,0.18)] disabled:opacity-50">
            {dedupBusy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Jalankan Dedup ({selected.size > 0 ? `${selected.size} collection` : "semua"})
          </button>
          <p className="text-xs text-white/30">Hanya menghapus duplikat pada collection yang memiliki key unik (slug/name/key)</p>
        </div>
        {dedupResult && (
          <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs space-y-1">
            {Object.entries(dedupResult).map(([col, res]) => (
              <p key={col} className="text-white/60">
                <span className="text-white/80">{col}:</span> {res?.skipped ? <span className="text-white/30">skipped ({res.reason})</span> : <span className="text-[#73D1AD]">{res.removed_duplicates} duplikat dihapus</span>}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
