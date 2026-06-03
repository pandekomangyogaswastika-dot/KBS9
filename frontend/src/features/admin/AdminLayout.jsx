import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  LayoutDashboard, LogOut, Globe, Menu, ShieldCheck,
  UserPlus, Building2, ClipboardList,
  FolderKanban, MessageSquare, Sparkles,
  CalendarClock, BarChart3, Search,
  PanelsTopLeft, Home, Boxes, Briefcase, FileText, Cpu, Users as UsersIcon,
  BookOpen, Scale, Quote, HelpCircle, Package, Handshake, Newspaper,
  GalleryHorizontalEnd, Image as ImageIcon, BadgeCheck, Wrench,
  UserCog, Plug, Send, Settings, ChevronRight, Inbox, MonitorPlay,
  BotMessageSquare, Mailbox,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { KubusMark } from "@/components/decor";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { ADMIN } from "@/constants/testIds";

const STORAGE_KEY = "kti.sidebar.admin.contentState";

const roleTone = {
  admin: "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.16)] text-[#cfc4ff]",
  staff: "border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.14)] text-[#a9ecd2]",
  client: "border-white/15 bg-white/8 text-white/80",
};

// ─── CMS Content groups (collapsible) ────────────────────────────────────────
const CMS_GROUPS = [
  {
    id: "website",
    label: "Website",
    defaultOpen: true,
    items: [
      { to: "/portal/admin/cms/home-blocks", icon: Home, label: "Home", testid: "admin-nav-cms-home" },
      { to: "/portal/admin/cms/services", icon: Wrench, label: "Layanan", testid: "admin-nav-cms-services" },
      { to: "/portal/admin/cms/cases", icon: Briefcase, label: "Cases", testid: "admin-nav-cms-cases" },
      { to: "/portal/admin/cms/tech", icon: Cpu, label: "Tech Stack", testid: "admin-nav-cms-tech" },
      { to: "/portal/admin/cms/team", icon: UsersIcon, label: "Tim", testid: "admin-nav-cms-team" },
      { to: "/portal/admin/cms/careers", icon: BadgeCheck, label: "Karir", testid: "admin-nav-cms-careers" },
      { to: "/portal/admin/cms/blog", icon: Newspaper, label: "Blog", testid: "admin-nav-cms-blog" },
      { to: "/portal/admin/cms/resources", icon: BookOpen, label: "Resources", testid: "admin-nav-cms-resources" },
      { to: "/portal/admin/cms/legal", icon: Scale, label: "Legal", testid: "admin-nav-cms-legal", adminOnly: true },
    ],
  },
  {
    id: "components",
    label: "Komponen UI",
    defaultOpen: false,
    items: [
      { to: "/portal/admin/cms/testimonials", icon: Quote, label: "Testimonials", testid: "admin-nav-cms-testimonials" },
      { to: "/portal/admin/cms/faq", icon: HelpCircle, label: "FAQ", testid: "admin-nav-cms-faq" },
      { to: "/portal/admin/cms/packages", icon: Package, label: "Packages", testid: "admin-nav-cms-packages" },
    ],
  },
  {
    id: "showcase",
    label: "Showcase",
    defaultOpen: false,
    items: [
      { to: "/portal/admin/cms/clients", icon: GalleryHorizontalEnd, label: "Client Logos", testid: "admin-nav-cms-client-logos" },
      { to: "/portal/admin/cms/partners", icon: Handshake, label: "Partners", testid: "admin-nav-cms-partners" },
    ],
  },
  {
    id: "media",
    label: "Media",
    defaultOpen: false,
    items: [
      { to: "/portal/admin/media", icon: ImageIcon, label: "Media Library", testid: "admin-nav-media-library" },
    ],
  },
];

// ─── Non-CMS sections ─────────────────────────────────────────────────────────
function buildSections(role) {
  const isAdmin = role === "admin";
  return [
    {
      id: "main",
      label: null,
      items: [
        { to: "/portal/admin", end: true, icon: LayoutDashboard, label: "Dashboard", testid: ADMIN.navDashboard },
      ],
    },
    {
      id: "crm",
      label: "CRM",
      items: [
        { to: "/portal/admin/leads", icon: UserPlus, label: "Leads", testid: ADMIN.navLeads },
        { to: "/portal/admin/assessments", icon: ClipboardList, label: "Assessments", testid: "admin-nav-assessments" },
        { to: "/portal/admin/clients", icon: Building2, label: "Clients", testid: "admin-nav-clients" },
      ],
    },
    {
      id: "delivery",
      label: "Delivery",
      items: [
        { to: "/portal/admin/projects", icon: FolderKanban, label: "Projects", testid: "admin-nav-projects" },
        { to: "/portal/admin/messages", icon: MessageSquare, label: "Messages", testid: "admin-nav-messages" },
        { to: "/portal/admin/ai-conversations", icon: BotMessageSquare, label: "AI Conversations", testid: "admin-nav-ai-logs" },
      ],
    },
    {
      id: "product",
      label: "Product",
      items: [
        { to: "/portal/admin/demo-sessions", icon: MonitorPlay, label: "Demo Sessions", testid: "admin-nav-demo-sessions" },
        { to: "/portal/admin/analytics", icon: BarChart3, label: "Analytics", testid: "admin-nav-analytics" },
        { to: "/portal/admin/seo", icon: Search, label: "SEO", testid: "admin-nav-seo" },
      ],
    },
    // NOTE: "content" section is handled separately as a collapsible CMS group
    {
      id: "system",
      label: "System",
      adminOnly: true,
      items: [
        ...(isAdmin ? [
          { to: "/portal/admin/users", icon: UserCog, label: "Users", testid: ADMIN.navUsers },
          { to: "/portal/admin/settings/integrations", icon: Plug, label: "Integrations", testid: "admin-nav-integrations" },
        ] : []),
        { to: "/portal/admin/settings/email-outbox", icon: Mailbox, label: "Email Outbox", testid: "admin-nav-email-outbox" },
        { to: "/portal/admin/settings", icon: Settings, label: "Settings", testid: ADMIN.navSettings },
      ].filter(Boolean),
    },
  ].filter((s) => {
    if (s.adminOnly && !isAdmin) return false;
    return s.items.length > 0;
  });
}

