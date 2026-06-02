import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Send, RefreshCw, Loader2 } from "lucide-react";

const CIPHER = "ABCDEF0123456789!@#$%&*<>/\\|=+";
const randCipher = (len) =>
  Array.from({ length: Math.max(8, Math.min(len, 42)) }, () => CIPHER[Math.floor(Math.random() * CIPHER.length)]).join("");

// Interactive secure-transmission demo: encrypt -> transmit -> deliver.
export const SecureTransmissionDemo = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | encrypting | transmitting | delivered
  const [cipher, setCipher] = useState("");
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.forEach((id) => clearInterval(id));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const run = () => {
    if (!input.trim() || status === "encrypting" || status === "transmitting") return;
    clearTimers();
    setStatus("encrypting");
    const scramble = setInterval(() => setCipher(randCipher(input.length)), 70);
    timers.current.push(scramble);
    const t1 = setTimeout(() => {
      clearInterval(scramble);
      setStatus("transmitting");
      const t2 = setTimeout(() => setStatus("delivered"), 1300);
      timers.current.push(t2);
    }, 1000);
    timers.current.push(t1);
  };

  const reset = () => {
    clearTimers();
    setStatus("idle");
    setCipher("");
    setInput("");
  };

  const statusText = {
    idle: t("secure.idle"),
    encrypting: t("secure.encrypting"),
    transmitting: t("secure.transmitting"),
    delivered: t("secure.delivered"),
  }[status];

  const busy = status === "encrypting" || status === "transmitting";

  return (
    <div
      className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:p-8"
      data-testid="secure-transmission-demo"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-hud text-[11px] uppercase tracking-[0.22em] text-[color:var(--kti-text-dim)]">
          <Lock className="size-4" style={{ color: "var(--kti-teal)" }} /> AES-256 · TLS 1.3
        </span>
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: status === "delivered" ? "var(--kti-teal)" : "var(--kti-text-dim)" }}
        >
          <span
            className={`size-1.5 rounded-full ${busy ? "animate-pulse" : ""}`}
            style={{ background: status === "delivered" ? "var(--kti-teal)" : "var(--kti-indigo)" }}
          />
          {status.toUpperCase()}
        </span>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        maxLength={140}
        disabled={busy}
        placeholder={t("secure.placeholder")}
        data-testid="secure-input"
        className="kti-focus mt-5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none disabled:opacity-60"
      />

      {/* channel visualization */}
      <div className="relative mt-5 h-16 overflow-hidden rounded-xl border border-white/[0.08] bg-[#06070f]">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        {status === "idle" && (
          <div className="flex h-full items-center justify-center font-hud text-[11px] uppercase tracking-[0.2em] text-[color:var(--kti-text-faint)]">
            {t("secure.idle")}
          </div>
        )}
        {status === "encrypting" && (
          <div className="flex h-full items-center justify-center px-4">
            <span className="truncate font-hud text-sm tracking-[0.18em]" style={{ color: "var(--kti-teal)" }}>
              {cipher || randCipher(input.length)}
            </span>
          </div>
        )}
        {status === "transmitting" && (
          <div className="relative flex h-full items-center">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full"
                style={{ background: "var(--kti-teal)", boxShadow: "0 0 10px var(--kti-teal)" }}
                initial={{ left: "6%", opacity: 0 }}
                animate={{ left: "94%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1, delay: i * 0.22, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
        {status === "delivered" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full items-center justify-center gap-2"
            style={{ color: "var(--kti-teal)" }}
          >
            <ShieldCheck className="size-5" />
            <span className="text-sm font-semibold">{t("secure.delivered")}</span>
          </motion.div>
        )}
      </div>

      <p className="mt-3 text-xs text-[color:var(--kti-text-dim)]">{statusText}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={busy || !input.trim()}
          data-testid="secure-encrypt-button"
          className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.18)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-colors hover:bg-[rgba(124,104,225,0.28)] disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t("secure.encrypt")}
        </button>
        <button
          onClick={reset}
          data-testid="secure-reset-button"
          className="kti-focus inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium hover:bg-white/10"
        >
          <RefreshCw className="size-4" /> {t("secure.reset")}
        </button>
      </div>

      <p className="mt-4 font-hud text-[10px] uppercase tracking-[0.18em] text-[color:var(--kti-text-faint)]">
        {t("secure.note")}
      </p>
    </div>
  );
};
