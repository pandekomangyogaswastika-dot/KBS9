import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, Bot, User, FolderKanban, CreditCard, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

const QUICK_QUESTIONS = [
  "Apa status terbaru proyek saya?",
  "Ada berapa invoice yang belum dibayar?",
  "Milestone apa yang sedang berjalan?",
  "Apa langkah selanjutnya untuk proyek saya?",
];

export default function ClientAssistant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Halo ${user?.name || ""}! 👋 Saya adalah asisten AI KTI yang telah mengetahui konteks proyek Anda. Saya siap membantu Anda memahami status proyek, milestone, invoice, dan pertanyaan terkait layanan KTI.` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `portal-${Date.now()}`);
  const [ctas, setCtas] = useState({ assessment: false, contact: false });
  const [showQuickQs, setShowQuickQs] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text_) => {
    const text = (text_ ?? input).trim();
    if (!text || loading) return;
    setShowQuickQs(false);
    setInput("");
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setCtas({ assessment: false, contact: false });
    try {
      const res = await api.post("/ai/portal", { session_id: sessionId, message: text, history });
      const d = res.data?.data;
      const reply = d?.reply || "...";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setCtas({ assessment: !!d?.cta_assessment, contact: !!d?.cta_contact });
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: t("ai.error") }]);
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{t("portal.assistant")}</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{t("ai.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(78,203,175,0.3)] bg-[rgba(78,203,175,0.1)] px-3 py-1.5">
          <Sparkles className="size-3.5" style={{ color: "var(--kti-teal)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--kti-teal)" }}>Konteks proyek aktif</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/15 bg-[rgba(78,203,175,0.18)]">
                  <Bot className="size-4" style={{ color: "var(--kti-teal)" }} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[rgba(124,104,225,0.22)] border border-[rgba(124,104,225,0.35)] text-white rounded-br-sm"
                    : "bg-white/[0.06] border border-white/10 text-[color:var(--kti-text-dim)] rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/8">
                  <User className="size-4 text-white/60" />
                </div>
              )}
            </div>
          ))}

          {/* Quick questions on first load */}
          {showQuickQs && messages.length <= 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-white/40 pl-1">Pertanyaan cepat:</p>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/15 bg-[rgba(78,203,175,0.18)]">
                <Bot className="size-4" style={{ color: "var(--kti-teal)" }} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <Loader2 className="size-4 animate-spin" style={{ color: "var(--kti-indigo)" }} />
                <span className="text-sm text-[color:var(--kti-text-dim)]">{t("ai.thinking")}</span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          {(ctas.assessment || ctas.contact) && (
            <div className="flex flex-col gap-2 pl-11">
              {ctas.assessment && (
                <Link to="/portal/projects" className="flex items-center gap-2 rounded-xl border border-[rgba(78,203,175,0.3)] bg-[rgba(78,203,175,0.1)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(78,203,175,0.18)]" style={{ color: "var(--kti-teal)" }}>
                  <FolderKanban className="size-4" /> Lihat Detail Proyek <ArrowRight className="ml-auto size-4" />
                </Link>
              )}
              {ctas.contact && (
                <Link to="/portal/messages" className="flex items-center gap-2 rounded-xl border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.1)] px-4 py-2.5 text-sm font-medium text-[#cfc4ff] transition-colors hover:bg-[rgba(124,104,225,0.18)]">
                  <CheckCircle className="size-4" /> Diskusi dengan Tim <ArrowRight className="ml-auto size-4" />
                </Link>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-3 border-t border-white/8 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("ai.placeholder")}
            disabled={loading}
            className="kti-focus flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] text-white hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-50 transition-colors"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>

      <p className="mt-3 text-center text-[11px] text-[color:var(--kti-text-faint)]">{t("ai.disclaimer")}</p>
    </div>
  );
}
