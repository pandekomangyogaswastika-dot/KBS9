// Placeholder content for the V2 immersive home (bilingual {id, en}).
// Structured for easy migration to CMS (Phase 3). Witty, confident B2B tone.

export const MEDIA = {
  hero: { video: "/media/hero-nebula.mp4", poster: "/media/hero-nebula.jpg" },
  about: { video: "/media/cosmos.mp4", poster: "/media/cosmos.jpg" },
  services: { video: "/media/nebula.mp4", poster: "/media/nebula.jpg" },
  tech: { video: "/media/blackhole.mp4", poster: "/media/blackhole.jpg" },
  cases: { video: "/media/cosmos.mp4", poster: "/media/cosmos.jpg" },
  process: { video: "/media/nebula.mp4", poster: "/media/nebula.jpg" },
  secure: { video: "/media/blackhole.mp4", poster: "/media/blackhole.jpg" },
  engagement: { video: "/media/cosmos.mp4", poster: "/media/cosmos.jpg" },
};

const b = (id, en) => ({ id, en });

// Hero telemetry — small HUD readouts in the glass card
export const HERO_TELEMETRY = [
  { key: "uptime", label: b("Uptime sistem", "System uptime"), value: "99.98%" },
  { key: "delivery", label: b("Misi terkirim", "Missions shipped"), value: "120+" },
  { key: "latency", label: b("Latensi rata-rata", "Avg. latency"), value: "48ms" },
];

// Idea -> Launch interactive process slider
export const PROCESS_STEPS = [
  {
    key: "discover",
    tag: b("01 · Discover", "01 · Discover"),
    title: b("Pahami orbit Anda", "Map your orbit"),
    desc: b(
      "Kami menggali tujuan bisnis, kendala teknis, dan peluang tersembunyi sebelum satu baris kode pun ditulis.",
      "We dig into business goals, technical constraints, and hidden opportunities before a single line of code is written."
    ),
  },
  {
    key: "design",
    tag: b("02 · Design", "02 · Design"),
    title: b("Rancang lintasan", "Chart the trajectory"),
    desc: b(
      "Arsitektur, design system, dan prototipe interaktif yang membuat keputusan terasa nyata sejak awal.",
      "Architecture, design systems, and interactive prototypes that make decisions feel real from day one."
    ),
  },
  {
    key: "build",
    tag: b("03 · Build", "03 · Build"),
    title: b("Bangun mesinnya", "Build the engine"),
    desc: b(
      "Sprint berdisiplin, code review ketat, dan CI/CD otomatis. Kualitas bukan fitur tambahan—itu fondasinya.",
      "Disciplined sprints, rigorous reviews, and automated CI/CD. Quality is not an add-on—it is the foundation."
    ),
  },
  {
    key: "launch",
    tag: b("04 · Launch", "04 · Launch"),
    title: b("Lepas landas", "Lift off"),
    desc: b(
      "Rilis terkendali, observability penuh, dan rollback aman. Peluncuran yang membosankan adalah peluncuran yang sukses.",
      "Controlled releases, full observability, and safe rollbacks. A boring launch is a successful launch."
    ),
  },
  {
    key: "scale",
    tag: b("05 · Scale", "05 · Scale"),
    title: b("Skala tanpa drama", "Scale without drama"),
    desc: b(
      "Pemantauan proaktif, optimasi biaya, dan iterasi berbasis data agar produk Anda tumbuh dengan tenang.",
      "Proactive monitoring, cost optimization, and data-driven iteration so your product grows quietly."
    ),
  },
];

// HUD gauges / telemetry data-viz
export const GAUGES = [
  { key: "uptime", label: b("Uptime SLA", "Uptime SLA"), value: 99.98, suffix: "%", max: 100, tone: "teal" },
  { key: "velocity", label: b("Velocity tim", "Team velocity"), value: 92, suffix: "%", max: 100, tone: "indigo" },
  { key: "coverage", label: b("Cakupan tes", "Test coverage"), value: 87, suffix: "%", max: 100, tone: "teal" },
  { key: "satisfaction", label: b("Kepuasan klien", "Client satisfaction"), value: 96, suffix: "%", max: 100, tone: "indigo" },
];

// Sparkline-style mini metrics for the tech HUD
export const TECH_METRICS = [
  { key: "deploys", label: b("Deploy / minggu", "Deploys / week"), value: "240", delta: "+18%", series: [8, 12, 9, 14, 18, 16, 22] },
  { key: "incidents", label: b("Insiden P1 / kuartal", "P1 incidents / quarter"), value: "0", delta: "-100%", series: [3, 2, 2, 1, 1, 0, 0] },
  { key: "mttr", label: b("MTTR", "MTTR"), value: "11m", delta: "-42%", series: [30, 26, 22, 18, 15, 13, 11] },
];

// Engagement tiers (how clients work with Kubus)
export const ENGAGEMENT_TIERS = [
  {
    key: "sprint",
    name: b("Discovery Sprint", "Discovery Sprint"),
    price: b("2–4 minggu", "2–4 weeks"),
    tagline: b("Validasi ide sebelum investasi besar.", "Validate the idea before the big investment."),
    highlight: false,
    features: [
      b("Workshop & riset mendalam", "Deep-dive workshops & research"),
      b("Arsitektur & roadmap teknis", "Architecture & technical roadmap"),
      b("Prototipe clickable", "Clickable prototype"),
      b("Estimasi biaya & timeline", "Cost & timeline estimate"),
    ],
  },
  {
    key: "build",
    name: b("Build Partnership", "Build Partnership"),
    price: b("Per proyek", "Per project"),
    tagline: b("Dari nol ke produksi, dikirim end-to-end.", "From zero to production, delivered end-to-end."),
    highlight: true,
    features: [
      b("Tim lintas-fungsi berdedikasi", "Dedicated cross-functional team"),
      b("Sprint 2-mingguan + demo", "Two-week sprints + demos"),
      b("CI/CD & observability", "CI/CD & observability"),
      b("Garansi & dukungan pasca-rilis", "Post-launch warranty & support"),
    ],
  },
  {
    key: "pod",
    name: b("Dedicated Pod", "Dedicated Pod"),
    price: b("Bulanan", "Monthly"),
    tagline: b("Kapasitas engineering elastis untuk roadmap panjang.", "Elastic engineering capacity for the long roadmap."),
    highlight: false,
    features: [
      b("Tim tetap & terprediksi", "Stable, predictable team"),
      b("Prioritas backlog fleksibel", "Flexible backlog priorities"),
      b("Akses langsung ke senior", "Direct access to seniors"),
      b("SLA & laporan bulanan", "SLA & monthly reporting"),
    ],
  },
];
