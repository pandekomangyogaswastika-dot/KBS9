import { useEffect, useRef } from "react";
import { createSpaceScene } from "@/lib/spaceScene";

// Imperative Three.js "Kubus Core" (hex crystal + starfield). NOT React Three Fiber
// (TD-007). Sizes to its parent element. progressRef.current (0..1) drives scroll motion.
export const KubusCore = ({
  progressRef,
  lowPower = false,
  transparent = true,
  className = "",
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let scene;
    try {
      scene = createSpaceScene(canvas, { lowPower, transparent });
    } catch (err) {
      return undefined;
    }
    const parent = canvas.parentElement;
    const resize = () => {
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      scene.setSize(Math.max(1, w), Math.max(1, h));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf;
    const loop = () => {
      scene.setProgress(progressRef?.current ?? 0);
      scene.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.dispose();
    };
  }, [lowPower, transparent, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
};
