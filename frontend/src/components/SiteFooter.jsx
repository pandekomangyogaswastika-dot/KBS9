import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Linkedin, Instagram, Twitter, Github, Mail, Phone, MapPin } from "lucide-react";
import { KubusMark } from "@/components/decor";
import { useContentLocale } from "@/lib/useContentLocale";

export default function SiteFooter({ settings }) {
  const { t } = useTranslation();
  const { L } = useContentLocale();
  const contact = settings?.contact || {};
  const year = new Date().getFullYear();

  const explore = [["services", "/services"], ["cases", "/cases"], ["tech", "/tech"], ["team", "/team"]];
  const company = [["blog", "/blog"], ["career", "/career"], ["contact", "/contact"]];
  // Phase 19: New footer links
  const resources = [["faq", "/faq"], ["pricing", "/pricing"], ["about", "/about"], ["resources", "/resources"]];
  const legal = [["privacy", "/privacy-policy"], ["terms", "/terms-of-service"]];

  return (
    <footer className="relative overflow-hidden border-t border-white/10" style={{ background: "#070811" }} data-testid="site-footer">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(1000px 360px at 50% 0%, #7C68E1, transparent 70%)" }} />
      <div className="kti-container relative py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <KubusMark height={40} logoUrl={settings?.logo_url} />
            <p className="mt-4 kti-text-dim text-sm max-w-xs">{L(settings?.tagline) || t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="font-mono-kti text-xs uppercase tracking-[0.3em] kti-text-dim mb-4">{t("footer.explore")}</h4>
            <ul className="space-y-2.5">
              {explore.map(([k, p]) => (
                <li key={k}><Link to={p} data-testid={`footer-${k}`} className="text-sm kti-text-dim hover:text-white transition-colors">{t(`nav.${k}`)}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono-kti text-xs uppercase tracking-[0.3em] kti-text-dim mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2.5">
              {company.map(([k, p]) => (
                <li key={k}><Link to={p} data-testid={`footer-${k}`} className="text-sm kti-text-dim hover:text-white transition-colors">{t(`nav.${k}`)}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono-kti text-xs uppercase tracking-[0.3em] kti-text-dim mb-4">{t("footer.resources")}</h4>
            <ul className="space-y-2.5">
              {resources.map(([k, p]) => (
                <li key={k}><Link to={p} data-testid={`footer-${k}`} className="text-sm kti-text-dim hover:text-white transition-colors">{t(`nav.${k}`)}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono-kti text-xs uppercase tracking-[0.3em] kti-text-dim mb-4">{t("footer.connect")}</h4>
            <ul className="space-y-2.5 text-sm kti-text-dim">
              {contact.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" style={{ color: "#73D1AD" }} />{contact.email}</li>}
              {contact.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: "#73D1AD" }} />{contact.phone}</li>}
              {contact.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: "#73D1AD" }} />{L(contact.address)}</li>}
            </ul>
            <div className="mt-4 flex items-center gap-3">
              {[[Linkedin, "linkedin"], [Instagram, "instagram"], [Twitter, "twitter"], [Github, "github"]].map(([Icon, key]) => (
                <a key={key} href={contact.social?.[key] || "#"} data-testid={`footer-social-${key}`} aria-label={key} className="kti-focus grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-xs kti-text-dim">© {year} Kubus Teknologi Indonesia. {t("footer.rights")}</p>
          <div className="flex items-center gap-4">
            {legal.map(([k, p]) => (
              <Link key={k} to={p} data-testid={`footer-${k}`} className="text-xs kti-text-dim hover:text-white transition-colors">{t(`nav.${k}`)}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
