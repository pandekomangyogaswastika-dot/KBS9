import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Globe, ArrowRight, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KubusMark } from "@/components/decor";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AuthDropdown } from "@/components/kti/AuthDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookingWidget } from "@/components/BookingWidget";

// --- Cleaned-up nav: removed Teknologi, Tim, Karier, Kontak (redundant/navigable via home) ---
const NAV = [
  ["services", "/services"],
  ["portfolio", "/portfolio"],
  ["products", "/products"],
  ["blog", "/blog"],
];

// Mobile-only secondary links (useful for discoverability)
const NAV_SECONDARY = [
  ["tech", "/tech"],
  ["team", "/team"],
  ["career", "/career"],
];

const Dot = ({ active }) =>
  active ? (
    <span
      className="size-1.5 rounded-full"
      style={{
        background: "var(--kti-teal)",
        boxShadow: "0 0 8px var(--kti-teal)",
      }}
    />
  ) : null;

export const FloatingPillNavbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY;
      const lastScroll = lastScrollRef.current;
      setScrolled(currentScroll > 24);
      if (currentScroll > 220 && currentScroll > lastScroll) {
        setCollapsed(true);
      } else if (currentScroll < lastScroll - 4 || currentScroll <= 100) {
        setCollapsed(false);
      }
      lastScrollRef.current = currentScroll;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isEN = i18n.language && i18n.language.startsWith("en");
  const toggleLang = () => {
    const next = isEN ? "id" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("kti_locale", next);
  };

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navCls = (active) =>
    `kti-focus relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors duration-200 ${
      active
        ? "bg-white/[0.08] text-white border border-white/[0.12]"
        : "text-[color:var(--kti-text-dim)] hover:text-white border border-transparent"
    }`;

  const showFull = !collapsed || hovering;

  return (
    <>
      <header
        data-testid="floating-pill-header"
        className="fixed inset-x-0 flex justify-center px-3 transition-[top,opacity,transform] duration-300 ease-out"
        style={{
          zIndex: "var(--z-nav)",
          top: "12px",
          opacity: 1,
          transform: showFull ? "translateY(0)" : "translateY(-4px)",
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <nav
          data-testid="floating-pill-navbar"
          data-state={showFull ? "full" : "collapsed"}
          className={`flex items-center gap-2 rounded-full border backdrop-blur-xl transition-all duration-300 ease-out ${
            showFull
              ? "w-[min(1100px,100%)] justify-between px-2.5 py-2"
              : "w-auto justify-center px-3 py-1.5"
          } ${
            scrolled
              ? "border-white/[0.14] bg-[rgba(8,9,16,0.78)] shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
              : "border-white/10 bg-white/[0.05]"
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            data-testid="nav-home-logo"
            aria-label="Kubus home"
            className="kti-focus flex shrink-0 items-center rounded-full px-2 py-1"
          >
            <KubusMark height={showFull ? 30 : 24} />
          </Link>

          {/* Desktop nav links */}
          {showFull && (
            <div className="hidden lg:flex items-center gap-0.5">
              {/* Layanan */}
              <Link
                to="/services"
                data-testid="nav-services"
                className={navCls(isActive("/services"))}
              >
                <Dot active={isActive("/services")} />
                {t("nav.services")}
              </Link>

              {/* Portfolio dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="nav-portfolio"
                    className={navCls(
                      isActive("/portfolio") || isActive("/case-studies")
                    )}
                  >
                    <Dot
                      active={
                        isActive("/portfolio") || isActive("/case-studies")
                      }
                    />
                    {t("nav.portfolio")}
                    <ChevronDown className="size-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="rounded-2xl border border-white/10 bg-[#0B0D17] p-2 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] min-w-[220px]"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      to="/portfolio"
                      className="kti-focus rounded-xl px-3 py-2.5 text-sm text-white hover:bg-white/8 cursor-pointer"
                      data-testid="nav-portfolio-all"
                    >
                      {isEN ? "All Projects" : "Semua Proyek"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/case-studies"
                      className="kti-focus rounded-xl px-3 py-2.5 text-sm text-white hover:bg-white/8 cursor-pointer"
                      data-testid="nav-case-studies"
                    >
                      {isEN ? "Case Studies" : "Studi Kasus"}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Produk */}
              <Link
                to="/products"
                data-testid="nav-products"
                className={navCls(isActive("/products"))}
              >
                <Dot active={isActive("/products")} />
                {t("nav.products")}
              </Link>

              {/* Artikel */}
              <Link
                to="/blog"
                data-testid="nav-blog"
                className={navCls(isActive("/blog"))}
              >
                <Dot active={isActive("/blog")} />
                {t("nav.blog")}
              </Link>
            </div>
          )}

          {/* Right-side actions */}
          {showFull && (
            <div className="flex items-center gap-2">
              <GlobalSearch scope="public" className="hidden lg:inline-flex" />

              {/* Theme Toggle */}
              <ThemeToggle className="hidden md:flex" />

              <button
                onClick={toggleLang}
                data-testid="navbar-language-toggle"
                aria-label="Toggle language"
                className="kti-focus flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-[color:var(--kti-text-strong)] hover:bg-white/[0.06] transition-colors"
              >
                <Globe className="size-4" style={{ color: "var(--kti-teal)" }} />
                {isEN ? "EN" : "ID"}
              </button>

              <div className="hidden md:flex">
                <AuthDropdown />
              </div>

              {/* Konsultasi CTA — primary action, replaces Contact link */}
              <button
                onClick={() => setShowBooking(true)}
                data-testid="navbar-primary-cta-button"
                className="kti-focus hidden sm:inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.18)] px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-colors hover:bg-[rgba(124,104,225,0.28)]"
              >
                {t("nav.consultation")}
                <ArrowRight className="size-4" />
              </button>

              {/* Mobile hamburger */}
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="kti-focus lg:hidden grid size-10 place-items-center rounded-full border border-white/10 hover:bg-white/[0.06]"
                    data-testid="navbar-mobile-menu-button"
                    aria-label="Open menu"
                  >
                    <Menu className="size-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="border-white/10"
                  style={{ background: "#0B0D17", color: "#E8EAF2" }}
                >
                  <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                  <div className="mt-10 flex flex-col gap-1">
                    {/* Primary nav */}
                    {NAV.map(([key, path]) => (
                      <SheetClose asChild key={key}>
                        <Link
                          to={path}
                          data-testid={`nav-mobile-${key}`}
                          className={`rounded-xl px-3 py-3 text-base transition-colors ${
                            isActive(path)
                              ? "bg-white/[0.08] text-white"
                              : "hover:bg-white/[0.06]"
                          }`}
                        >
                          {t(`nav.${key}`)}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        to="/case-studies"
                        data-testid="nav-mobile-case-studies"
                        className={`rounded-xl px-3 py-3 text-base transition-colors ${
                          isActive("/case-studies")
                            ? "bg-white/[0.08] text-white"
                            : "hover:bg-white/[0.06]"
                        }`}
                      >
                        {t("nav.cases")}
                      </Link>
                    </SheetClose>

                    {/* Secondary nav — smaller separator */}
                    <div className="my-2 px-3">
                      <div className="h-px bg-white/[0.06]" />
                    </div>
                    {NAV_SECONDARY.map(([key, path]) => (
                      <SheetClose asChild key={key}>
                        <Link
                          to={path}
                          data-testid={`nav-mobile-${key}`}
                          className="rounded-xl px-3 py-2.5 text-sm text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          {t(`nav.${key}`)}
                        </Link>
                      </SheetClose>
                    ))}

                    {/* Login section */}
                    <div className="mt-3 mb-1 px-3 text-[10px] font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">
                      {t("nav.login")}
                    </div>
                    <SheetClose asChild>
                      <Link
                        to="/portal/login?role=client"
                        data-testid="nav-mobile-client-login"
                        className="rounded-xl border border-white/10 px-3 py-3 text-base hover:bg-white/[0.06]"
                      >
                        {t("nav.clientLogin")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/portal/login?role=staff"
                        data-testid="nav-mobile-staff-login"
                        className="rounded-xl border border-white/10 px-3 py-3 text-base hover:bg-white/[0.06]"
                      >
                        {t("nav.staffLogin")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => setShowBooking(true)}
                        data-testid="nav-mobile-cta"
                        className="mt-2 inline-flex w-full items-center justify-between rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.18)] px-4 py-3 text-base font-semibold text-white"
                      >
                        {t("nav.consultation")}
                        <ArrowRight className="size-4" />
                      </button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Collapsed state hint */}
          {!showFull && (
            <span className="ml-2 text-[11px] font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)] hidden sm:inline">
              Menu
            </span>
          )}
        </nav>
      </header>

      {/* Booking Widget */}
      <BookingWidget isOpen={showBooking} onClose={() => setShowBooking(false)} />
    </>
  );
};
