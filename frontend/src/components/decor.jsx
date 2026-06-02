// Dekoratif: logo, hex mark, planet orb (cases), crew avatar, logo chip, star layer.

export const KTI_LOGO = "https://customer-assets.emergentagent.com/job_a52d8ee5-565f-40b5-b6b4-e2621e38267c/artifacts/3b1m0zyx_logo%20kubus%20nobg.png";

export function KubusMark({ className = "", height = 38 }) {
  return (
    <img src={KTI_LOGO} alt="Kubus Teknologi Indonesia" height={height} style={{ height }} className={`w-auto select-none ${className}`} draggable={false} />
  );
}

export function HexMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="kti-hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F3E97" />
          <stop offset="0.55" stopColor="#7C68E1" />
          <stop offset="1" stopColor="#73D1AD" />
        </linearGradient>
      </defs>
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="url(#kti-hex)" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="50,26 71,38 71,62 50,74 29,62 29,38" fill="url(#kti-hex)" opacity="0.85" />
    </svg>
  );
}

const PLANET = {
  "planet-indigo": { a: "#7C68E1", b: "#4F3E97" },
  "planet-teal": { a: "#73D1AD", b: "#2c6e5b" },
  "planet-violet": { a: "#9d8bff", b: "#3a2d73" },
  "planet-aurora": { a: "#73D1AD", b: "#7C68E1" },
};

export function PlanetOrb({ variant = "planet-indigo", size = 120, ring = true }) {
  const c = PLANET[variant] || PLANET["planet-indigo"];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} aria-hidden="true">
      {ring && (
        <div className="absolute rounded-full" style={{ width: size * 1.4, height: size * 1.4, border: "1px solid rgba(255,255,255,0.12)", transform: "rotateX(72deg)" }} />
      )}
      <div className="rounded-full" style={{
        width: size, height: size,
        background: `radial-gradient(circle at 32% 28%, ${c.a}, ${c.b} 62%, #07080f 100%)`,
        boxShadow: `0 0 50px ${c.a}40, inset -8px -10px 30px rgba(0,0,0,0.55)`,
      }} />
    </div>
  );
}

export function CrewAvatar({ name = "", seed = "k", size = 96 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, #1a1d36, #0b0d17)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 18%, rgba(124,104,225,0.5), transparent 60%)" }} />
      <div className="absolute inset-0 grid place-items-center font-display font-semibold" style={{ fontSize: size * 0.34, color: "#cdd3ff" }}>{initials}</div>
      <div className="kti-scanline" />
      <div className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(115,209,173,0.35)" }} />
    </div>
  );
}

export function LogoChip({ name }) {
  return (
    <div className="kti-glass rounded-xl px-5 py-4 grid place-items-center text-center transition-colors duration-300 hover:bg-white/10">
      <span className="font-display font-semibold tracking-tight" style={{ color: "#cfd4ea" }}>{name}</span>
    </div>
  );
}

export function StarLayer({ className = "" }) {
  return <div className={`kti-starlayer pointer-events-none absolute inset-0 ${className}`} aria-hidden="true" />;
}
