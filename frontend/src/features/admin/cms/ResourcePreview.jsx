/**
 * ResourcePreview — per-type visual preview rendered inside the CMS edit dialog.
 * Shows a realistic card/tile of how the content will look on the public site.
 */
import { useTranslation } from "react-i18next";
import { ExternalLink, Eye } from "lucide-react";

// Map resource key → public URL builder
const PUBLIC_URL = {
  services:  (item) => item.slug ? `/services/${item.slug}` : "/services",
  cases:     (item) => item.slug ? `/cases/${item.slug}` : "/cases",
  blog:      (item) => item.slug ? `/blog/${item.slug}` : "/blog",
  careers:   (item) => item.slug ? `/career/${item.slug}` : "/career",
  resources: (item) => item.slug ? `/resources/${item.slug}` : "/resources",
  faq:       () => "/faq",
  packages:  () => "/pricing",
  legal:     (item) => item.slug ? `/${item.slug}` : "/privacy-policy",
  team:      () => "/team",
  tech:      () => "/tech",
  clients:   () => "/",
  testimonials: () => "/",
  "home-blocks": () => "/",
};

function bil(v, lang) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return lang.startsWith("en") ? (v.en || v.id || "") : (v.id || v.en || "");
}

function Tag({ children }) {
  return (
    <span className="inline-block rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-white/60">
      {children}
    </span>
  );
}

function CardShell({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      {children}
    </div>
  );
}

// ── Per-type previews ────────────────────────────────────────────────────────

