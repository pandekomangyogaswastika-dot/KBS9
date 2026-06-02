import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Loader2, Plus, X } from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";

const ROLE_COLOR = { admin: "#7C68E1", staff: "#7C68E1", client: "#4ECBAF" };

export default function StaffMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newThread, setNewThread] = useState({ client_id:"", project_id:"", subject:"" });
  const [creatingThread, setCreatingThread] = useState(false);
  const bottomRef = useRef(null);

  const loadThreads = useCallback(async () => {
    try {
      const res = await api.get("/threads");
      const list = res.data?.data || [];
      setThreads(list);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (tid) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/threads/${tid}/messages`);
      setMessages(res.data?.data || []);
    } catch { /* ignore */ }
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    loadThreads();
    api.get("/admin/users").then((r) => setClients((r.data?.data || []).filter((u) => u.role === "client"))).catch(() => {});
    api.get("/projects").then((r) => setProjects(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedThread?.id) loadMessages(selectedThread.id);
  }, [selectedThread?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedThread?.id) return;
    const id = setInterval(() => loadMessages(selectedThread.id), 15000);
    return () => clearInterval(id);
  }, [selectedThread?.id, loadMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedThread || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    try {
      const res = await api.post(`/threads/${selectedThread.id}/messages`, { body });
      setMessages((prev) => [...prev, res.data?.data]);
    } catch { setInput(body); }
    finally { setSending(false); }
  };

  const createThread = async () => {
    if (!newThread.client_id) return;
    setCreatingThread(true);
    try {
      const res = await api.post("/threads", {
        client_id: newThread.client_id,
        project_id: newThread.project_id || null,
        subject: newThread.subject || "Diskusi Proyek",
      });
      const t = res.data?.data;
      setShowNewThread(false);
      setNewThread({ client_id:"", project_id:"", subject:"" });
      await loadThreads();
      setSelectedThread(t);
      await loadMessages(t.id);
    } catch (err) { }
    finally { setCreatingThread(false); }
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" }) + " · " + d.toLocaleDateString("id-ID", { day:"numeric", month:"short" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-white">Pesan & Komunikasi</h1>
        <button onClick={() => setShowNewThread(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-3 py-2 text-sm font-medium text-white hover:bg-[rgba(124,104,225,0.32)]">
          <Plus className="size-4" /> Percakapan Baru
        </button>
      </div>

      {showNewThread && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Mulai Percakapan Baru</h3>
            <button onClick={() => setShowNewThread(false)}><X className="size-4 text-[color:var(--kti-text-dim)]" /></button>
          </div>
          <select value={newThread.client_id} onChange={(e) => setNewThread((f) => ({...f, client_id: e.target.value}))} className="w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3 py-2 text-sm text-white">
            <option value="">— Pilih Klien —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
          </select>
          <select value={newThread.project_id} onChange={(e) => setNewThread((f) => ({...f, project_id: e.target.value}))} className="w-full rounded-xl border border-white/12 bg-[#0B0D17] px-3 py-2 text-sm text-white">
            <option value="">— Pilih Proyek (opsional) —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input value={newThread.subject} onChange={(e) => setNewThread((f) => ({...f, subject: e.target.value}))} placeholder="Subjek percakapan" className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white" />
          <div className="flex gap-2">
            <button onClick={createThread} disabled={!newThread.client_id || creatingThread} className="rounded-xl bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.45)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {creatingThread ? "Membuat..." : "Mulai"}
            </button>
            <button onClick={() => setShowNewThread(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[color:var(--kti-text-dim)]">Batal</button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-260px)] overflow-hidden rounded-2xl border border-white/8">
        {/* Thread List */}
        <div className="hidden w-72 shrink-0 flex-col border-r border-white/8 bg-white/[0.03] sm:flex" data-testid={PORTAL.threadList}>
          <div className="border-b border-white/8 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--kti-text-faint)]">Percakapan</p>
          </div>
          {loading ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 className="size-5 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>
          ) : threads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
              <MessageSquare className="size-8" style={{ color: "var(--kti-text-faint)" }} />
              <p className="text-xs text-[color:var(--kti-text-dim)]">Belum ada percakapan</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {threads.map((th) => (
                <button key={th.id} onClick={() => setSelectedThread(th)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-l-2 ${ selectedThread?.id === th.id ? "bg-white/[0.06]" : "border-transparent" }`}
                  style={selectedThread?.id === th.id ? { borderLeftColor: "var(--kti-teal)" } : {}}
                >
                  <p className="text-sm font-medium text-white line-clamp-1">{th.subject}</p>
                  {th.last_message && <p className="text-xs text-[color:var(--kti-text-dim)] line-clamp-1">{th.last_message}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-[color:var(--kti-text-dim)]">Pilih percakapan</p>
            </div>
          ) : (
            <>
              <div className="border-b border-white/8 px-4 py-3">
                <p className="font-medium text-white">{selectedThread.subject}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid={PORTAL.messageList}>
                {loadingMessages ? <div className="flex h-full items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>
                  : messages.length === 0 ? <div className="flex h-full items-center justify-center"><p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada pesan.</p></div>
                  : messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    const roleColor = ROLE_COLOR[m.sender?.role] || "#7C68E1";
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                          {!isMe && <span className="px-1 text-[11px] font-medium" style={{ color: roleColor }}>{m.sender?.name}</span>}
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${ isMe ? "bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.35)] text-white rounded-br-sm" : "bg-white/[0.06] border border-white/10 text-[color:var(--kti-text-dim)] rounded-bl-sm" }`}>{m.body}</div>
                          <span className="px-1 text-[10px] text-[color:var(--kti-text-faint)]">{fmt(m.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-white/8 px-4 py-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pesan..." data-testid={PORTAL.messageInput} className="kti-focus flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30" />
                <button type="submit" disabled={!input.trim() || sending} data-testid={PORTAL.messageSendBtn} className="kti-focus grid size-10 shrink-0 place-items-center rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-50">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
