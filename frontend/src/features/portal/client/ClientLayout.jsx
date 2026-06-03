import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  LayoutDashboard, FolderKanban, Receipt, ClipboardList,
  MessageSquare, Sparkles, LogOut, Globe, Menu, ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { KubusMark } from "@/components/decor";
import { useAuth } from "@/context/AuthContext";
import { PORTAL } from "@/constants/testIds";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";

const CLIENT_SECTIONS = [
  {
    id: "main",
    label: null,
    items: [
      { to: "/portal/dashboard", end: true, icon: LayoutDashboard, label: "Dashboard", testid: "client-nav-dashboard" },
    ],
  },
  {
    id: "proyek",
    label: "Proyek",
    items: [
      { to: "/portal/projects", icon: FolderKanban, label: "Proyek Saya", testid: "client-nav-my-projects" },
      { to: "/portal/invoices", icon: Receipt, label: "Invoice", testid: "client-nav-invoices" },
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    items: [
      { to: "/portal/assessments", icon: ClipboardList, label: "Assessment", testid: "client-nav-assessment" },
    ],
  },
  {
    id: "komunikasi",
    label: "Komunikasi",
    items: [
      { to: "/portal/messages", icon: MessageSquare, label: "Pesan", testid: "client-nav-messages" },
      { to: "/portal/assistant", icon: Sparkles, label: "AI Assistant", testid: "client-nav-ai-assistant" },
    ],
  },
];

function NavItem({ to, end, icon: Icon, label, testid, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
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
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--kti-teal)]"
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

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-5" data-testid={PORTAL.sidebar}>
      {CLIENT_SECTIONS.map((s) => (
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
    </nav>
  );
}

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

  return (
    <div className="min-h-screen text-[color:var(--kti-text-strong)]" style={{ background: "var(--kti-space-975, #03040A)" }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.08] bg-[rgba(11,13,23,0.65)] backdrop-blur-xl lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
          <KubusMark height={26} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Kubus</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--kti-teal)]">Client Portal</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </div>

        {/* User strip */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[rgba(115,209,173,0.4)] bg-[rgba(115,209,173,0.12)] text-[10px] font-bold text-[color:var(--kti-teal)]">
              {(user?.name || "C").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[10px] text-[color:var(--kti-text-faint)]">{user?.email}</p>
            </div>
            <button
              onClick={doLogout}
              data-testid={PORTAL.logoutButton}
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
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="kti-focus grid size-9 place-items-center rounded-lg border border-white/10 lg:hidden"
                  data-testid={PORTAL.mobileMenuButton}
                  aria-label="Menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto border-white/10 p-0" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
                  <KubusMark height={24} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--kti-teal)]">Client Portal</span>
                </div>
                <div className="px-3 py-4">
                  <NavList onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] sm:inline">
              Client Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch scope="portal" className="hidden md:inline-flex" />
            <NotificationBell />
            <button
              onClick={toggleLang}
              className="kti-focus flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.06]"
            >
              <Globe className="size-3.5" style={{ color: "var(--kti-teal)" }} />
              {isEN ? "EN" : "ID"}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight text-white">{user?.name}</p>
              <p className="text-[10px] leading-tight text-[color:var(--kti-text-faint)]">{user?.email}</p>
            </div>
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