function ServicePreview({ form, lang }) {
  return (
    <CardShell>
      {form.image_url && (
        <div className="aspect-video overflow-hidden">
          <img src={form.image_url} alt="" className="h-full w-full object-cover opacity-80" />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          {form.category && <Tag>{bil(form.category, lang)}</Tag>}
          <Tag>{form.status || "draft"}</Tag>
        </div>
        <h3 className="font-display text-lg font-semibold text-white">{bil(form.title, lang) || "—"}</h3>
        <p className="mt-2 text-sm text-white/60 line-clamp-3">{bil(form.excerpt, lang) || bil(form.summary, lang) || ""}</p>
      </div>
    </CardShell>
  );
}

function CasePreview({ form, lang }) {
  return (
    <CardShell>
      {form.cover_image_url && (
        <div className="aspect-video overflow-hidden">
          <img src={form.cover_image_url} alt="" className="h-full w-full object-cover opacity-80" />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          {form.industry && <Tag>{bil(form.industry, lang)}</Tag>}
          {form.tags?.slice(0,2).map(t => <Tag key={t}>{t}</Tag>)}
        </div>
        <h3 className="font-display text-lg font-semibold text-white">{bil(form.title, lang) || "—"}</h3>
        <p className="mt-2 text-sm text-white/60 line-clamp-3">{bil(form.excerpt, lang) || ""}</p>
        {form.result && <p className="mt-3 text-sm font-semibold" style={{color:"#2DE2B6"}}>{bil(form.result, lang)}</p>}
      </div>
    </CardShell>
  );
}

function TeamPreview({ form, lang }) {
  return (
    <CardShell>
      <div className="flex items-start gap-4 p-5">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt="" className="size-16 rounded-full object-cover border border-white/20" />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-white/10 text-2xl">
            {(bil(form.name, lang) || "?")[0]}
          </div>
        )}
        <div>
          <p className="font-display text-base font-semibold text-white">{bil(form.name, lang) || "—"}</p>
          <p className="text-sm" style={{color:"#7C68E1"}}>{bil(form.role, lang) || ""}</p>
          <p className="mt-2 text-xs text-white/50 line-clamp-3">{bil(form.bio, lang) || ""}</p>
        </div>
      </div>
    </CardShell>
  );
}

function BlogPreview({ form, lang }) {
  return (
    <CardShell>
      {form.cover && (
        <div className="aspect-video overflow-hidden bg-white/5 flex items-center justify-center">
          <span className="text-xs text-white/30">cover: {form.cover}</span>
        </div>
      )}
      <div className="p-5">
        {form.category && <Tag>{form.category}</Tag>}
        <h3 className="font-display mt-3 text-lg font-semibold text-white">{bil(form.title, lang) || "—"}</h3>
        <p className="mt-2 text-sm text-white/60 line-clamp-3">{bil(form.excerpt, lang) || ""}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
          {form.author && <span>✍ {form.author}</span>}
          {form.read_time && <span>⏱ {form.read_time} min</span>}
          {form.published_at && <span>{new Date(form.published_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </CardShell>
  );
}

function FaqPreview({ form, lang }) {
  const style = form.question?._style || {};
  const color = { violet:"#7C68E1", teal:"#2DE2B6", amber:"#F5BE6C", coral:"#FF6B8A", white:"rgba(255,255,255,.9)" }[style.color] || "rgba(255,255,255,.9)";
  return (
    <CardShell>
      <div className="p-5">
        {form.category && <Tag>{bil(form.category, lang)}</Tag>}
        <p className="mt-3 font-semibold text-sm" style={{color}}>{bil(form.question, lang) || "—"}</p>
        <p className="mt-2 text-sm text-white/60">{bil(form.answer, lang) || ""}</p>
      </div>
    </CardShell>
  );
}

function PackagePreview({ form, lang }) {
  const features = Array.isArray(form.features) ? form.features : [];
  return (
    <CardShell>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-white">{bil(form.name, lang) || "—"}</p>
          {form.tier && <Tag>{form.tier}</Tag>}
        </div>
        {form.price_from && (
          <p className="mt-1 text-2xl font-semibold" style={{color:"#7C68E1"}}>Rp {Number(form.price_from).toLocaleString("id-ID")}</p>
        )}
        <p className="mt-2 text-sm text-white/60">{bil(form.description, lang) || ""}</p>
        {features.length > 0 && (
          <ul className="mt-3 space-y-1">
            {features.slice(0,4).map((f,i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                <span style={{color:"#2DE2B6"}}>✓</span> {bil(f, lang)}
              </li>
            ))}
            {features.length > 4 && <li className="text-xs text-white/30">+ {features.length - 4} more</li>}
          </ul>
        )}
      </div>
    </CardShell>
  );
}

function TestimonialPreview({ form, lang }) {
  const style = form.quote?._style || {};
  const color = { violet:"#7C68E1", teal:"#2DE2B6", amber:"#F5BE6C", coral:"#FF6B8A", white:"rgba(255,255,255,.9)" }[style.color];
  return (
    <CardShell>
      <div className="p-5">
        <p className="text-2xl" style={{color:"#7C68E1"}}>"</p>
        <p className="text-sm text-white/80 italic" style={color ? {color} : {}}>{bil(form.quote, lang) || "—"}</p>
        <div className="mt-4 flex items-center gap-3">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-white/10 text-base">
              {(form.author_name || "?")[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{form.author_name || "—"}</p>
            <p className="text-xs text-white/50">{form.author_role || ""}{form.company ? ` · ${form.company}` : ""}</p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function HomeSectionPreview({ form, lang }) {
  const style = form.title?._style || form.eyebrow?._style || {};
  const color = { violet:"#7C68E1", teal:"#2DE2B6", amber:"#F5BE6C", coral:"#FF6B8A", white:"rgba(255,255,255,.9)" }[style.color] || "rgba(255,255,255,.9)";
  return (
    <CardShell>
      <div className="p-5 text-center">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">{bil(form.eyebrow, lang) || form.key || "—"}</p>
        <h3 className="font-display text-xl font-bold" style={{color}}>{bil(form.title, lang) || "—"}</h3>
        <p className="mt-2 text-sm text-white/50">{bil(form.subtitle, lang) || ""}</p>
      </div>
    </CardShell>
  );
}

function GenericPreview({ form, lang, resource }) {
  const titleFields = ["title", "name", "question", "label", "key"];
  const descFields  = ["excerpt", "description", "bio", "summary", "answer", "subtitle"];
  const titleField  = titleFields.find(f => form[f]);
  const descField   = descFields.find(f => form[f]);
  return (
    <CardShell>
      <div className="p-5">
        <Tag>{resource}</Tag>
        {titleField && <p className="mt-3 font-display text-base font-semibold text-white">{bil(form[titleField], lang) || "—"}</p>}
        {descField  && <p className="mt-2 text-sm text-white/60 line-clamp-4">{bil(form[descField], lang) || ""}</p>}
      </div>
    </CardShell>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

const PREVIEW_MAP = {
  services:     ServicePreview,
  cases:        CasePreview,
  team:         TeamPreview,
  blog:         BlogPreview,
  faq:          FaqPreview,
  packages:     PackagePreview,
  testimonials: TestimonialPreview,
  "home-blocks": HomeSectionPreview,
};

export default function ResourcePreview({ resource, form, lang }) {
  const { t } = useTranslation();
  const Preview = PREVIEW_MAP[resource] || GenericPreview;
  const urlBuilder = PUBLIC_URL[resource];
  const publicUrl = urlBuilder ? urlBuilder(form) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Eye className="size-3.5" />
          <span>Preview</span>
        </div>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kti-focus inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="size-3.5" />
            {t("cms.openLivePage") || "Lihat di halaman"}
          </a>
        )}
      </div>

      <Preview form={form || {}} lang={lang} resource={resource} />

      <p className="text-[10px] text-white/25 text-center">
        Preview ini bersifat representatif. Tampilan final mungkin berbeda.
      </p>
    </div>
  );
}
