// HUD pill tag with a leading status dot. Mono/techno label.
export const DotBadge = ({ children, className = "", tone = "teal", ...rest }) => {
  const dotColor = tone === "indigo" ? "var(--kti-indigo)" : "var(--kti-teal)";
  return (
    <span className={`kti-pill ${className}`} {...rest}>
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
};
