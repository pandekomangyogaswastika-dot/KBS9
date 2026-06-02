import { api } from "@/lib/apiClient";

export async function uploadFiles(files, folderId) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("files", f));
  if (folderId) fd.append("folder_id", folderId);
  const res = await api.post("/admin/media/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data || [];
}

export function formatBytes(b) {
  if (b === null || b === undefined) return "\u2014";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function absUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}
