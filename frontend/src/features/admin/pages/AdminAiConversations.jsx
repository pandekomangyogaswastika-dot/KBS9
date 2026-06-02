import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquare, Bot, User, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { api, useFetch } from "@/lib/apiClient";

const SURFACE_COLOR = {
  public: { bg: "rgba(78,203,175,0.12)", color: "#4ECBAF", label: "Publik" },
  portal: { bg: "rgba(124,104,225,0.12)", color: "#7C68E1", label: "Portal" },
};

export default function AdminAiConversations() {
  const { t } = useTranslation();
  const [surface, setSurface] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [convDetail, setConvDetail] = useState({});
  const [loadingDetail, setLoadingDetail] = useState({});

  const { data: conversations, loading, error, reload } = useFetch(
    surface ? `/ai/conversations?surface=${surface}` : "/ai/conversations",
    []
  );

  const loadDetail = useCallback(async (id) => {
    if (convDetail[id]) { setExpanded(expanded === id ? null : id); return; }
    setLoadingDetail((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.get(`/ai/conversations/${id}`);
      setConvDetail((prev) => ({ ...prev, [id]: res.data?.data }));
      setExpanded(id);
    } catch { /* ignore */ }
    finally { setLoadingDetail((prev) => ({ ...prev, [id]: false })); }
  }, [convDetail, expanded]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;

  const convList = conversations || [];

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Log Percakapan AI</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{convList.length} percakapan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSurface("")} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ !surface ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-[color:var(--kti-text-dim)] hover:text-white" }`}>Semua</button>
          <button onClick={() => setSurface("public")} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ surface === "public" ? "border-[rgba(78,203,175,0.4)] bg-[rgba(78,203,175,0.15)] text-[#4ECBAF]" : "border-white/10 text-[color:var(--kti-text-dim)] hover:text-white" }`}>Publik</button>
          <button onClick={() => setSurface("portal")} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ surface === "portal" ? "border-[rgba(124,104,225,0.4)] bg-[rgba(124,104,225,0.15)] text-[#cfc4ff]" : "border-white/10 text-[color:var(--kti-text-dim)] hover:text-white" }`}>Portal</button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="size-4 text-red-400" /><p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {convList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] py-20">
          <MessageSquare className="size-12" style={{ color: "var(--kti-text-faint)" }} />
          <p className="text-sm text-[color:var(--kti-text-dim)]">Belum ada log percakapan AI.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {convList.map((conv) => {
            const sc = SURFACE_COLOR[conv.surface] || SURFACE_COLOR.public;
            const isOpen = expanded === conv.id;
            const detail = convDetail[conv.id];
            return (
              <div key={conv.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
                <button
                  onClick={() => loadDetail(conv.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/8">
                    <Bot className="size-4" style={{ color: sc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      {conv.user_name && <span className="text-xs text-white">{conv.user_name}</span>}
                      <span className="font-mono-kti text-[10px] text-[color:var(--kti-text-faint)]">{conv.session_id?.slice(0,8)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[color:var(--kti-text-dim)]">{conv.last_user_msg || "(kosong)"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[color:var(--kti-text-faint)]">{fmtDate(conv.updated_at)}</p>
                    <p className="text-[11px] text-[color:var(--kti-text-faint)]">{conv.message_count} pesan</p>
                  </div>
                  <div className="text-[color:var(--kti-text-dim)]">
                    {loadingDetail[conv.id] ? <Loader2 className="size-4 animate-spin" /> : isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>

                {isOpen && detail && (
                  <div className="border-t border-white/8 p-5 space-y-3">
                    {detail.user_email && (
                      <p className="text-xs text-[color:var(--kti-text-faint)]">Email: {detail.user_email}</p>
                    )}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(detail.messages || []).map((m, i) => (
                        <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          {m.role === "assistant" && (
                            <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-[rgba(78,203,175,0.15)]">
                              <Bot className="size-3.5" style={{ color: "#4ECBAF" }} />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                            m.role === "user"
                              ? "bg-white/[0.06] border border-white/10 text-[color:var(--kti-text-dim)]"
                              : "bg-[rgba(78,203,175,0.08)] border border-[rgba(78,203,175,0.2)] text-white/70"
                          }`}>{m.content}</div>
                          {m.role === "user" && (
                            <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/8">
                              <User className="size-3.5 text-white/50" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
