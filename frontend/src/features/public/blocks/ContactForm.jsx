import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function ContactForm({ source = "contact_form" }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = t("contact.required");
    if (!EMAIL_RE.test(form.email.trim())) er.email = t("contact.required");
    if (!form.message.trim()) er.message = t("contact.required");
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    try {
      await api.post("/leads", { ...form, source });
      toast.success(t("contact.successTitle"), { description: t("contact.successMsg") });
      setForm({ name: "", email: "", company: "", phone: "", message: "" });
    } catch {
      toast.error(t("contact.errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm outline-none transition-colors kti-focus";
  const lbl = "mb-1.5 block text-xs font-medium kti-text-dim";

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="contact-form" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>{t("contact.name")} *</label>
          <input value={form.name} onChange={set("name")} placeholder={t("contact.namePh")} data-testid="contact-name-input" className={field} style={{ borderColor: errors.name ? "#FF5C7A" : "rgba(255,255,255,0.1)" }} />
          {errors.name && <p className="mt-1 text-xs" style={{ color: "#FF5C7A" }} data-testid="contact-name-error">{errors.name}</p>}
        </div>
        <div>
          <label className={lbl}>{t("contact.email")} *</label>
          <input value={form.email} onChange={set("email")} placeholder={t("contact.emailPh")} data-testid="contact-email-input" className={field} style={{ borderColor: errors.email ? "#FF5C7A" : "rgba(255,255,255,0.1)" }} />
          {errors.email && <p className="mt-1 text-xs" style={{ color: "#FF5C7A" }} data-testid="contact-email-error">{errors.email}</p>}
        </div>
        <div>
          <label className={lbl}>{t("contact.company")}</label>
          <input value={form.company} onChange={set("company")} placeholder={t("contact.companyPh")} data-testid="contact-company-input" className={field} style={{ borderColor: "rgba(255,255,255,0.1)" }} />
        </div>
        <div>
          <label className={lbl}>{t("contact.phone")}</label>
          <input value={form.phone} onChange={set("phone")} placeholder={t("contact.phonePh")} data-testid="contact-phone-input" className={field} style={{ borderColor: "rgba(255,255,255,0.1)" }} />
        </div>
      </div>
      <div>
        <label className={lbl}>{t("contact.message")} *</label>
        <textarea value={form.message} onChange={set("message")} rows={5} placeholder={t("contact.messagePh")} data-testid="contact-message-input" className={`${field} resize-none`} style={{ borderColor: errors.message ? "#FF5C7A" : "rgba(255,255,255,0.1)" }} />
        {errors.message && <p className="mt-1 text-xs" style={{ color: "#FF5C7A" }} data-testid="contact-message-error">{errors.message}</p>}
      </div>
      <button type="submit" disabled={loading} data-testid="contact-form-submit-button" className="kti-focus inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-[color:var(--kti-space-950)] transition-shadow disabled:opacity-60" style={{ background: "#7C68E1", boxShadow: "0 12px 34px rgba(124,104,225,0.26)" }}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? t("contact.sending") : t("contact.submit")}
      </button>
      <p className="text-xs text-center" style={{ color: "var(--kti-text-faint)" }} data-testid="contact-privacy-notice">
        {t("footer.privacyNotice")}{" "}
        <Link to="/privacy-policy" className="underline hover:text-white transition-colors" style={{ color: "var(--kti-text-dim)" }}>
          {t("footer.privacyLink")}
        </Link>{" "}
        {t("footer.privacyAnd")}{" "}
        <Link to="/terms-of-service" className="underline hover:text-white transition-colors" style={{ color: "var(--kti-text-dim)" }}>
          {t("footer.termsLink")}
        </Link>.
      </p>
    </form>
  );
}
