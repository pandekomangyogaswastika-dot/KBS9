import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText, Save, RefreshCw, Eye, ChevronDown, ChevronUp,
  Loader2, Sliders, Palette, Type, Layout, ToggleLeft,
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DEFAULTS = {
  company_name: "KUBUS TEKNOLOGI INDONESIA",
  company_tagline: "IT Solutions & Digital Transformation",
  logo_url: "",
  brand_color: "#5B49C9",
  accent_color: "#1D7874",
  footer_text: "Dokumen ini bersifat rahasia dan hanya untuk penerima yang dituju",
  show_empty_domains: false,
  show_notes: true,
  show_scoring: true,
  show_cover: true,
  show_summary: true,
  show_attachments: true,
};

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-[#7C68E1]" />}
          {title}
        </span>
        {open ? <ChevronUp className="size-4 text-white/40" /> : <ChevronDown className="size-4 text-white/40" />}
      </button>
      {open && (
        <div className="border-t border-white/[0.06] px-5 py-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/30">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[rgba(124,104,225,0.5)] focus:outline-none focus:ring-1 focus:ring-[rgba(124,104,225,0.3)]"
    />
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || "#5B49C9"}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
      />
      <TextInput value={value} onChange={onChange} placeholder="#5B49C9" />
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-white/80">{label}</p>
        {hint && <p className="text-[11px] text-white/30 mt-0.5">{hint}</p>}
      </div>
      <Switch checked={!!checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

// Session selector modal
function SessionPicker({ sessions, selected, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111422] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-bold text-white">Pilih Sesi untuk Preview</h3>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {sessions.length === 0 && <p className="text-sm text-white/40">Belum ada sesi assessment.</p>}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s); onClose(); }}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected?.id === s.id ? "border-[rgba(124,104,225,0.6)] bg-[rgba(124,104,225,0.12)] text-white" : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.07]"}`}
            >
              <div className="font-semibold">{s.client_name || "—"}</div>
              <div className="text-[11px] text-white/40">{s.project_name || s.id.slice(0, 12)} · {s.status}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-white/50 hover:bg-white/[0.05]">Tutup</button>
      </div>
    </div>
  );
}

export default function PDFSettingsPage() {
  const [config, setConfig] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const prevBlobRef = useRef(null);

  // Fetch config + sessions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [cfgRes, sessRes] = await Promise.all([
          api.get("/admin/pdf-config"),
          api.get("/assessment/sessions"),
        ]);
        setConfig({ ...DEFAULTS, ...(cfgRes.data?.data || {}) });
        const sess = sessRes.data?.data || [];
        setSessions(sess);
        if (sess.length > 0) setSelectedSession(sess[0]);
      } catch (err) {
        toast.error(apiError(err, "Gagal memuat konfigurasi"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setField = useCallback((key) => (val) => setConfig((c) => ({ ...c, [key]: val })), []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/admin/pdf-config", { data: config });
      setConfig({ ...DEFAULTS, ...(res.data?.data || {}) });
      toast.success("Konfigurasi PDF disimpan");
    } catch (err) {
      toast.error(apiError(err, "Gagal menyimpan"));
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    // Revoke old blob
    if (prevBlobRef.current) { URL.revokeObjectURL(prevBlobRef.current); prevBlobRef.current = null; }
    try {
      const params = selectedSession?.id ? `?session_id=${selectedSession.id}&locale=id` : "?locale=id";
      const res = await api.get(`/admin/pdf-config/preview${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      prevBlobRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      toast.error(apiError(err, "Gagal generate preview PDF"));
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-[#7C68E1]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Konfigurasi PDF</h1>
          <p className="mt-1 text-sm text-white/40">Atur tampilan laporan PDF assessment — cover, branding, domain, dan skor.</p>
        </div>
        <button
          data-testid="btn-save-pdf-config"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#7C68E1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B58CF] disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* ── Settings Column (left 3/5) ─────────────────────────────────── */}
        <div className="space-y-4 xl:col-span-3">
          {/* Branding */}
          <Section title="Branding & Identitas" icon={Palette}>
            <Field label="Nama Perusahaan" hint="Ditampilkan di cover dan footer PDF">
              <TextInput value={config.company_name} onChange={setField("company_name")} placeholder="KUBUS TEKNOLOGI INDONESIA" />
            </Field>
            <Field label="Tagline Perusahaan">
              <TextInput value={config.company_tagline} onChange={setField("company_tagline")} placeholder="IT Solutions & Digital Transformation" />
            </Field>
            <Field label="URL Logo" hint="URL gambar logo (PNG/SVG, akan ditampilkan di cover)">
              <TextInput value={config.logo_url} onChange={setField("logo_url")} placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Warna Brand (Primer)">
                <ColorField value={config.brand_color} onChange={setField("brand_color")} />
              </Field>
              <Field label="Warna Aksen (Sekunder)">
                <ColorField value={config.accent_color} onChange={setField("accent_color")} />
              </Field>
            </div>
          </Section>

          {/* Layout toggles */}
          <Section title="Tampilan Halaman" icon={Layout}>
            <ToggleRow label="Halaman Cover" hint="Tampilkan cover penuh dengan logo, judul, dan info klien" checked={config.show_cover} onChange={setField("show_cover")} />
            <div className="h-px bg-white/[0.05]" />
            <ToggleRow label="Tabel Ringkasan" hint="Tampilkan tabel semua domain dan persentase penyelesaian" checked={config.show_summary} onChange={setField("show_summary")} />
            <div className="h-px bg-white/[0.05]" />
            <ToggleRow label="Domain Kosong" hint="Tampilkan domain yang belum ada jawaban sama sekali" checked={config.show_empty_domains} onChange={setField("show_empty_domains")} />
            <div className="h-px bg-white/[0.05]" />
            <ToggleRow label="Catatan Responden" hint="Tampilkan catatan tambahan per pertanyaan" checked={config.show_notes} onChange={setField("show_notes")} />
            <div className="h-px bg-white/[0.05]" />
            <ToggleRow label="Skor & Maturitas per Domain" hint="Hitung rata-rata skor dari pertanyaan skala (1–5) dan tampilkan level maturitas" checked={config.show_scoring} onChange={setField("show_scoring")} />
            <div className="h-px bg-white/[0.05]" />
            <ToggleRow label="Lampiran" hint="Tampilkan nama file lampiran yang diupload responden" checked={config.show_attachments} onChange={setField("show_attachments")} />
          </Section>

          {/* Footer */}
          <Section title="Teks Footer" icon={Type}>
            <Field label="Teks Footer" hint="Muncul di bagian bawah setiap halaman PDF (kecuali cover)">
              <TextInput value={config.footer_text} onChange={setField("footer_text")} placeholder="Dokumen ini bersifat rahasia…" />
            </Field>
          </Section>

          {/* Maturity level info */}
          <Section title="Level Maturitas (Referensi)" icon={Sliders} defaultOpen={false}>
            <div className="space-y-2">
              {[["1", "Awal (Initial)", "Proses tidak terdefinisi, reaktif"], ["2", "Berkembang (Developing)", "Mulai ada proses, belum konsisten"], ["3", "Terdefinisi (Defined)", "Proses terdokumentasi dan standar"], ["4", "Terkelola (Managed)", "Proses diukur dan dikontrol"], ["5", "Optimal (Optimizing)", "Proses terus ditingkatkan"]]
                .map(([n, lbl, desc]) => (
                  <div key={n} className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[rgba(124,104,225,0.4)] text-xs font-bold text-[#7C68E1]">{n}</span>
                    <div>
                      <p className="text-sm font-semibold text-white/80">{lbl}</p>
                      <p className="text-[11px] text-white/40">{desc}</p>
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        </div>

        {/* ── Preview Column (right 2/5) ──────────────────────────────────── */}
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="sticky top-6 space-y-3">
            {/* Preview controls */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Eye className="size-4 text-[#73D1AD]" />
                Preview PDF Live
              </div>

              {/* Session selector */}
              <div>
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">Sesi untuk Preview</p>
                <button
                  data-testid="btn-select-session-preview"
                  onClick={() => setShowPicker(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 hover:bg-white/[0.07]"
                >
                  <span className="truncate">
                    {selectedSession ? `${selectedSession.client_name || "—"} · ${selectedSession.id.slice(0, 8)}` : "Pilih sesi…"}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-white/30" />
                </button>
              </div>

              <button
                data-testid="btn-generate-preview"
                onClick={handlePreview}
                disabled={previewLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(115,209,173,0.35)] bg-[rgba(115,209,173,0.1)] py-2.5 text-sm font-semibold text-[#73D1AD] hover:bg-[rgba(115,209,173,0.15)] disabled:opacity-50"
              >
                {previewLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {previewLoading ? "Generating…" : "Generate Preview"}
              </button>

              {previewUrl && (
                <a
                  href={previewUrl}
                  download={`preview_pdf.pdf`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm text-white/50 hover:bg-white/[0.05]"
                >
                  <FileText className="size-4" />
                  Download PDF Preview
                </a>
              )}
            </div>

            {/* Iframe */}
            {previewUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-400/60" />
                    <span className="size-2.5 rounded-full bg-yellow-400/60" />
                    <span className="size-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <span className="text-[11px] text-white/30">preview.pdf</span>
                </div>
                <iframe
                  data-testid="pdf-preview-iframe"
                  src={previewUrl}
                  title="PDF Preview"
                  className="h-[620px] w-full"
                  style={{ background: "#F0F0F0" }}
                />
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]">
                <div className="text-center">
                  <FileText className="mx-auto mb-2 size-10 text-white/20" />
                  <p className="text-sm text-white/30">Klik "Generate Preview"</p>
                  <p className="text-[11px] text-white/20">untuk melihat tampilan PDF</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Picker Modal */}
      {showPicker && (
        <SessionPicker
          sessions={sessions}
          selected={selectedSession}
          onSelect={setSelectedSession}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
