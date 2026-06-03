import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2, Building2, Users, UserCog } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/apiClient";
import { LOGIN } from "@/constants/testIds";

const ROLE_HINTS = [
  {
    value: "client",
    label: "Client",
    icon: Building2,
    helper: "Akses proyek, invoice, assessment, dan komunikasi",
    accentClass: "border-[rgba(115,209,173,0.55)] bg-[rgba(115,209,173,0.12)] text-[color:var(--kti-teal)]",
    inactiveClass: "border-white/[0.08] bg-transparent text-[color:var(--kti-text-dim)] hover:border-white/20 hover:text-white",
    testid: "login-role-tab-client",
  },
  {
    value: "staff",
    label: "Staff",
    icon: Users,
    helper: "Kelola delivery, konten, dan komunikasi klien",
    accentClass: "border-[rgba(124,104,225,0.55)] bg-[rgba(124,104,225,0.12)] text-[color:var(--kti-indigo)]",
    inactiveClass: "border-white/[0.08] bg-transparent text-[color:var(--kti-text-dim)] hover:border-white/20 hover:text-white",
    testid: "login-role-tab-staff",
  },
  {
    value: "admin",
    label: "Admin",
    icon: UserCog,
    helper: "Akses penuh: CRM, system, dan seluruh CMS",
    accentClass: "border-[rgba(124,104,225,0.55)] bg-[rgba(124,104,225,0.12)] text-[color:var(--kti-indigo)]",
    inactiveClass: "border-white/[0.08] bg-transparent text-[color:var(--kti-text-dim)] hover:border-white/20 hover:text-white",
    testid: "login-role-tab-admin",
  },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roleHint, setRoleHint] = useState(() => {
    return localStorage.getItem("kti.login.roleHint") || "client";
  });

  const activeRole = ROLE_HINTS.find((r) => r.value === roleHint) || ROLE_HINTS[0];

  const redirectByRole = (u) => {
    if (u.role === "admin" || u.role === "staff") navigate("/portal/admin", { replace: true });
    else if (u.role === "client") navigate("/portal/dashboard", { replace: true });
    else navigate("/portal/coming-soon", { replace: true });
  };

  useEffect(() => {
    if (ready && user) redirectByRole(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const selectRole = (val) => {
    setRoleHint(val);
    localStorage.setItem("kti.login.roleHint", val);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Selamat datang, ${u.name}`);
      redirectByRole(u);
    } catch (err) {
      toast.error(apiError(err, t("auth.invalid")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--kti-space-975, #03040A)" }}
    >
      {/* Aurora bg */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,104,225,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(115,209,173,0.5) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          data-testid="login-back-home"
          className="kti-focus mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" /> Kembali ke website
        </button>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.05] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Header */}
          <div className="mb-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--kti-text-faint)]">
              Kubus Teknologi Indonesia
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Masuk ke Portal</h1>
            <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">
              Satu akun untuk semua layanan KTI
            </p>
          </div>

          {/* Role hint tabs */}
          <div className="mb-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kti-text-faint)]">
              Saya masuk sebagai
            </p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pilih tipe akun">
              {ROLE_HINTS.map((r) => {
                const Icon = r.icon;
                const active = roleHint === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => selectRole(r.value)}
                    data-testid={r.testid}
                    className={`kti-focus flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                      active ? r.accentClass : r.inactiveClass
                    }`}
                  >
                    <Icon className="size-4" />
                    {r.label}
                  </button>
                );
              })}
            </div>
            {/* Helper text */}
            <p
              className="mt-2.5 min-h-[18px] text-xs text-[color:var(--kti-text-faint)] transition-opacity"
              data-testid="login-role-helper"
            >
              {activeRole.helper}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4" data-testid="login-form">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[color:var(--kti-text-dim)]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                data-testid={LOGIN.emailInput}
                autoComplete="email"
                className="kti-focus w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 transition-colors focus:border-[rgba(124,104,225,0.45)] focus:bg-white/[0.06]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[color:var(--kti-text-dim)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid={LOGIN.passwordInput}
                  autoComplete="current-password"
                  className="kti-focus w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 transition-colors focus:border-[rgba(124,104,225,0.45)] focus:bg-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label="Toggle password visibility"
                  className="kti-focus absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-lg text-white/40 transition-colors hover:text-white"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              data-testid={LOGIN.submitButton}
              className="kti-focus mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-60"
            >
              {busy ? (
                <><Loader2 className="size-4 animate-spin" /> Sedang masuk...</>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-[color:var(--kti-text-faint)]">
          Portal khusus klien & tim internal KTI.
          <br />
          Butuh akses? Hubungi tim kami.
        </p>
      </div>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
