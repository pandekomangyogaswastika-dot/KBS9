import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { useContentLocale } from "@/lib/useContentLocale";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/features/public/blocks/ContactForm";
import { DotBadge } from "@/components/kti/DotBadge";
import SEOHead from "@/components/SEOHead";

const GLASS =
  "rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

export default function ContactPage() {
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const { data: settings } = useFetch("/settings");
  const contact = settings?.contact || {};

  return (
    <div data-testid="contact-page">
      <SEOHead
        title={t("nav.contact")}
        description="Hubungi Kubus Teknologi Indonesia untuk konsultasi teknologi, demo produk, atau diskusi kebutuhan transformasi digital bisnis Anda. Tim kami siap membantu."
        type="website"
      />
      <PageHeader eyebrow={t("sections.mission")} title={t("nav.contact")} intro={t("pages.contactIntro")} />
      <div className="kti-container pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className={`lg:col-span-3 ${GLASS} p-6 sm:p-8`}>
            <ContactForm source="contact_page" />
          </div>
          <div className={`lg:col-span-2 ${GLASS} p-6 sm:p-8`}>
            <DotBadge className="mb-6">{t("contact.infoTitle")}</DotBadge>
            <ul className="space-y-4 text-sm text-[color:var(--kti-text-strong)]">
              {contact.email && <li className="flex items-center gap-3"><Mail className="h-5 w-5" style={{ color: "#73D1AD" }} />{contact.email}</li>}
              {contact.phone && <li className="flex items-center gap-3"><Phone className="h-5 w-5" style={{ color: "#73D1AD" }} />{contact.phone}</li>}
              {contact.address && <li className="flex items-center gap-3"><MapPin className="h-5 w-5" style={{ color: "#73D1AD" }} />{L(contact.address)}</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
