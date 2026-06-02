import { useEffect, useRef, useState } from "react";
import { heavyMotionDisabled } from "@/lib/gsap";

// Full-bleed cinematic media background (video on desktop, poster image as
// fallback on mobile / reduced-motion) + legibility overlay + optional aurora.
export const MediaSection = ({
  id,
  media,
  poster,
  children,
  className = "",
  minH = "min-h-[70vh]",
  overlay = "top",
  aurora = false,
  contentClassName = "",
  "data-testid": testId,
}) => {
  const [useVideo, setUseVideo] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setUseVideo(!!media && !heavyMotionDisabled());
  }, [media]);

  return (
    <section
      id={id}
      data-testid={testId}
      className={`relative ${minH} w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0">
        {useVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={media}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          poster && (
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        )}
        <div
          className={`absolute inset-0 ${overlay === "side" ? "kti-overlay-side" : "kti-overlay-top"}`}
        />
        {aurora && <div className="absolute inset-0 kti-aurora opacity-70" aria-hidden="true" />}
      </div>
      <div className={`relative z-10 kti-container flex w-full flex-col justify-center ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
};
