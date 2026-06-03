import { useNavigate } from "react-router-dom";
import {
  Home, Wrench, Briefcase, Cpu, Users, BadgeCheck, Newspaper, BookOpen, Scale,
  Quote, HelpCircle, Package, GalleryHorizontalEnd, Handshake, Image as ImageIcon,
  ArrowRight, PanelsTopLeft, ChevronRight,
} from "lucide-react";

const CMS_SECTIONS = [
  {
    id: "website",
    title: "Website Pages",
    subtitle: "Konten utama yang ditampilkan ke publik",
    color: "indigo",
    items: [
      { to: "/portal/admin/cms/home-blocks", icon: Home, label: "Home Blocks", desc: "Hero, stats, features" },
      { to: "/portal/admin/cms/services", icon: Wrench, label: "Layanan", desc: "Daftar layanan KTI" },
      { to: "/portal/admin/cms/cases", icon: Briefcase, label: "Cases", desc: "Studi kasus & portfolio" },
      { to: "/portal/admin/cms/tech", icon: Cpu, label: "Tech Stack", desc: "Teknologi yang digunakan" },
      { to: "/portal/admin/cms/team", icon: Users, label: "Tim", desc: "Profil anggota tim" },
      { to: "/portal/admin/cms/careers", icon: BadgeCheck, label: "Karir", desc: "Lowongan pekerjaan" },
      { to: "/portal/admin/cms/blog", icon: Newspaper, label: "Blog", desc: "Artikel & insight" },
      { to: "/portal/admin/cms/resources", icon: BookOpen, label: "Resources", desc: "Download & dokumen" },
      { to: "/portal/admin/cms/legal", icon: Scale, label: "Legal", desc: "Privacy & Terms" },
    ],
  },
  {
    id: "components",
    title: "Komponen UI",
    subtitle: "Elemen reusable yang muncul di berbagai halaman",
    color: "teal",
    items: [
      { to: "/portal/admin/cms/testimonials", icon: Quote, label: "Testimonials", desc: "Ulasan klien" },
      { to: "/portal/admin/cms/faq", icon: HelpCircle, label: "FAQ", desc: "Pertanyaan umum" },
      { to: "/portal/admin/cms/packages", icon: Package, label: "Packages", desc: "Paket layanan & harga" },
    ],
  },
  {
    id: "showcase",
    title: "Showcase",
    subtitle: "Logo & asosiasi yang memperkuat kredibilitas",
    color: "amber",
    items: [
      { to: "/portal/admin/cms/clients", icon: GalleryHorizontalEnd, label: "Client Logos", desc: "Logo klien yang ditampilkan" },
      { to: "/portal/admin/cms/partners", icon: Handshake, label: "Partners", desc: "Mitra & ekosistem" },
    ],
  },
  {
    id: "media",
    title: "Media",
    subtitle: "Kelola semua aset gambar & file",
    color: "slate",
    items: [
      { to: "/portal/admin/media", icon: ImageIcon, label: "Media Library", desc: "Semua gambar & dokumen" },
    ],
  },
];

const COLOR_MAP = {
  indigo: {
    section: "border-[rgba(124,104,225,0.2)] bg-[rgba(124,104,225,0.06)]",
    badge: "border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.12)] text-[color:var(--kti-indigo)]",
    icon: "border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.12)] text-[color:var(--kti-indigo)]",
    item: "hover:border-[rgba(124,104,225,0.2)] hover:bg-[rgba(124,104,225,0.06)]",
  },
  teal: {
    section: "border-[rgba(115,209,173,0.2)] bg-[rgba(115,209,173,0.04)]",
    badge: "border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.1)] text-[color:var(--kti-teal)]",
    icon: "border-[rgba(115,209,173,0.3)] bg-[rgba(115,209,173,0.1)] text-[color:var(--kti-teal)]",
    item: "hover:border-[rgba(115,209,173,0.2)] hover:bg-[rgba(115,209,173,0.05)]",
  },
  amber: {
    section: "border-[rgba(242,200,121,0.2)] bg-[rgba(242,200,121,0.03)]",
    badge: "border-[rgba(242,200,121,0.3)] bg-[rgba(242,200,121,0.08)] text-[#f2c879]",
    icon: "border-[rgba(242,200,121,0.3)] bg-[rgba(242,200,121,0.08)] text-[#f2c879]",
    item: "hover:border-[rgba(242,200,121,0.2)] hover:bg-[rgba(242,200,121,0.04)]",
  },
  slate: {
    section: "border-white/[0.08] bg-white/[0.02]",
    badge: "border-white/10 bg-white/[0.06] text-[color:var(--kti-text-dim)]",
    icon: "border-white/10 bg-white/[0.06] text-[color:var(--kti-text-dim)]",
    item: "hover:border-white/10 hover:bg-white/[0.04]",
  },
};

export default function CmsHubPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8" data-testid="cms-hub-page">
      {/* Header */}
      <div data-testid="cms-hub-header">
        <div className="flex items-center gap-2 text-xs text-[color:var(--kti-text-faint)]">
          <span>Portal Admin</span>
          <ChevronRight className="size-3" />
          <span className="text-white">Content Hub</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Content Hub</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">
          Kelola website, komponen UI, showcase, dan media dari satu tempat.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CMS_SECTIONS.map((s) => {
          const c = COLOR_MAP[s.color];
          return (
            <div key={s.id} className={`rounded-2xl border p-4 ${c.section}`}>
              <p className="text-2xl font-bold text-white">{s.items.length}</p>
              <p className="mt-0.5 text-xs text-[color:var(--kti-text-dim)]">{s.title}</p>
            </div>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {CMS_SECTIONS.map((s) => {
          const c = COLOR_MAP[s.color];
          return (
            <div key={s.id} data-testid={`cms-hub-card-${s.id}`}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">{s.title}</h2>
                  <p className="text-xs text-[color:var(--kti-text-faint)]">{s.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => navigate(item.to)}
                      className={`group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors ${c.item}`}
                    >
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${c.icon}`}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="truncate text-xs text-[color:var(--kti-text-faint)]">{item.desc}</p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-[color:var(--kti-text-faint)] transition-opacity opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
