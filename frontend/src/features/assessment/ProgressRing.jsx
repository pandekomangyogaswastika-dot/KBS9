export default function ProgressRing({ percent = 0, size = 44, stroke = 4, className = "" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, percent)) / 100) * c;
  return (
    <svg width={size} height={size} className={className} viewBox={`0 0 ${size} ${size}`} data-testid="progress-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ktiRing)" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .5s ease" }}
      />
      <defs>
        <linearGradient id="ktiRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C68E1" />
          <stop offset="100%" stopColor="#73D1AD" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize={size * 0.26} fontWeight="600">{Math.round(percent)}%</text>
    </svg>
  );
}
