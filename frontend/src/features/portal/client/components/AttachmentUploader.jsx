import { useState } from "react";
import { Upload, FileText, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".docx"];
const MAX_SIZE_MB = 10;

export const AttachmentUploader = ({
  sessionId,
  questionId,
  attachments = [],
  locked = false,
  onUploaded,
  onDeleted,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Format tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(", ")}`);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ukuran file melebihi ${MAX_SIZE_MB} MB`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question_id", questionId);

      const res = await api.post(
        `/assessment/sessions/${sessionId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("File berhasil diunggah");
      onUploaded?.(res.data?.data);
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || "Gagal mengunggah file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (attachmentId) => {
    setDeleting(attachmentId);
    try {
      await api.delete(`/assessment/sessions/${sessionId}/attachments/${attachmentId}`);
      toast.success("File dihapus");
      onDeleted?.(attachmentId);
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || "Gagal menghapus file");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-4 space-y-2" data-testid={`attachments-${questionId}`}>
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
              data-testid={`attachment-item-${att.id}`}
            >
              <FileText className="size-4 shrink-0 text-[color:var(--kti-teal)]" />
              <span className="flex-1 truncate text-xs text-white">{att.filename}</span>
              <span className="text-[10px] text-[color:var(--kti-text-faint)]">
                {Math.round(att.size / 1024)} KB
              </span>
              {!locked && (
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  disabled={deleting === att.id}
                  data-testid={`delete-attachment-${att.id}`}
                  className="grid size-7 place-items-center rounded-lg text-[color:var(--kti-text-dim)] transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                >
                  {deleting === att.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!locked && attachments.length < 5 && (
        <label
          data-testid={`upload-attachment-${questionId}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-3 py-2 text-xs text-[color:var(--kti-text-dim)] transition-colors hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Mengunggah...</span>
            </>
          ) : (
            <>
              <Upload className="size-4" />
              <span>Lampirkan file (maks 5)</span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
            accept={ALLOWED_EXTENSIONS.join(",")}
          />
        </label>
      )}

      {attachments.length >= 5 && !locked && (
        <p className="text-xs text-[color:var(--kti-text-faint)] italic">
          Maksimal 5 file per pertanyaan
        </p>
      )}
    </div>
  );
};
