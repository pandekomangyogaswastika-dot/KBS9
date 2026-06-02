import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Mail, CreditCard, HardDrive, Send, Save, Loader2, Eye, EyeOff } from "lucide-react";

import { api, apiError } from "@/lib/apiClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const TID = {
  page: "admin-integrations",
  tabEmail: "admin-integrations-tab-email",
  tabPayment: "admin-integrations-tab-payment",
  tabStorage: "admin-integrations-tab-storage",
  emailProvider: "admin-integrations-email-provider",
  emailEnabled: "admin-integrations-email-enabled",
  emailFromEmail: "admin-integrations-email-from-email",
  emailFromName: "admin-integrations-email-from-name",
  emailSmtpHost: "admin-integrations-email-smtp-host",
  emailSmtpPort: "admin-integrations-email-smtp-port",
  emailSmtpUser: "admin-integrations-email-smtp-username",
  emailSmtpPass: "admin-integrations-email-smtp-password",
  emailSmtpTls: "admin-integrations-email-smtp-tls",
  saveBtn: "admin-integrations-save-button",
  testBtn: "admin-integrations-test-button",
  testDialog: "admin-integrations-test-dialog",
  testTo: "admin-integrations-test-to",
  testSend: "admin-integrations-test-send",
  paymentProvider: "admin-integrations-payment-provider",
  paymentEnabled: "admin-integrations-payment-enabled",
  paymentEnv: "admin-integrations-payment-environment",
  paymentServerKey: "admin-integrations-payment-server-key",
  paymentClientKey: "admin-integrations-payment-client-key",
  storageProvider: "admin-integrations-storage-provider",
  storageEnabled: "admin-integrations-storage-enabled",
  storageBucket: "admin-integrations-storage-bucket",
  storageRegion: "admin-integrations-storage-region",
  storageAccessKey: "admin-integrations-storage-access-key",
  storageAccessSecret: "admin-integrations-storage-access-secret",
};

const MASK = "********";

function PageHeader({ title, subtitle }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-white" data-testid="admin-integrations-title">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{subtitle}</p> : null}
    </header>
  );
}

function SectionCard({ title, description, children, footer }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[color:var(--kti-text-dim)]">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
      {footer ? <div className="mt-6 flex flex-wrap items-center justify-end gap-2">{footer}</div> : null}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-[color:var(--kti-text-dim)]">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-[color:var(--kti-text-faint)]">{hint}</p> : null}
    </div>
  );
}

