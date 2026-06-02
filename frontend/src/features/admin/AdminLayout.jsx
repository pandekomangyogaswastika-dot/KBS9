import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  LayoutDashboard, Inbox, Users as UsersIcon, LogOut, Globe, Menu, ShieldCheck, Image as ImageIcon,
  Boxes, Briefcase, FileText, Cpu, Building2, LayoutTemplate, Settings, FolderKanban, ClipboardList,
  MessageSquare, BotMessageSquare, BarChart3, Search, Plug, Mailbox, MonitorPlay,
  Quote, Scale, HelpCircle, Package, BookOpen, Handshake,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { KubusMark } from "@/components/decor";
import { useAuth } from "@/context/AuthContext";
import { ADMIN } from "@/constants/testIds";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";

const roleTone = {
  admin: "border-[rgba(124,104,225,0.5)] bg-[rgba(124,104,225,0.16)] text-[#cfc4ff]",
  staff: "border-[rgba(115,209,173,0.45)] bg-[rgba(115,209,173,0.14)] text-[#a9ecd2]",
  client: "border-white/15 bg-white/8 text-white/80",
};

function useNav(role) {
  const all = [
    {
      key: "sectionMain",
      items: [{ to: "/portal/admin", end: true, icon: LayoutDashboard, label: "admin.dashboard", testid: ADMIN.navDashboard, roles: ["admin", "staff"] }],
    },
    {
      key: "sectionCrm",
      items: [
        { to: "/portal/admin/leads", icon: Inbox, label: "admin.leads", testid: ADMIN.navLeads, roles: ["admin", "staff"] },
        { to: "/portal/admin/demo-sessions", icon: MonitorPlay, label: "admin.demoSessions", testid: "admin-nav-demo-sessions", roles: ["admin", "staff"] },
        { to: "/portal/admin/assessments", icon: ClipboardList, label: "assess.title", testid: "admin-nav-assessments", roles: ["admin", "staff"] },
        { to: "/portal/admin/clients", icon: Building2, label: "portal.clients", testid: "admin-nav-clients", roles: ["admin", "staff"] },
      ],
    },
    {
      key: "sectionProjects",
      items: [
        { to: "/portal/admin/projects", icon: FolderKanban, label: "portal.projects", testid: "admin-nav-projects", roles: ["admin", "staff"] },
        { to: "/portal/admin/messages", icon: MessageSquare, label: "portal.messages", testid: "admin-nav-messages", roles: ["admin", "staff"] },
        { to: "/portal/admin/ai-conversations", icon: BotMessageSquare, label: "admin.aiLogs", testid: "admin-nav-ai-logs", roles: ["admin", "staff"] },
        { to: "/portal/admin/analytics", icon: BarChart3, label: "admin.analytics", testid: "admin-nav-analytics", roles: ["admin", "staff"] },
        { to: "/portal/admin/seo", icon: Search, label: "admin.seo", testid: "admin-nav-seo", roles: ["admin", "staff"] },
      ],
    },
    {
      key: "sectionMedia",
      items: [{ to: "/portal/admin/media", icon: ImageIcon, label: "admin.media", testid: ADMIN.navMedia, roles: ["admin", "staff"] }],
    },
    {
      key: "sectionContent",
      items: [
        { to: "/portal/admin/cms/services", icon: Boxes, label: "nav.services", testid: "admin-nav-cms-services", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/cases", icon: FolderKanban, label: "nav.cases", testid: "admin-nav-cms-cases", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/tech", icon: Cpu, label: "nav.tech", testid: "admin-nav-cms-tech", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/team", icon: UsersIcon, label: "nav.team", testid: "admin-nav-cms-team", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/clients", icon: Building2, label: "cms.clients", testid: "admin-nav-cms-clients", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/partners", icon: Handshake, label: "cms.partners", testid: "admin-nav-cms-partners", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/blog", icon: FileText, label: "nav.blog", testid: "admin-nav-cms-blog", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/careers", icon: Briefcase, label: "nav.career", testid: "admin-nav-cms-careers", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/home-blocks", icon: LayoutTemplate, label: "cms.homeSections", testid: "admin-nav-cms-home", roles: ["admin", "staff"] },
        // Phase 19: Content Completion
        { to: "/portal/admin/cms/testimonials", icon: Quote, label: "cms.testimonials", testid: "admin-nav-cms-testimonials", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/faq", icon: HelpCircle, label: "cms.faq", testid: "admin-nav-cms-faq", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/packages", icon: Package, label: "cms.packages", testid: "admin-nav-cms-packages", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/resources", icon: BookOpen, label: "cms.resources", testid: "admin-nav-cms-resources", roles: ["admin", "staff"] },
        { to: "/portal/admin/cms/legal", icon: Scale, label: "cms.legal", testid: "admin-nav-cms-legal", roles: ["admin"] },
        { to: "/portal/admin/settings", icon: Settings, label: "cms.settings", testid: ADMIN.navSettings, roles: ["admin", "staff"] },
      ],
    },
    {
      key: "sectionSystem",
      items: [
        { to: "/portal/admin/settings/integrations", icon: Plug, label: "admin.integrations", testid: "admin-nav-integrations", roles: ["admin"] },
        { to: "/portal/admin/settings/email-outbox", icon: Mailbox, label: "admin.emailOutbox", testid: "admin-nav-email-outbox", roles: ["admin", "staff"] },
        { to: "/portal/admin/users", icon: UsersIcon, label: "admin.users", testid: ADMIN.navUsers, roles: ["admin"] },
      ],
    },
  ];
  return all
    .map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) }))
    .filter((s) => s.items.length > 0);
}

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useNav(user?.role || "staff");

  const isEN = i18n.language && i18n.language.startsWith("en");
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

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-white/[0.09] text-white border border-white/12"
        : "text-[color:var(--kti-text-dim)] hover:bg-white/[0.05] hover:text-white border border-transparent"
    }`;

  const NavList = ({ onNavigate }) => (
    <nav className="flex flex-col gap-5" data-testid={ADMIN.sidebar}>
      {sections.map((s) => (
        <div key={s.key}>
          <p className="mb-2 px-3 font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">{t(`admin.${s.key}`)}</p>
          <div className="flex flex-col gap-1">
            {s.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={linkCls} data-testid={i.testid} onClick={onNavigate}>
                <i.icon className="size-4 shrink-0" />
                {t(i.label)}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen text-[color:var(--kti-text-strong)]" style={{ background: "var(--kti-space-975, #03040A)" }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/8 bg-[rgba(11,13,23,0.6)] p-4 backdrop-blur-xl lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2 pt-2">
          <KubusMark height={28} />
          <span className="font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-dim)]">Admin</span>
        </div>
        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          <NavList />
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/8 bg-[rgba(5,6,10,0.7)] px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 lg:hidden" data-testid={ADMIN.mobileMenuButton} aria-label="Menu">
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto border-white/10 p-4" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="mb-6 flex items-center gap-2 pt-2"><KubusMark height={26} /></div>
                <NavList onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="hidden font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] sm:inline">Kubus Control</span>
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch scope="portal" className="hidden md:inline-flex" />
            <NotificationBell />
            <button onClick={toggleLang} data-testid={ADMIN.languageToggle} className="kti-focus flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/[0.06]">
              <Globe className="size-4" style={{ color: "var(--kti-teal)" }} />{isEN ? "EN" : "ID"}
            </button>
            <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:inline-flex ${roleTone[user?.role] || roleTone.client}`}>
              <ShieldCheck className="size-3.5" />{t(`admin.role${(user?.role || "").charAt(0).toUpperCase() + (user?.role || "").slice(1)}`)}
            </span>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight text-white">{user?.name}</p>
              <p className="text-[10px] leading-tight text-[color:var(--kti-text-dim)]">{user?.email}</p>
            </div>
            <button onClick={doLogout} data-testid={ADMIN.logoutButton} className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white" aria-label={t("admin.logout")}>
              <LogOut className="size-4" />
            </button>
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
