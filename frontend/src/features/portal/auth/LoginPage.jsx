import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/apiClient";
import { LOGIN } from "@/constants/testIds";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const redirectByRole = (u) => {
    if (u.role === "admin" || u.role === "staff") navigate("/portal/admin", { replace: true });
    else if (u.role === "client") navigate("/portal/dashboard", { replace: true });
    else navigate("/portal/coming-soon", { replace: true });
  };

  useEffect(() => {
    if (ready && user) redirectByRole(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`${t("admin.welcomeBack")}, ${u.name}`);
      redirectByRole(u);
    } catch (err) {
      toast.error(apiError(err, t("auth.invalid")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4" style={{ background: "var(--kti-space-950, #05060A)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--kti-aurora-accent)", opacity: 0.7 }}
      />
      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          data-testid="login-back-home"
          className="kti-focus mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--kti-text-dim)] hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" /> {t("auth.backHome")}
        </button>

        <div className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border border-white/15 bg-[rgba(124,104,225,0.18)]">
              <ShieldCheck className="size-5" style={{ color: "var(--kti-teal)" }} />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold text-white">{t("auth.loginTitle")}</h1>
              <p className="text-xs text-[color:var(--kti-text-dim)]">{t("auth.loginSubtitle")}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" data-testid="login-form">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPh")}
                data-testid={LOGIN.emailInput}
                className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]">{t("auth.password")}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPh")}
                  data-testid={LOGIN.passwordInput}
                  className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={t("auth.showPassword")}
                  className="kti-focus absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-lg text-white/50 hover:text-white"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              data-testid={LOGIN.submitButton}
              className="kti-focus mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.22)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--kti-glow-indigo)] transition-colors hover:bg-[rgba(124,104,225,0.32)] disabled:opacity-60"
            >
              {busy ? <><Loader2 className="size-4 animate-spin" /> {t("auth.signingIn")}</> : t("auth.submit")}
            </button>
          </form>
        </div>
      </div>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