function PasswordInput({ value, onChange, testid, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testid}
        className="pr-10"
      />
      <button
        type="button"
        aria-label={show ? "Hide" : "Show"}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[color:var(--kti-text-dim)] hover:text-white"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// ----- EMAIL PANEL -----
function EmailPanel() {
  const { t } = useTranslation();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSending, setTestSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/integrations/email");
      setState(r.data?.data || null);
      setTestTo(r.data?.data?.from_email || "");
    } catch (e) {
      toast.error(apiError(e, t("integrations.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const updateField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };
  const updateConfig = (key, value) => {
    setState((prev) => ({ ...prev, config: { ...(prev?.config || {}), [key]: value } }));
  };

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const payload = {
        enabled: state.enabled,
        provider: state.provider,
        from_email: state.from_email,
        from_name: state.from_name,
        config: state.config || {},
      };
      const r = await api.put("/admin/integrations/email", payload);
      setState(r.data?.data || state);
      toast.success(t("integrations.savedSuccess"));
    } catch (e) {
      toast.error(apiError(e, t("integrations.saveError")));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!testTo) {
      toast.error(t("integrations.test.recipientRequired"));
      return;
    }
    setTestSending(true);
    try {
      const r = await api.post("/admin/integrations/email/test", {
        to: testTo,
        subject: "KTI Test Email",
        body: "Halo, ini adalah test email dari Kubus Admin.",
      });
      if (r.data?.data?.sent) {
        toast.success(t("integrations.test.success"));
        setTestOpen(false);
      } else {
        const errMsg = r.data?.data?.result?.error || t("integrations.test.failed");
        toast.error(errMsg);
      }
    } catch (e) {
      toast.error(apiError(e, t("integrations.test.failed")));
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-white/8 bg-white/[0.04] py-16">
        <Loader2 className="size-5 animate-spin text-[color:var(--kti-text-dim)]" />
      </div>
    );
  }
  if (!state) return null;

  const provider = state.provider || "mock";
  const cfg = state.config || {};
  return (
    <SectionCard
      title={t("integrations.email.title")}
      description={t("integrations.email.subtitle")}
      footer={(
        <>
          <Button variant="outline" onClick={() => setTestOpen(true)} data-testid={TID.testBtn}>
            <Send className="mr-2 size-4" />{t("integrations.test.cta")}
          </Button>
          <Button onClick={save} disabled={saving} data-testid={TID.saveBtn}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {t("integrations.save")}
          </Button>
        </>
      )}
    >
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm text-white">{t("integrations.enabled")}</p>
          <p className="text-[11px] text-[color:var(--kti-text-dim)]">{t("integrations.email.enabledHint")}</p>
        </div>
        <Switch
          checked={!!state.enabled}
          onCheckedChange={(v) => updateField("enabled", v)}
          data-testid={TID.emailEnabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("integrations.email.provider")} hint={t("integrations.email.providerHint")}>
          <Select value={provider} onValueChange={(v) => updateField("provider", v)}>
            <SelectTrigger data-testid={TID.emailProvider}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mock">Mock (Default)</SelectItem>
              <SelectItem value="smtp">SMTP</SelectItem>
              <SelectItem value="resend">Resend (coming soon)</SelectItem>
              <SelectItem value="sendgrid">SendGrid (coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("integrations.email.fromName")}>
          <Input
            value={state.from_name || ""}
            onChange={(e) => updateField("from_name", e.target.value)}
            placeholder="Kubus Teknologi"
            data-testid={TID.emailFromName}
          />
        </Field>

        <Field label={t("integrations.email.fromEmail")}>
          <Input
            type="email"
            value={state.from_email || ""}
            onChange={(e) => updateField("from_email", e.target.value)}
            placeholder="no-reply@kubus.id"
            data-testid={TID.emailFromEmail}
          />
        </Field>
      </div>

      {provider === "smtp" && (
        <div className="grid gap-4 rounded-xl border border-dashed border-white/10 p-4 md:grid-cols-2">
          <Field label="SMTP Host">
            <Input
              value={cfg.smtp_host || ""}
              onChange={(e) => updateConfig("smtp_host", e.target.value)}
              placeholder="smtp.example.com"
              data-testid={TID.emailSmtpHost}
            />
          </Field>
          <Field label="SMTP Port">
            <Input
              type="number"
              value={cfg.smtp_port ?? 587}
              onChange={(e) => updateConfig("smtp_port", Number(e.target.value))}
              data-testid={TID.emailSmtpPort}
            />
          </Field>
          <Field label="SMTP Username">
            <Input
              value={cfg.smtp_username || ""}
              onChange={(e) => updateConfig("smtp_username", e.target.value)}
              data-testid={TID.emailSmtpUser}
            />
          </Field>
          <Field label="SMTP Password" hint={t("integrations.email.passwordHint")}>
            <PasswordInput
              value={cfg.smtp_password || ""}
              onChange={(v) => updateConfig("smtp_password", v)}
              placeholder={MASK}
              testid={TID.emailSmtpPass}
            />
          </Field>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-white">Use TLS / STARTTLS</span>
            <Switch
              checked={!!cfg.smtp_use_tls}
              onCheckedChange={(v) => updateConfig("smtp_use_tls", v)}
              data-testid={TID.emailSmtpTls}
            />
          </div>
        </div>
      )}

      {provider === "mock" && (
        <div className="rounded-xl border border-[rgba(78,203,175,0.35)] bg-[rgba(78,203,175,0.08)] p-4 text-sm text-[color:var(--kti-text-strong)]">
          <Badge className="mb-2" variant="secondary">MOCK</Badge>
          <p>{t("integrations.email.mockNotice")}</p>
        </div>
      )}

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent data-testid={TID.testDialog}>
          <DialogHeader>
            <DialogTitle>{t("integrations.test.title")}</DialogTitle>
            <DialogDescription>{t("integrations.test.desc")}</DialogDescription>
          </DialogHeader>
          <Field label={t("integrations.test.recipient")}>
            <Input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="someone@example.com"
              data-testid={TID.testTo}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>{t("integrations.cancel")}</Button>
            <Button onClick={sendTest} disabled={testSending} data-testid={TID.testSend}>
              {testSending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {t("integrations.test.cta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

// ----- PAYMENT PANEL -----
function PaymentPanel() {
  const { t } = useTranslation();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/integrations/payment");
      setState(r.data?.data || null);
    } catch (e) {
      toast.error(apiError(e, t("integrations.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const payload = {
        enabled: state.enabled,
        provider: state.provider,
        config: state.config || {},
      };
      const r = await api.put("/admin/integrations/payment", payload);
      setState(r.data?.data || state);
      toast.success(t("integrations.savedSuccess"));
    } catch (e) {
      toast.error(apiError(e, t("integrations.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-white/8 bg-white/[0.04] py-16">
        <Loader2 className="size-5 animate-spin text-[color:var(--kti-text-dim)]" />
      </div>
    );
  }
  if (!state) return null;

  const cfg = state.config || {};
  return (
    <SectionCard
      title={t("integrations.payment.title")}
      description={t("integrations.payment.subtitle")}
      footer={(
        <Button onClick={save} disabled={saving} data-testid="admin-integrations-payment-save">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {t("integrations.save")}
        </Button>
      )}
    >
      <div className="rounded-xl border border-[rgba(124,104,225,0.35)] bg-[rgba(124,104,225,0.08)] p-4 text-xs text-[color:var(--kti-text-strong)]">
        <Badge className="mb-2" variant="secondary">PLACEHOLDER</Badge>
        <p>{t("integrations.payment.placeholderNotice")}</p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm text-white">{t("integrations.enabled")}</p>
        </div>
        <Switch
          checked={!!state.enabled}
          onCheckedChange={(v) => setState({ ...state, enabled: v })}
          data-testid={TID.paymentEnabled}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("integrations.payment.provider")}>
          <Select value={state.provider || "mock"} onValueChange={(v) => setState({ ...state, provider: v })}>
            <SelectTrigger data-testid={TID.paymentProvider}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mock">Mock</SelectItem>
              <SelectItem value="midtrans">Midtrans</SelectItem>
              <SelectItem value="xendit">Xendit</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("integrations.payment.environment")}>
          <Select value={cfg.environment || "sandbox"} onValueChange={(v) => setState({ ...state, config: { ...cfg, environment: v } })}>
            <SelectTrigger data-testid={TID.paymentEnv}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Server Key">
          <PasswordInput
            value={cfg.server_key || ""}
            onChange={(v) => setState({ ...state, config: { ...cfg, server_key: v } })}
            placeholder={MASK}
            testid={TID.paymentServerKey}
          />
        </Field>
        <Field label="Client Key">
          <Input
            value={cfg.client_key || ""}
            onChange={(e) => setState({ ...state, config: { ...cfg, client_key: e.target.value } })}
            placeholder="pk_test_..."
            data-testid={TID.paymentClientKey}
          />
        </Field>
      </div>
    </SectionCard>
  );
}

// ----- STORAGE PANEL -----
function StoragePanel() {
  const { t } = useTranslation();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/integrations/storage");
      setState(r.data?.data || null);
    } catch (e) {
      toast.error(apiError(e, t("integrations.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const payload = {
        enabled: state.enabled,
        provider: state.provider,
        config: state.config || {},
      };
      const r = await api.put("/admin/integrations/storage", payload);
      setState(r.data?.data || state);
      toast.success(t("integrations.savedSuccess"));
    } catch (e) {
      toast.error(apiError(e, t("integrations.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-white/8 bg-white/[0.04] py-16">
        <Loader2 className="size-5 animate-spin text-[color:var(--kti-text-dim)]" />
      </div>
    );
  }
  if (!state) return null;

  const cfg = state.config || {};
  const isLocal = state.provider === "local";
  return (
    <SectionCard
      title={t("integrations.storage.title")}
      description={t("integrations.storage.subtitle")}
      footer={(
        <Button onClick={save} disabled={saving} data-testid="admin-integrations-storage-save">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {t("integrations.save")}
        </Button>
      )}
    >
      <div className="rounded-xl border border-[rgba(242,168,62,0.35)] bg-[rgba(242,168,62,0.08)] p-4 text-xs text-[color:var(--kti-text-strong)]">
        <Badge className="mb-2" variant="secondary">PLACEHOLDER</Badge>
        <p>{t("integrations.storage.placeholderNotice")}</p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <p className="text-sm text-white">{t("integrations.enabled")}</p>
        <Switch checked={!!state.enabled} onCheckedChange={(v) => setState({ ...state, enabled: v })} data-testid={TID.storageEnabled} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("integrations.storage.provider")}>
          <Select value={state.provider || "local"} onValueChange={(v) => setState({ ...state, provider: v })}>
            <SelectTrigger data-testid={TID.storageProvider}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local Filesystem</SelectItem>
              <SelectItem value="s3">AWS S3</SelectItem>
              <SelectItem value="r2">Cloudflare R2</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("integrations.storage.bucket")}>
          <Input value={cfg.bucket || ""} onChange={(e) => setState({ ...state, config: { ...cfg, bucket: e.target.value } })} data-testid={TID.storageBucket} />
        </Field>
        {!isLocal && (
          <>
            <Field label="Region">
              <Input value={cfg.region || ""} onChange={(e) => setState({ ...state, config: { ...cfg, region: e.target.value } })} placeholder="ap-southeast-1" data-testid={TID.storageRegion} />
            </Field>
            <Field label="Endpoint (optional)">
              <Input value={cfg.endpoint || ""} onChange={(e) => setState({ ...state, config: { ...cfg, endpoint: e.target.value } })} placeholder="https://..." />
            </Field>
            <Field label="Access Key ID">
              <Input value={cfg.access_key_id || ""} onChange={(e) => setState({ ...state, config: { ...cfg, access_key_id: e.target.value } })} data-testid={TID.storageAccessKey} />
            </Field>
            <Field label="Access Key Secret">
              <PasswordInput value={cfg.access_key_secret || ""} onChange={(v) => setState({ ...state, config: { ...cfg, access_key_secret: v } })} placeholder={MASK} testid={TID.storageAccessSecret} />
            </Field>
          </>
        )}
      </div>
    </SectionCard>
  );
}

export default function AdminIntegrations() {
  const { t } = useTranslation();
  return (
    <div data-testid={TID.page}>
      <PageHeader title={t("integrations.pageTitle")} subtitle={t("integrations.pageSubtitle")} />
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3 bg-white/[0.04]">
          <TabsTrigger value="email" data-testid={TID.tabEmail}>
            <Mail className="mr-2 size-4" />{t("integrations.tabs.email")}
          </TabsTrigger>
          <TabsTrigger value="payment" data-testid={TID.tabPayment}>
            <CreditCard className="mr-2 size-4" />{t("integrations.tabs.payment")}
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid={TID.tabStorage}>
            <HardDrive className="mr-2 size-4" />{t("integrations.tabs.storage")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email"><EmailPanel /></TabsContent>
        <TabsContent value="payment"><PaymentPanel /></TabsContent>
        <TabsContent value="storage"><StoragePanel /></TabsContent>
      </Tabs>
    </div>
  );
}
