import { useEffect, useRef } from "react";
import { createSpaceScene } from "@/lib/spaceScene";

// Wrapper React tipis untuk scene Three.js imperatif.
// Hanya merender <canvas> DOM biasa (aman dari injeksi atribut visual-edits).
export default function ImmersiveScene({ progressRef, lowPower = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let scene;
    try {
      scene = createSpaceScene(canvas, { lowPower });
    } catch (err) {
      // Jika WebGL gagal, biarkan fallback background gradient yang tampil.
      return undefined;
    }

    const resize = () => scene.setSize(window.innerWidth, window.innerHeight);
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
  }, [lowPower, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="poc-canvas"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
