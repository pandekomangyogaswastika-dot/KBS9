import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useContentLocale } from "@/lib/useContentLocale";
import { StatsCountUp } from "@/components/kti/StatsCountUp";
import { GAUGES, TECH_METRICS } from "@/content/home";

const TONES = { teal: "#73D1AD", indigo: "#7C68E1" };

const RadialGauge = ({ gauge }) => {
  const { L } = useContentLocale();
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const color = TONES[gauge.tone] || TONES.teal;

  const r = 52;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270deg gauge
  const trackLen = arc * c;
  const valueLen = (gauge.value / gauge.max) * arc * c;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center" data-testid={`gauge-${gauge.key}`}>
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 120 120">
          <g transform="rotate(135 60 60)">
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${trackLen} ${c}`}
            />
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${on ? valueLen : 0} ${c}`}
              style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.2,0.8,0.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <StatsCountUp
            value={`${gauge.value}${gauge.suffix}`}
            className="font-display text-2xl font-semibold text-white"
          />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-[color:var(--kti-text-dim)]">{L(gauge.label)}</p>
    </div>
  );
};

const SparkCard = ({ metric }) => {
  const { L } = useContentLocale();
  const data = metric.series.map((v, i) => ({ i, v }));
  const down = metric.delta.trim().startsWith("-");
  return (
    <div
      className="rounded-[var(--kti-radius-soft)] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
      data-testid={`tech-metric-${metric.key}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-hud text-[10px] uppercase tracking-[0.2em] text-[color:var(--kti-text-dim)]">{L(metric.label)}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            color: down ? "var(--kti-teal)" : "var(--kti-indigo)",
            background: down ? "rgba(115,209,173,0.12)" : "rgba(124,104,225,0.14)",
          }}
        >
          {metric.delta}
        </span>
      </div>
      <div className="mt-1 font-display text-2xl font-semibold text-white">{metric.value}</div>
      <div className="mt-1 h-9">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
            <Line type="monotone" dataKey="v" stroke="#73D1AD" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const GaugeDataViz = () => {
  return (
    <div className="grid gap-8 lg:grid-cols-2" data-testid="gauge-data-viz">
      <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {GAUGES.map((g) => (
            <RadialGauge key={g.key} gauge={g} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TECH_METRICS.map((m) => (
          <SparkCard key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
};
