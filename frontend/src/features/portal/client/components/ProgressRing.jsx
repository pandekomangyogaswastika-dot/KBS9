// Circular SVG progress ring — adapted from KN3 DiscoveryDashboard to KTI dark theme
export const ProgressRing = ({ percent = 0, size = 56, stroke = 5, testId }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const color = percent >= 100
    ? "#73D1AD"    // kti-teal
    : percent > 0
    ? "#7C68E1"    // kti-indigo
    : "rgba(255,255,255,0.1)";
  const trackColor = "rgba(255,255,255,0.08)";

  return (
    <div
      data-testid={testId}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color: percent >= 100 ? "#73D1AD" : percent > 0 ? "#7C68E1" : "rgba(255,255,255,0.3)" }}
      >
        {percent}%
      </span>
    </div>
  );
};
