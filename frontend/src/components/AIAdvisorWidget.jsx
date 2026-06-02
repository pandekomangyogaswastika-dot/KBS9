import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Send, X, Loader2, ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";

// Floating AI Solution Advisor (Claude). Grounded with KTI CMS content.
const QUICK_QUESTIONS_ID = [
  "Layanan apa saja yang KTI tawarkan?",
  "Bagaimana proses assessment solusi IT?",
  "Teknologi apa yang KTI gunakan?",
  "Berapa lama implementasi proyek?",
];
const QUICK_QUESTIONS_EN = [
  "What services does KTI offer?",
  "How does the IT assessment process work?",
  "What technologies does KTI use?",
  "How long does a project take?",
];

export default function AIAdvisorWidget() {
  const { t, i18n } = useTranslation();
  const isEN = i18n.language?.startsWith("en");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: t("ai.greeting") }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ctas, setCtas] = useState({ assessment: false, contact: false });
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollDown = () => setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, 50);

  const send = async (text_) => {
    const text = (text_ ?? input).trim();
    if (!text || loading) return;
    const history = messages.filter((m) => m.role !== "system").slice(-8);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setCtas({ assessment: false, contact: false });
    scrollDown();
    try {
      const res = await api.post("/ai/advisor", { session_id: sessionRef.current, message: text, history, locale: isEN ? "en" : "id" });
      const d = res.data?.data;
      sessionRef.current = d?.session_id || sessionRef.current;
      setMessages((m) => [...m, { role: "assistant", content: d?.reply || t("ai.error") }]);
      setCtas({ assessment: !!d?.cta_assessment, contact: !!d?.cta_contact });
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("ai.error") }]);
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const quickQs = isEN ? QUICK_QUESTIONS_EN : QUICK_QUESTIONS_ID;
  const showQuickQs = messages.length <= 1;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="ai-advisor-toggle"
        aria-label={t("ai.open")}
        className="kti-focus fixed bottom-5 left-5 z-[150] grid h-14 w-14 place-items-center rounded-full transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg,#73D1AD,#4aa6c9)", boxShadow: "0 10px 30px rgba(115,209,173,0.35)" }}
      >
        {open ? <X className="h-6 w-6 text-[#05121a]" /> : <Sparkles className="h-6 w-6 text-[#05121a]" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 left-5 z-[150] flex w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10"
            style={{ background: "#0B0D17", height: "min(75vh, 600px)" }}
            data-testid="ai-advisor-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 p-4" style={{ background: "linear-gradient(135deg, rgba(115,209,173,0.16), transparent)" }}>
              <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "#73D1AD" }}>
                <Sparkles className="h-5 w-5 text-[#05121a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t("ai.title")}</p>
                <p className="text-xs kti-text-dim">{t("ai.subtitle")}</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-lg hover:bg-white/8" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" data-testid="ai-advisor-messages">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={m.role === "user"
                      ? { background: "#1c2540", color: "#E8EAF2" }
                      : { background: "rgba(115,209,173,0.12)", color: "#E8EAF2", border: "1px solid rgba(115,209,173,0.25)" }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Quick questions when new session */}
              {showQuickQs && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-white/40">{isEN ? "Quick questions:" : "Pertanyaan cepat:"}</p>
                  {quickQs.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 kti-text-dim text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#73D1AD" }} />{t("ai.thinking")}
                </div>
              )}

              {/* CTA Buttons */}
              {(ctas.assessment || ctas.contact) && (
                <div className="flex flex-col gap-2">
                  {ctas.assessment && (
                    <Link
                      to="/contact"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.12)] px-3 py-2.5 text-sm font-medium text-[#73D1AD] hover:bg-[rgba(115,209,173,0.22)] transition-colors"
                    >
                      <span className="flex items-center gap-2"><ClipboardList className="size-4" /> {isEN ? "Start Discovery Assessment" : "Mulai Discovery Assessment"}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                  {ctas.contact && (
                    <Link
                      to="/contact"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.12)] px-3 py-2.5 text-sm font-medium text-[#cfc4ff] hover:bg-[rgba(124,104,225,0.22)] transition-colors"
                    >
                      <span>{isEN ? "Talk to Our Team" : "Hubungi Tim KTI"}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  placeholder={t("ai.placeholder")}
                  data-testid="ai-advisor-input"
                  className="kti-focus max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
                />
                <button onClick={() => send()} disabled={loading} data-testid="ai-advisor-send" className="kti-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl disabled:opacity-50 transition-opacity" style={{ background: "#73D1AD" }} aria-label={t("ai.send")}>
                  <Send className="h-4 w-4 text-[#05121a]" />
                </button>
              </div>
              <p className="mt-2 text-[11px] kti-text-dim">{t("ai.disclaimer")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
