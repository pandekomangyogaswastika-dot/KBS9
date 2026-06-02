/**
 * serviceMeta.js — Enriched content per service slug.
 * Provides feature bullets, use-cases, gradient, and accent color
 * to render rich Services page sections and detail pages.
 */

export const SERVICE_META = {
  'custom-software-erp': {
    gradient: 'linear-gradient(135deg, #4F3E97 0%, #7C68E1 60%, #73D1AD 100%)',
    accentColor: '#7C68E1',
    features: {
      id: [
        'Analisis proses & alur kerja bisnis end-to-end',
        'Arsitektur modular, skalabel & cloud-ready',
        'Integrasi multi-sistem: API, EDI, webhook',
        'Modul ERP lengkap: produksi, keuangan, inventori, SDM',
        'Migrasi data & dukungan go-live penuh',
        'Pelatihan tim & pemeliharaan pasca-launch',
      ],
      en: [
        'End-to-end business process & workflow analysis',
        'Modular, scalable & cloud-ready architecture',
        'Multi-system integration: API, EDI, webhooks',
        'Full ERP modules: production, finance, inventory, HR',
        'Data migration & full go-live support',
        'Team training & post-launch maintenance',
      ],
    },
    usecases: {
      id: [
        'Manufaktur yang ingin mengotomasi rantai pasokan',
        'Distribusi membutuhkan WMS & tracking real-time',
        'Perusahaan yang telah melampaui batasan spreadsheet',
      ],
      en: [
        'Manufacturers automating their supply chain',
        'Distributors needing WMS & real-time tracking',
        'Companies that have outgrown spreadsheets',
      ],
    },
  },
  'web-mobile-app': {
    gradient: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #73D1AD 100%)',
    accentColor: '#2d6a9f',
    features: {
      id: [
        'UI/UX research & desain antarmuka yang intuitif',
        'Pengembangan cross-platform: iOS, Android, Web',
        'Arsitektur API-first & microservices',
        'Integrasi payment gateway, notifikasi push, SSO',
        'Pipeline CI/CD + automated testing',
        'Optimisasi performa & aksesibilitas',
      ],
      en: [
        'UI/UX research & intuitive interface design',
        'Cross-platform development: iOS, Android, Web',
        'API-first & microservices architecture',
        'Payment gateway, push notifications, SSO integration',
        'CI/CD pipeline + automated testing',
        'Performance optimization & accessibility',
      ],
    },
    usecases: {
      id: [
        'Startup yang membutuhkan MVP dalam waktu singkat',
        'Enterprise yang meluncurkan aplikasi customer-facing',
        'Bisnis yang ingin digitalisasi operasi internal',
      ],
      en: [
        'Startups needing a rapid MVP launch',
        'Enterprises launching customer-facing apps',
        'Businesses digitizing their internal operations',
      ],
    },
  },
  'cloud-devops': {
    gradient: 'linear-gradient(135deg, #0f3460 0%, #16213e 60%, #4F3E97 100%)',
    accentColor: '#4F3E97',
    features: {
      id: [
        'Migrasi & arsitektur cloud (AWS, GCP, Azure)',
        'Setup Kubernetes, Docker, container orchestration',
        'CI/CD pipeline & GitOps workflow',
        'Infrastructure as Code (Terraform, Ansible)',
        'Monitoring, alerting & observability (Prometheus, Grafana)',
        'Security hardening & disaster recovery',
      ],
      en: [
        'Cloud migration & architecture (AWS, GCP, Azure)',
        'Kubernetes, Docker & container orchestration setup',
        'CI/CD pipeline & GitOps workflow',
        'Infrastructure as Code (Terraform, Ansible)',
        'Monitoring, alerting & observability (Prometheus, Grafana)',
        'Security hardening & disaster recovery',
      ],
    },
    usecases: {
      id: [
        'Perusahaan yang bermigrasi dari on-premise ke cloud',
        'Tim engineering yang ingin percepat deployment cycle',
        'Bisnis yang perlu skalabilitas otomatis di peak season',
      ],
      en: [
        'Companies migrating from on-premise to cloud',
        'Engineering teams accelerating deployment cycles',
        'Businesses needing auto-scaling during peak seasons',
      ],
    },
  },
  'ai-data-automation': {
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #7C68E1 50%, #73D1AD 100%)',
    accentColor: '#73D1AD',
    features: {
      id: [
        'Custom AI model & fine-tuning untuk domain spesifik',
        'Pipeline data end-to-end: ingesti, transformasi, serving',
        'Otomasi proses bisnis dengan AI (RPA + LLM)',
        'Sistem rekomendasi & prediksi berbasis data',
        'RAG & intelligent chatbot grounded ke knowledge base',
        'Dashboard analytics & business intelligence real-time',
      ],
      en: [
        'Custom AI model & domain-specific fine-tuning',
        'End-to-end data pipeline: ingestion, transformation, serving',
        'AI-powered business process automation (RPA + LLM)',
        'Data-driven recommendation & prediction systems',
        'RAG & intelligent chatbot grounded to knowledge base',
        'Real-time analytics dashboard & business intelligence',
      ],
    },
    usecases: {
      id: [
        'Bisnis yang ingin automasi proses manual berulang',
        'Perusahaan yang ingin mengekstrak insight dari data besar',
        'Tim yang butuh asisten AI internal berbasis knowledge base',
      ],
      en: [
        'Businesses automating repetitive manual processes',
        'Companies extracting insights from large datasets',
        'Teams needing an internal AI assistant from a knowledge base',
      ],
    },
  },
  'iot-rfid': {
    gradient: 'linear-gradient(135deg, #003d3d 0%, #006666 50%, #73D1AD 100%)',
    accentColor: '#00a896',
    features: {
      id: [
        'Desain & deployment jaringan sensor IoT',
        'Sistem tracking RFID untuk aset & inventori',
        'Integrasi hardware-software real-time',
        'Dashboard monitoring kondisi aset jarak jauh',
        'Protokol komunikasi: MQTT, LoRaWAN, BLE, Zigbee',
        'Edge computing & pemrosesan data lokal',
      ],
      en: [
        'IoT sensor network design & deployment',
        'RFID tracking systems for assets & inventory',
        'Real-time hardware-software integration',
        'Remote asset condition monitoring dashboard',
        'Communication protocols: MQTT, LoRaWAN, BLE, Zigbee',
        'Edge computing & local data processing',
      ],
    },
    usecases: {
      id: [
        'Warehouse yang ingin tracking inventori otomatis',
        'Pabrik yang membutuhkan monitoring mesin real-time',
        'Logistik yang perlu visibilitas penuh atas aset',
      ],
      en: [
        'Warehouses needing automated inventory tracking',
        'Factories requiring real-time machine monitoring',
        'Logistics companies needing full asset visibility',
      ],
    },
  },
  'ux-product-design': {
    gradient: 'linear-gradient(135deg, #4a1942 0%, #8b2fc9 60%, #7C68E1 100%)',
    accentColor: '#8b2fc9',
    features: {
      id: [
        'UX research: user interview, usability test, personas',
        'Information architecture & user flow mapping',
        'Wireframing, prototyping & interactive mockup',
        'Desain sistem & design token yang konsisten',
        'Handoff ke developer dengan Figma / design specs',
        'Iterasi berbasis data & A/B testing',
      ],
      en: [
        'UX research: user interviews, usability testing, personas',
        'Information architecture & user flow mapping',
        'Wireframing, prototyping & interactive mockups',
        'Design system & consistent design tokens',
        'Developer handoff via Figma / design specs',
        'Data-driven iteration & A/B testing',
      ],
    },
    usecases: {
      id: [
        'Produk yang membutuhkan redesign total dari UX buruk',
        'Startup yang ingin validasi desain sebelum develop',
        'Enterprise yang membangun design system terpusat',
      ],
      en: [
        'Products needing a full redesign from poor UX',
        'Startups validating design before development',
        'Enterprises building a centralized design system',
      ],
    },
  },
  'it-consulting': {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #4F3E97 100%)',
    accentColor: '#7C68E1',
    features: {
      id: [
        'Audit teknologi & roadmap transformasi digital',
        'Evaluasi vendor & stack teknologi',
        'Enterprise architecture design & governance',
        'Integrasi sistem lintas platform (ERP, CRM, SCM)',
        'Program perubahan & manajemen adopsi teknologi',
        'Workshop teknis & capacity building tim internal',
      ],
      en: [
        'Technology audit & digital transformation roadmap',
        'Vendor evaluation & technology stack assessment',
        'Enterprise architecture design & governance',
        'Cross-platform system integration (ERP, CRM, SCM)',
        'Change management & technology adoption programs',
        'Technical workshops & internal team capacity building',
      ],
    },
    usecases: {
      id: [
        'CTO/CIO yang membutuhkan strategic IT advisory',
        'Perusahaan yang ingin evaluasi & konsolidasi sistem lama',
        'Organisasi yang memulai perjalanan transformasi digital',
      ],
      en: [
        'CTOs/CIOs needing strategic IT advisory',
        'Companies evaluating & consolidating legacy systems',
        'Organizations starting their digital transformation journey',
      ],
    },
  },
};

export const getServiceMeta = (slug) =>
  SERVICE_META[slug] || {
    gradient: 'linear-gradient(135deg, #4F3E97 0%, #7C68E1 100%)',
    accentColor: '#7C68E1',
    features: { id: [], en: [] },
    usecases: { id: [], en: [] },
  };
