import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HexMark } from "@/components/decor";

// Preloader 'launch sequence'. Tampil sekali per sesi.
export default function Preloader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem("kti_launched"));
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!show) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 400 : 1500;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(100, Math.round(((t - start) / dur) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem("kti_launched", "1");
        setTimeout(() => setShow(false), 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] grid place-items-center"
          style={{ background: "#05060A" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          data-testid="preloader"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
              <HexMark size={56} />
            </motion.div>
            <div className="font-mono-kti text-xs uppercase tracking-[0.4em]" style={{ color: "#73D1AD" }}>
              Initiating Launch Sequence
            </div>
            <div className="h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
              <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#4F3E97,#7C68E1,#73D1AD)", transition: "width 0.1s linear" }} />
            </div>
            <div className="font-mono-kti text-xs" style={{ color: "#9AA0B5" }}>{pct}%</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
