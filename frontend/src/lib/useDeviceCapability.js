import { useEffect, useState } from "react";

// Deteksi kapabilitas device untuk fallback (KTI_11).
// reducedMotion -> sajikan statis (tanpa WebGL berat).
// lowPower -> kurangi partikel/efek.
export function useDeviceCapability() {
  const [caps, setCaps] = useState({ reducedMotion: false, lowPower: false, ready: false });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compute = () => {
      const cores = navigator.hardwareConcurrency || 8;
      const lowPower = cores <= 4 || window.innerWidth < 768;
      setCaps({ reducedMotion: mq.matches, lowPower, ready: true });
    };
    compute();
    mq.addEventListener?.("change", compute);
    window.addEventListener("resize", compute);
    return () => {
      mq.removeEventListener?.("change", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return caps;
}
