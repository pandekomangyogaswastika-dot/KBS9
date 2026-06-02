import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Inbox, RefreshCw, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";

import { api, apiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE = 25;

const TID = {
  page: "admin-email-outbox",
  table: "admin-email-outbox-table",
  filterStatus: "admin-email-outbox-filter-status",
  refresh: "admin-email-outbox-refresh",
  detailDialog: "admin-email-outbox-detail-dialog",
  row: "admin-email-outbox-row",
  detailButton: "admin-email-outbox-detail-button",
};

function StatusBadge({ status }) {
  const map = {
    sent: { color: "bg-[rgba(78,203,175,0.16)] text-[#a9ecd2] border-[rgba(78,203,175,0.4)]", Icon: CheckCircle2 },
    failed: { color: "bg-[rgba(224,85,85,0.16)] text-[#ffb1b1] border-[rgba(224,85,85,0.4)]", Icon: XCircle },
  };
  const meta = map[status] || { color: "bg-white/8 text-white/70 border-white/10", Icon: Inbox };
  const Icon = meta.Icon;
  return (
    <Badge variant="outline" className={`gap-1.5 border ${meta.color}`}>
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch (_e) {
    return iso;
  }
}

export default function AdminEmailOutbox() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE);
      params.set("skip", page * PAGE_SIZE);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const r = await api.get(`/admin/integrations/email/outbox?${params.toString()}`);
      setItems(r.data?.data?.items || []);
      setTotal(r.data?.data?.total || 0);
    } catch (e) {
      toast.error(apiError(e, t("outbox.loadError")));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (row) => {
    setDetailLoading(true);
    try {
      const r = await api.get(`/admin/integrations/email/outbox/${row.id}`);
      setDetail(r.data?.data || null);
    } catch (e) {
      toast.error(apiError(e, t("outbox.loadError")));
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div data-testid={TID.page}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{t("outbox.pageTitle")}</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{t("outbox.pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setPage(0); setStatusFilter(v); }}>
            <SelectTrigger className="w-[160px]" data-testid={TID.filterStatus}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("outbox.filterAll")}</SelectItem>
              <SelectItem value="sent">{t("outbox.filterSent")}</SelectItem>
              <SelectItem value="failed">{t("outbox.filterFailed")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading} data-testid={TID.refresh}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />{t("outbox.refresh")}
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
        <table className="w-full text-sm" data-testid={TID.table}>
          <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wide text-[color:var(--kti-text-dim)]">
            <tr>
              <th className="px-4 py-3">{t("outbox.col.created")}</th>
              <th className="px-4 py-3">{t("outbox.col.to")}</th>
              <th className="px-4 py-3">{t("outbox.col.subject")}</th>
              <th className="px-4 py-3">{t("outbox.col.template")}</th>
              <th className="px-4 py-3">{t("outbox.col.provider")}</th>
              <th className="px-4 py-3">{t("outbox.col.status")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[color:var(--kti-text-dim)]"><Loader2 className="inline size-4 animate-spin" /></td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[color:var(--kti-text-dim)]">{t("outbox.empty")}</td></tr>
            )}
            {!loading && items.map((it) => (
              <tr key={it.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]" data-testid={TID.row}>
                <td className="px-4 py-3 text-[12px] text-[color:var(--kti-text-dim)]">{fmtDate(it.created_at)}</td>
                <td className="px-4 py-3 text-white">{it.to}</td>
                <td className="px-4 py-3 text-white">{it.subject || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-[color:var(--kti-text-dim)]"><code className="rounded bg-white/5 px-1.5 py-0.5">{it.template_id}</code></td>
                <td className="px-4 py-3 text-[12px] text-[color:var(--kti-text-dim)]">{it.provider}</td>
                <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openDetail(it)} data-testid={TID.detailButton}>
                    <Eye className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--kti-text-dim)]">
        <span>{t("outbox.totalLabel", { total })}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>{t("outbox.prev")}</Button>
          <span>{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>{t("outbox.next")}</Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl" data-testid={TID.detailDialog}>
          <DialogHeader>
            <DialogTitle>{t("outbox.detailTitle")}</DialogTitle>
            <DialogDescription>{detail?.email?.subject || "—"}</DialogDescription>
          </DialogHeader>
          {detailLoading && <Loader2 className="size-5 animate-spin" />}
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.to")}: </span><span className="text-white">{detail.email.to}</span></div>
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.status")}: </span><StatusBadge status={detail.email.status} /></div>
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.template")}: </span><code className="rounded bg-white/5 px-1.5 py-0.5">{detail.email.template_id}</code></div>
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.provider")}: </span><span className="text-white">{detail.email.provider}</span></div>
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.created")}: </span><span className="text-white">{fmtDate(detail.email.created_at)}</span></div>
                <div><span className="text-[color:var(--kti-text-dim)]">{t("outbox.col.locale")}: </span><span className="text-white">{detail.email.locale}</span></div>
              </div>
              {detail.email.error && (
                <div className="rounded-lg border border-[rgba(224,85,85,0.4)] bg-[rgba(224,85,85,0.08)] p-3 text-[#ffb1b1]">
                  <strong>Error:</strong> {detail.email.error}
                </div>
              )}
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[color:var(--kti-text-dim)]">{t("outbox.variables")}</p>
                <pre className="max-h-40 overflow-auto rounded-lg border border-white/8 bg-black/40 p-3 text-[11px] text-[color:var(--kti-text-strong)]">
{JSON.stringify(detail.email.variables || {}, null, 2)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[color:var(--kti-text-dim)]">{t("outbox.events")}</p>
                <ul className="space-y-1">
                  {(detail.events || []).map((ev) => (
                    <li key={ev.id} className="flex items-center gap-2 text-xs text-[color:var(--kti-text-dim)]">
                      <Badge variant="outline" className="border-white/10">{ev.event_type}</Badge>
                      <span>{fmtDate(ev.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>{t("outbox.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
