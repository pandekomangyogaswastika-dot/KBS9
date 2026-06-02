// Decorative HUD connector line + endpoint dot. Purely decorative (no pointer events).
export const AnnotationLine = ({
  className = "",
  width = 72,
  vertical = false,
  dot = "end",
}) => {
  const dotEl = (
    <span
      className="absolute size-1.5 rounded-full"
      style={{
        background: "var(--kti-teal)",
        boxShadow: "0 0 0 3px rgba(115,209,173,0.12)",
        ...(vertical
          ? { left: "50%", marginLeft: -3, [dot === "end" ? "bottom" : "top"]: -3 }
          : { top: "50%", marginTop: -3, [dot === "end" ? "right" : "left"]: -3 }),
      }}
    />
  );
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={
        vertical
          ? { width: 1, height: width, background: "rgba(255,255,255,0.14)" }
          : { height: 1, width, background: "rgba(255,255,255,0.14)" }
      }
    >
      {dotEl}
    </span>
  );
};
