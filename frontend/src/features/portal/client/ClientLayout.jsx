import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  LayoutDashboard, FolderKanban, FileText, MessageSquare, Bot,
  LogOut, Globe, Menu, ShieldCheck, ClipboardList,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { KubusMark } from "@/components/decor";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";

export default function ClientLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const links = [
    { section: t("admin.sectionMain"), items: [
      { to: "/portal/dashboard", end: true, icon: LayoutDashboard, label: t("portal.dashboard"), testid: PORTAL.navDashboard },
    ]},
    { section: t("portal.sectionProjects"), items: [
      { to: "/portal/projects", icon: FolderKanban, label: t("portal.myProjects"), testid: PORTAL.navProjects },
      { to: "/portal/invoices", icon: FileText, label: t("portal.invoices"), testid: PORTAL.navInvoices },
    ]},
    { section: t("portal.sectionSupport"), items: [
      { to: "/portal/assessments", icon: ClipboardList, label: "Assessment", testid: "portal-nav-assessments" },
      { to: "/portal/messages", icon: MessageSquare, label: t("portal.messages"), testid: PORTAL.navMessages },
      { to: "/portal/assistant", icon: Bot, label: t("portal.assistant"), testid: PORTAL.navAssistant },
    ]},
  ];

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-white/[0.09] text-white border border-white/12"
        : "text-[color:var(--kti-text-dim)] hover:bg-white/[0.05] hover:text-white border border-transparent"
    }`;

  const NavList = ({ onNavigate }) => (
    <nav className="flex flex-col gap-5" data-testid={PORTAL.sidebar}>
      {links.map((s, si) => (
        <div key={si}>
          <p className="mb-2 px-3 font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">{s.section}</p>
          <div className="flex flex-col gap-1">
            {s.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkCls} data-testid={item.testid} onClick={onNavigate}>
                <item.icon className="size-4 shrink-0" />
                {item.label}
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
          <span className="font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-dim)]">{t("portal.clientPortal")}</span>
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
                <button className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 lg:hidden" data-testid={PORTAL.mobileMenuButton} aria-label="Menu">
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto border-white/10 p-4" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="mb-6 flex items-center gap-2 pt-2"><KubusMark height={26} /></div>
                <NavList onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="hidden font-mono-kti text-[10px] uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] sm:inline">Kubus Client Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch scope="portal" className="hidden md:inline-flex" />
            <NotificationBell />
            <button onClick={toggleLang} className="kti-focus flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/[0.06]">
              <Globe className="size-4" style={{ color: "var(--kti-teal)" }} />{isEN ? "EN" : "ID"}
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white/80 sm:inline-flex">
              <ShieldCheck className="size-3.5" />{t("admin.roleClient")}
            </span>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight text-white">{user?.name}</p>
              <p className="text-[10px] leading-tight text-[color:var(--kti-text-dim)]">{user?.email}</p>
            </div>
            <button onClick={doLogout} data-testid={PORTAL.logoutButton} className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white" aria-label={t("admin.logout")}>
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
