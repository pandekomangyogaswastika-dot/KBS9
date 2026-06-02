import { api } from "@/lib/apiClient";

export const OTHER = "__other__";

export async function loadSession(token) {
  const res = await api.get(`/assessment/sessions/${token}`);
  return res.data?.data;
}

export async function saveAnswers(token, answers) {
  const res = await api.patch(`/assessment/sessions/${token}/answers`, { answers });
  return res.data?.data;
}

export async function submitSession(token) {
  const res = await api.post(`/assessment/sessions/${token}/submit`);
  return res.data?.data;
}

export async function uploadAttachment(token, questionId, file) {
  const fd = new FormData();
  fd.append("question_id", questionId);
  fd.append("file", file);
  const res = await api.post(`/assessment/sessions/${token}/attachments`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
}

export async function deleteAttachment(token, attId) {
  await api.delete(`/assessment/sessions/${token}/attachments/${attId}`);
}

export function pdfUrl(token, locale) {
  return `${process.env.REACT_APP_BACKEND_URL}/api/assessment/sessions/${token}/export.pdf?locale=${locale}`;
}

export function loc(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return (lang && lang.startsWith("en")) ? (obj.en || obj.id) : (obj.id || obj.en);
}
