import { useEffect, useRef } from "react";

// Custom cursor: dot + ring. Hanya di perangkat pointer-fine & bukan reduced-motion.
export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return undefined;

    document.body.classList.add("kti-cursor-active");
    let mx = -100, my = -100, rx = -100, ry = -100, raf;

    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
    };
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e) => { if (e.target.closest("a, button, [data-cursor]")) ring.current?.classList.add("is-hover"); };
    const out = (e) => { if (e.target.closest("a, button, [data-cursor]")) ring.current?.classList.remove("is-hover"); };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("kti-cursor-active");
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="kti-cursor-dot" aria-hidden="true" />
      <div ref={ring} className="kti-cursor-ring" aria-hidden="true" />
    </>
  );
}
