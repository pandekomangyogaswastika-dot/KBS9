import { api } from "@/lib/apiClient";

export const OTHER = "__other__";

export async function loadSession(token) {
  // Public token-based endpoint: GET /api/assessment/{token}
  const res = await api.get(`/assessment/${token}`);
  const data = res.data?.data;
  if (!data) return null;
  // Public endpoint returns flat session with template/answers embedded
  // Normalize answers list → map keyed by question_id
  const answersArr = Array.isArray(data.answers) ? data.answers : [];
  const answersMap = {};
  for (const a of answersArr) {
    if (a?.question_id) answersMap[a.question_id] = a;
  }
  // Strip embedded fields from session copy
  const session = Object.fromEntries(
    Object.entries(data).filter(([k]) => !["template", "answers", "progress"].includes(k))
  );
  return {
    session,
    template: data.template,
    answers: answersMap,
    progress: data.progress,
    attachments: {},
  };
}

export async function saveAnswers(token, answers) {
  // Public token-based: POST /api/assessment/{token}/answers
  // answers: [{question_id, value, skipped?, other_text?, note?}]
  const res = await api.post(`/assessment/${token}/answers`, answers);
  return res.data?.data;
}

export async function submitSession(token) {
  // Public token-based: POST /api/assessment/{token}/submit
  const res = await api.post(`/assessment/${token}/submit`);
  return res.data?.data;
}

export async function uploadAttachment(token, questionId, file) {
  const fd = new FormData();
  fd.append("question_id", questionId);
  fd.append("file", file);
  const res = await api.post(`/assessment/${token}/attachments`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
}

export async function deleteAttachment(token, attId) {
  await api.delete(`/assessment/${token}/attachments/${attId}`);
}

export function pdfUrl(token, locale) {
  // Public PDF export: GET /api/assessment/{token}/export?locale={locale}
  return `${process.env.REACT_APP_BACKEND_URL}/api/assessment/${token}/export?locale=${locale}`;
}

export function loc(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return (lang && lang.startsWith("en")) ? (obj.en || obj.id) : (obj.id || obj.en);
}
