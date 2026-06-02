import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Upload, X, Loader2, FileText, ImageIcon, FileSpreadsheet, FileType2, Download } from "lucide-react";
import { discoveryApi, API_BASE } from "../api";
import { toast } from "@/hooks/use-toast";

const MAX_FILE_MB = 10;
const ALLOWED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".docx"];
const ALLOWED_ACCEPT = ".pdf,.png,.jpg,.jpeg,.xlsx,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const iconFor = (ext = "") => {
  const e = ext.toLowerCase();
  if (e === ".pdf") return <FileType2 size={14} className="text-discovery-danger" />;
  if (e === ".png" || e === ".jpg" || e === ".jpeg") return <ImageIcon size={14} className="text-discovery-accent" />;
  if (e === ".xlsx") return <FileSpreadsheet size={14} className="text-discovery-success" />;
  if (e === ".docx") return <FileText size={14} className="text-discovery-primary" />;
  return <FileText size={14} className="text-discovery-muted" />;
};

export const AttachmentUploader = ({
  sessionId,
  questionId,
  attachments = [],
  onUploaded,
  onDeleted,
  locked = false,
  maxFiles = 5,
}) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const reachedMax = attachments.length >= maxFiles;

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset agar pilih file sama bisa trigger lagi
    if (!file) return;
    // Client-side validation
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: `Maksimum ${MAX_FILE_MB} MB. File Anda ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        variant: "destructive",
      });
      return;
    }
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      toast({
        title: "Format tidak diizinkan",
        description: `Format ${ext} tidak diterima. Yang diizinkan: ${ALLOWED_EXT.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const att = await discoveryApi.uploadAttachment(sessionId, questionId, file);
      toast({ title: "Upload berhasil", description: file.name });
      onUploaded?.(att);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Gagal upload file.";
      toast({ title: "Upload gagal", description: detail, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attId) => {
    setDeletingId(attId);
    try {
      await discoveryApi.deleteAttachment(sessionId, attId);
      onDeleted?.(attId);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Gagal hapus file.";
      toast({ title: "Gagal hapus", description: detail, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-dashed border-discovery-border bg-discovery-bg/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-discovery-muted">
          <Paperclip size={13} className="text-discovery-accent" />
          Lampiran ({attachments.length}/{maxFiles})
          <span className="font-normal italic text-discovery-muted">
            — PDF, PNG, JPG, XLSX, DOCX (max {MAX_FILE_MB} MB)
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid={`attachment-upload-${questionId}`}
          disabled={locked || uploading || reachedMax}
          onClick={handlePick}
          className="h-7 border-discovery-accent/40 text-xs text-discovery-accent hover:bg-discovery-accent/10 disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 size={11} className="mr-1 animate-spin" /> Uploading...</>
          ) : (
            <><Upload size={11} className="mr-1" /> Tambah File</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_ACCEPT}
          className="hidden"
          onChange={handleFile}
          data-testid={`attachment-input-${questionId}`}
        />
      </div>

      {attachments.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((att) => (
            <li
              key={att.id}
              data-testid={`attachment-${att.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-discovery-border bg-white px-3 py-2 text-xs"
            >
              <div className="flex flex-1 items-center gap-2 truncate">
                {iconFor(att.extension)}
                <span className="truncate font-medium text-discovery-text">{att.original_name}</span>
                <Badge variant="outline" className="border-discovery-border text-[10px] font-normal text-discovery-muted">
                  {formatSize(att.size_bytes)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`${API_BASE}/discovery/sessions/${sessionId}/attachments/${att.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`attachment-${att.id}-download`}
                  className="rounded p-1 text-discovery-muted transition-colors hover:bg-discovery-soft hover:text-discovery-primary"
                  title="Download"
                >
                  <Download size={12} />
                </a>
                {!locked ? (
                  <button
                    type="button"
                    data-testid={`attachment-${att.id}-delete`}
                    disabled={deletingId === att.id}
                    onClick={() => handleDelete(att.id)}
                    className="rounded p-1 text-discovery-muted transition-colors hover:bg-discovery-danger/10 hover:text-discovery-danger disabled:opacity-50"
                    title="Hapus"
                  >
                    {deletingId === att.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <X size={12} />
                    )}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] italic text-discovery-muted">
          Belum ada lampiran. Klik "Tambah File" jika ingin melampirkan dokumen pendukung (org chart, sample data, dll).
        </p>
      )}
    </div>
  );
};
