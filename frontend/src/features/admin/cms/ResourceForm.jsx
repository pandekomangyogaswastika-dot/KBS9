import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Edit3, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import FieldInput from "@/features/admin/cms/FieldInput";
import ResourcePreview from "@/features/admin/cms/ResourcePreview";
import { fieldLabel } from "@/features/admin/cms/schemas";
import { getPath, setPath } from "@/features/admin/cms/objectPath";

const tag = "mb-1 block text-xs font-medium text-[color:var(--kti-text-dim)]";

export default function ResourceForm({ fields, initial, onSubmit, busy, showStatus = true, submitLabel, resource }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "id";
  const [form, setForm] = useState(() => initial || {});
  const [tab, setTab] = useState("edit"); // used only on mobile (<lg)
  const update = (path, val) => setForm((f) => setPath(f, path, val));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Edit form content (shared between mobile-tab and desktop-split)
  const editContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
            <label className={tag}>{fieldLabel(f, i18n.language)}{f.required ? " *" : ""}</label>
            {f.hint && (
              <p className="mb-1.5 text-[11px] text-white/35">
                {typeof f.hint === "string" ? f.hint : (i18n.language.startsWith("en") ? f.hint.en : f.hint.id)}
              </p>
            )}
            <FieldInput field={f} value={getPath(form, f.name)} onChange={(v) => update(f.name, v)} />
          </div>
        ))}
      </div>

      {showStatus && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-sm text-white">{t("cms.published")}</span>
          <Switch checked={form.status === "published"} onCheckedChange={(v) => update("status", v ? "published" : "draft")} data-testid="cms-status-switch" />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={busy} data-testid="cms-save-button"
          className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />} {submitLabel || t("cms.save")}
        </button>
      </div>
    </form>
  );

  // Preview panel content (shared)
  const previewContent = (
    <div className="space-y-4">
      <ResourcePreview resource={resource} form={form} lang={lang} />
      {/* Save button on preview-only (mobile) mode */}
      <div className="flex justify-end">
        <button type="button" onClick={() => onSubmit(form)} disabled={busy}
          data-testid="cms-save-button"
          className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)] disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />} {submitLabel || t("cms.save")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Mobile tab bar — hidden on large screens where side-by-side is used */}
      <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`kti-focus flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "edit" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Edit3 className="size-3.5" />
          {t("cms.editTab") || "Edit"}
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`kti-focus flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "preview" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Eye className="size-3.5" />
          {t("cms.previewTab") || "Preview"}
        </button>
      </div>

      {/* Mobile: show only active tab */}
      <div className="lg:hidden">
        {tab === "edit" ? editContent : previewContent}
      </div>

      {/* Desktop: side-by-side split view */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6">
        {/* Left: Edit form */}
        <div className="min-h-0">
          <div className="mb-2 flex items-center gap-1.5">
            <Edit3 className="size-3.5 text-white/50" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {t("cms.editTab") || "Edit"}
            </span>
          </div>
          {editContent}
        </div>

        {/* Right: Preview (sticky) */}
        <div className="min-h-0">
          <div className="mb-2 flex items-center gap-1.5">
            <Eye className="size-3.5 text-white/50" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {t("cms.previewTab") || "Preview"}
            </span>
          </div>
          <div className="sticky top-4 overflow-y-auto max-h-[70vh] rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ResourcePreview resource={resource} form={form} lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
