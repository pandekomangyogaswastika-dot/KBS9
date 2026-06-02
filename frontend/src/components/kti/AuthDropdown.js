import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, ShieldCheck, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * AuthDropdown — Dropdown navigasi login dengan dua opsi:
 *   - Client Login (portal klien)
 *   - Staff Login (portal staff/admin)
 *
 * Dipakai di navbar publik untuk memberi entry point auth yang jelas.
 */
export const AuthDropdown = ({ compact = false }) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="nav-auth-dropdown"
          aria-label={t("nav.login")}
          className="kti-focus inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-[13px] font-medium text-white hover:bg-white/[0.1] hover:border-white/20 transition-colors"
        >
          <LogIn className="size-4" style={{ color: "var(--kti-teal)" }} />
          {!compact && <span>{t("nav.login")}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[200] min-w-[220px] rounded-2xl border border-white/12 bg-[rgba(8,9,16,0.92)] p-2 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        data-testid="nav-auth-dropdown-menu"
      >
        <DropdownMenuLabel className="px-3 pt-1.5 pb-1 text-[10px] font-hud uppercase tracking-[0.22em] text-[color:var(--kti-text-faint)]">
          {t("nav.login")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10 mb-1" />
        <DropdownMenuItem asChild>
          <Link
            to="/portal/login?role=client"
            data-testid="nav-client-login"
            className="kti-focus group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-white/[0.08] focus:bg-white/[0.08] cursor-pointer"
          >
            <span
              className="mt-0.5 grid size-8 place-items-center rounded-full"
              style={{
                background: "rgba(115, 209, 173, 0.16)",
                border: "1px solid rgba(115, 209, 173, 0.4)",
              }}
            >
              <User className="size-4" style={{ color: "var(--kti-teal)" }} />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{t("nav.clientLogin")}</span>
              <span className="text-[11px] text-[color:var(--kti-text-dim)]">
                Portal Klien · Project & Invoice
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/portal/login?role=staff"
            data-testid="nav-staff-login"
            className="kti-focus group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-white/[0.08] focus:bg-white/[0.08] cursor-pointer"
          >
            <span
              className="mt-0.5 grid size-8 place-items-center rounded-full"
              style={{
                background: "rgba(124, 104, 225, 0.16)",
                border: "1px solid rgba(124, 104, 225, 0.4)",
              }}
            >
              <ShieldCheck className="size-4" style={{ color: "var(--kti-indigo)" }} />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{t("nav.staffLogin")}</span>
              <span className="text-[11px] text-[color:var(--kti-text-dim)]">
                Admin / Staff Portal
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthDropdown;
