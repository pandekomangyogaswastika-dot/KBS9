/**
 * Tech metadata: mapping dari nama teknologi ke
 *   - icon slug (simple-icons CDN)
 *   - brand color (hex tanpa '#')
 *   - description singkat (id)
 *   - benefits utama
 *   - homepage URL
 *
 * Logo akan diambil dari https://cdn.simpleicons.org/{slug}/{hex}
 * Fallback: jika nama tidak dikenal, render initial badge.
 */

export const TECH_META = {
  React: {
    slug: "react",
    color: "61DAFB",
    description:
      "Library UI berbasis komponen yang menjadi pondasi seluruh frontend modern KTI — fast, declarative, dan punya ekosistem terbesar.",
    benefits: [
      "Komponen reusable & maintainable",
      "Ekosistem terbesar (Next.js, React Native, dst.)",
      "Performa tinggi via virtual DOM",
    ],
    url: "https://react.dev",
  },
  "Next.js": {
    slug: "nextdotjs",
    color: "FFFFFF",
    description:
      "Framework React fullstack untuk SSR/ISR/static, routing edge, dan SEO-friendly pages.",
    benefits: [
      "Server-side rendering & static generation",
      "Routing dan API routes built-in",
      "Optimasi gambar & performance out-of-the-box",
    ],
    url: "https://nextjs.org",
  },
  "React Native": {
    slug: "react",
    color: "61DAFB",
    description:
      "Framework mobile cross-platform berbasis React. Cocok untuk delivery cepat ke iOS & Android dengan codebase yang sama.",
    benefits: [
      "Codebase tunggal iOS & Android",
      "Native module bila perlu performa khusus",
      "Reuse skill React tim",
    ],
    url: "https://reactnative.dev",
  },
  Flutter: {
    slug: "flutter",
    color: "02569B",
    description:
      "Toolkit UI dari Google untuk membangun aplikasi mobile, web, dan desktop dari satu codebase Dart.",
    benefits: [
      "Hot reload, productivity tinggi",
      "Konsisten visual lintas platform",
      "Performa native via Skia/Impeller",
    ],
    url: "https://flutter.dev",
  },
  "Node.js": {
    slug: "nodedotjs",
    color: "5FA04E",
    description:
      "Runtime JavaScript untuk server. Cocok untuk realtime, API gateway, dan microservices ringan.",
    benefits: [
      "Async non-blocking I/O",
      "Ekosistem NPM yang besar",
      "Cocok untuk realtime & streaming",
    ],
    url: "https://nodejs.org",
  },
  FastAPI: {
    slug: "fastapi",
    color: "009688",
    description:
      "Framework Python async untuk membangun REST/WS API performant dengan validasi Pydantic.",
    benefits: [
      "Performance setara Node/Go",
      "Type safety via Pydantic",
      "OpenAPI/Swagger otomatis",
    ],
    url: "https://fastapi.tiangolo.com",
  },
  Go: {
    slug: "go",
    color: "00ADD8",
    description:
      "Bahasa low-latency untuk service kritikal, gateway, dan batch processor berskala besar.",
    benefits: [
      "Konkurensi via goroutines",
      "Compile ke single static binary",
      "Latency rendah & memory efficient",
    ],
    url: "https://go.dev",
  },
  PostgreSQL: {
    slug: "postgresql",
    color: "4169E1",
    description:
      "Database relasional kelas enterprise untuk transactional workloads & analitik.",
    benefits: [
      "ACID compliance penuh",
      "JSONB untuk hybrid relational/document",
      "Ekstensi kaya (PostGIS, pgvector)",
    ],
    url: "https://www.postgresql.org",
  },
  MongoDB: {
    slug: "mongodb",
    color: "47A248",
    description:
      "Document DB fleksibel untuk konten variatif, CMS, dan microservices yang berkembang cepat.",
    benefits: [
      "Schema fleksibel (document model)",
      "Skalabilitas horizontal",
      "Cocok untuk CMS, katalog, & event store",
    ],
    url: "https://www.mongodb.com",
  },
  Redis: {
    slug: "redis",
    color: "FF4438",
    description:
      "In-memory store untuk cache, session, queue, dan realtime pub/sub.",
    benefits: [
      "Latency sub-millisecond",
      "Cache, queue, rate limiting",
      "Pub/sub & streams realtime",
    ],
    url: "https://redis.io",
  },
  Kubernetes: {
    slug: "kubernetes",
    color: "326CE5",
    description:
      "Orkestrator container standar industri untuk deployment skalabel, self-healing, dan rolling release.",
    benefits: [
      "Auto-scaling & self-healing",
      "Rolling deployment tanpa downtime",
      "Multi-cloud portable",
    ],
    url: "https://kubernetes.io",
  },
  Docker: {
    slug: "docker",
    color: "2496ED",
    description:
      "Container runtime untuk packaging aplikasi yang konsisten dari dev → staging → production.",
    benefits: [
      "Konsistensi environment lintas tim",
      "Reproducible build artifacts",
      "Cocok untuk microservices",
    ],
    url: "https://www.docker.com",
  },
  AWS: {
    slug: "amazonwebservices",
    color: "FF9900",
    description:
      "Cloud provider utama untuk hosting workload enterprise: compute, storage, networking, dan AI.",
    benefits: [
      "Skala global dengan region/edge",
      "Layanan lengkap untuk semua workload",
      "Reliability tinggi",
    ],
    url: "https://aws.amazon.com",
  },
  TensorFlow: {
    slug: "tensorflow",
    color: "FF6F00",
    description:
      "Framework machine learning untuk model produksi, mulai dari computer vision hingga prediksi time-series.",
    benefits: [
      "Pipeline ML siap produksi",
      "Deploy ke server, mobile, atau browser",
      "Ekosistem TFX untuk MLOps",
    ],
    url: "https://www.tensorflow.org",
  },
  "OpenAI / Claude": {
    slug: "openai",
    color: "FFFFFF",
    description:
      "LLM kelas dunia untuk fitur AI: chatbot, summarization, RAG, asisten internal, dan augmented analytics.",
    benefits: [
      "Reasoning kuat untuk task kompleks",
      "Multi-modal (teks, gambar, dokumen)",
      "Cocok untuk product feature & internal copilots",
    ],
    url: "https://openai.com",
  },
  Kafka: {
    slug: "apachekafka",
    color: "FFFFFF",
    description:
      "Distributed event streaming platform untuk data pipeline, integrasi, dan event-driven architecture.",
    benefits: [
      "Throughput tinggi (jutaan event/detik)",
      "Durable log untuk replay",
      "Backbone untuk integrasi sistem",
    ],
    url: "https://kafka.apache.org",
  },
};

export const CATEGORY_META = {
  Frontend: { color: "var(--kti-teal)", description: "UI & client-side experience" },
  Mobile: { color: "#7DD3FC", description: "Aplikasi iOS, Android, & cross-platform" },
  Backend: { color: "var(--kti-indigo)", description: "API, services, dan logika bisnis" },
  Data: { color: "#F472B6", description: "Database, cache, dan streaming" },
  Cloud: { color: "#FB923C", description: "Infrastruktur & deployment" },
  AI: { color: "#A78BFA", description: "Machine learning & AI services" },
};

/**
 * Get tech meta safely.
 * Fallback: generate slug from name and use a neutral color.
 */
export function getTechMeta(name) {
  if (!name) return null;
  if (TECH_META[name]) return TECH_META[name];
  const slug = name
    .toLowerCase()
    .replace(/\s*\/\s*.+$/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return {
    slug,
    color: "FFFFFF",
    description: `${name} adalah salah satu teknologi yang digunakan KTI dalam stack kami.`,
    benefits: ["Production-tested di proyek kami"],
    url: "",
  };
}