// ─── Single nav item ─────────────────────────────────────────────────────────
function NavItem({ to, end, icon: Icon, label, testid, onClick, indent = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
          indent ? "pl-8" : ""
        } ${
          isActive
            ? "bg-white/[0.07] text-white border border-white/[0.1]"
            : "text-[color:var(--kti-text-dim)] border border-transparent hover:bg-white/[0.04] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--kti-indigo)]"
              aria-hidden="true"
            />
          )}
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ─── CMS collapsible group ────────────────────────────────────────────────────
function CmsGroup({ group, openGroups, toggleGroup, role, onNavigate }) {
  const isOpen = openGroups[group.id] ?? group.defaultOpen;
  const items = group.items.filter((i) => !i.adminOnly || role === "admin");

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(124,104,225,0.4)]"
        data-testid={`admin-cms-group-${group.id}`}
      >
        <span className="truncate font-medium">{group.label}</span>
        <ChevronRight
          className={`size-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 flex flex-col gap-0.5 pl-2">
          {items.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              testid={item.testid}
              onClick={onNavigate}
              indent
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Full sidebar nav list ────────────────────────────────────────────────────
function NavList({ role, openGroups, toggleGroup, onNavigate }) {
  const sections = buildSections(role);

  return (
    <nav className="flex flex-col gap-5" data-testid={ADMIN.sidebar}>
      {/* Non-CMS sections */}
      {sections.map((s) => (
        <div key={s.id}>
          {s.label && (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[color:var(--kti-text-faint)]">
              {s.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {s.items.map((item) => (
              <NavItem key={item.to} {...item} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}

      <Separator className="border-white/[0.08]" />

      {/* Content / CMS section */}
      <div>
        <div className="mb-1.5 flex items-center justify-between px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[color:var(--kti-text-faint)]">
            Content
          </p>
          <NavLink
            to="/portal/admin/cms"
            onClick={onNavigate}
            data-testid="admin-nav-cms-hub"
            className={({ isActive }) =>
              `rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                isActive
                  ? "bg-[rgba(124,104,225,0.2)] text-[color:var(--kti-indigo)]"
                  : "text-[color:var(--kti-text-faint)] hover:text-[color:var(--kti-indigo)]"
              }`
            }
          >
            Hub
          </NavLink>
        </div>
        <div className="flex flex-col gap-1">
          {CMS_GROUPS.map((group) => (
            <CmsGroup
              key={group.id}
              group={group}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              role={role}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist CMS group open/closed state
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { website: true, components: false, showcase: false, media: false };
  });

  const toggleGroup = useCallback((id) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isEN = i18n.language?.startsWith("en");
  const toggleLang = () => {
    const next = isEN ? "id" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("kti_locale", next);
  };

  const doLogout = async () => {
    await logout();
    toast.success(t("admin.loggedOut"));
    navigate("/portal/login", { replace: true });
  };

  const role = user?.role || "staff";

  return (
    <div className="min-h-screen text-[color:var(--kti-text-strong)]" style={{ background: "var(--kti-space-975, #03040A)" }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.08] bg-[rgba(11,13,23,0.65)] backdrop-blur-xl lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
          <KubusMark height={26} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Kubus</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--kti-text-faint)]">
              {role === "admin" ? "Admin Panel" : "Staff Panel"}
            </p>
          </div>
        </div>

        {/* Nav scroll area */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList
            role={role}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
          />
        </div>

        {/* Bottom user strip */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <div className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${roleTone[role] || roleTone.staff}`}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[10px] text-[color:var(--kti-text-faint)]">{user?.email}</p>
            </div>
            <button
              onClick={doLogout}
              data-testid={ADMIN.logoutButton}
              aria-label={t("admin.logout")}
              className="kti-focus grid size-7 place-items-center rounded-lg text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[rgba(5,6,10,0.75)] px-4 py-3 backdrop-blur-xl">
          {/* Left: mobile menu */}
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 lg:hidden"
                  data-testid={ADMIN.mobileMenuButton}
                  aria-label="Menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto border-white/10 p-0" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
                  <KubusMark height={24} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Kubus</span>
                </div>
                <div className="px-3 py-4">
                  <NavList
                    role={role}
                    openGroups={openGroups}
                    toggleGroup={toggleGroup}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] sm:inline">
              Kubus Control Center
            </span>
          </div>

          {/* Right: tools */}
          <div className="flex items-center gap-2">
            <GlobalSearch scope="portal" className="hidden md:inline-flex" />
            <NotificationBell />
            <button
              onClick={toggleLang}
              data-testid="admin-lang-toggle"
              className="kti-focus flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.06]"
            >
              <Globe className="size-3.5" style={{ color: "var(--kti-teal)" }} />
              {isEN ? "EN" : "ID"}
            </button>
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:inline-flex ${
                roleTone[role] || roleTone.staff
              }`}
            >
              <ShieldCheck className="size-3.5" />
              {t(`admin.role${(role).charAt(0).toUpperCase() + (role).slice(1)}`)}
            </span>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
