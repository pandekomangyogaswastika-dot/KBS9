import axios from "axios";
import { API } from "@/services/apiClient";

// Re-export API base untuk komponen lain (mis. AttachmentUploader untuk build download URL).
export const API_BASE = API;

// Discovery API endpoints — semua PUBLIC (token via URL path).
export const discoveryApi = {
  fetchQuestions: async () => {
    const { data } = await axios.get(`${API}/discovery/questions`);
    return data;
  },
  createSession: async (payload) => {
    const { data } = await axios.post(`${API}/discovery/sessions`, payload);
    return data;
  },
  fetchSession: async (sessionId) => {
    const { data } = await axios.get(`${API}/discovery/sessions/${sessionId}`);
    return data;
  },
  saveAnswers: async (sessionId, answers) => {
    const { data } = await axios.patch(`${API}/discovery/sessions/${sessionId}/answers`, { answers });
    return data;
  },
  submitSession: async (sessionId) => {
    const { data } = await axios.post(`${API}/discovery/sessions/${sessionId}/submit`);
    return data;
  },
  acknowledgeSession: async (sessionId) => {
    const { data } = await axios.post(`${API}/discovery/sessions/${sessionId}/acknowledge`);
    return data;
  },
  fetchStats: async () => {
    const { data } = await axios.get(`${API}/discovery/stats`);
    return data;
  },
  listSessions: async () => {
    const { data } = await axios.get(`${API}/discovery/sessions`);
    return data;
  },
  deleteSession: async (sessionId) => {
    await axios.delete(`${API}/discovery/sessions/${sessionId}`);
  },
  exportPdfUrl: (sessionId) => `${API}/discovery/sessions/${sessionId}/export.pdf`,

  // Attachments
  uploadAttachment: async (sessionId, questionId, file) => {
    const fd = new FormData();
    fd.append("question_id", questionId);
    fd.append("file", file);
    const { data } = await axios.post(
      `${API}/discovery/sessions/${sessionId}/attachments`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
  deleteAttachment: async (sessionId, attachmentId) => {
    await axios.delete(`${API}/discovery/sessions/${sessionId}/attachments/${attachmentId}`);
  },
};
