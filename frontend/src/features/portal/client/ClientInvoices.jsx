import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useFetch } from "@/lib/apiClient";
import { PORTAL } from "@/constants/testIds";

const STATUS_CONFIG = {
  paid: { color: "#4ECBAF", label: "Lunas" },
  unpaid: { color: "#F2A83E", label: "Belum Dibayar" },
  overdue: { color: "#E05555", label: "Terlambat" },
};

const fmtIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function ClientInvoices() {
  const { t } = useTranslation();
  const { data: invoices, loading, error } = useFetch("/invoices", []);
  const [expanded, setExpanded] = useState(null);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--kti-indigo)" }} /></div>;
  if (error) return <div className="flex min-h-[40vh] items-center justify-center"><AlertCircle className="size-8" style={{ color: "#E05555" }} /><p className="ml-2 text-sm">{error}</p></div>;

  const totalUnpaid = (invoices || []).filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = (invoices || []).filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">{t("portal.invoices")}</h1>
        <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">{(invoices || []).length} invoice</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
          <p className="text-xs text-[color:var(--kti-text-dim)]">Total Lunas</p>
          <p className="mt-1 text-xl font-bold" style={{ color: "#4ECBAF" }}>{fmtIDR(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
          <p className="text-xs text-[color:var(--kti-text-dim)]">Belum Dibayar</p>
          <p className="mt-1 text-xl font-bold" style={{ color: totalUnpaid > 0 ? "#F2A83E" : "#4ECBAF" }}>{fmtIDR(totalUnpaid)}</p>
        </div>
      </div>

      {/* Invoice List */}
      {!invoices || invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 rounded-2xl border border-white/8 bg-white/[0.03]">
          <CreditCard className="size-12" style={{ color: "var(--kti-text-faint)" }} />
          <p className="text-sm text-[color:var(--kti-text-dim)]">{t("portal.invoice.noInvoices")}</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid={PORTAL.invoiceList}>
          {invoices.map((inv) => {
            const sc = STATUS_CONFIG[inv.status] || { color: "#888", label: inv.status };
            const isExpanded = expanded === inv.id;
            return (
              <div key={inv.id} className="rounded-2xl border border-white/8 bg-white/[0.04] overflow-hidden" data-testid={PORTAL.invoiceRow}>
                <button
                  className="flex w-full items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : inv.id)}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/8">
                    <CreditCard className="size-4" style={{ color: "var(--kti-indigo)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{inv.number}</p>
                    <p className="text-xs text-[color:var(--kti-text-dim)]">{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" }) : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{fmtIDR(inv.amount)}</p>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}>{sc.label}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="size-4 text-[color:var(--kti-text-dim)]" /> : <ChevronDown className="size-4 text-[color:var(--kti-text-dim)]" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/8 px-6 py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-[color:var(--kti-text-faint)]">
                          <th className="pb-2">Deskripsi</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Harga Satuan</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/8">
                        {(inv.items || []).map((item, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-4 text-[color:var(--kti-text-dim)]">{item.description}</td>
                            <td className="py-2 text-right text-[color:var(--kti-text-dim)]">{item.quantity}</td>
                            <td className="py-2 text-right text-[color:var(--kti-text-dim)]">{fmtIDR(item.unit_price)}</td>
                            <td className="py-2 text-right font-medium text-white">{fmtIDR(item.quantity * item.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/8">
                          <td colSpan={3} className="pt-3 text-right font-semibold text-[color:var(--kti-text-dim)]">Total</td>
                          <td className="pt-3 text-right font-bold" style={{ color: "var(--kti-teal)" }}>{fmtIDR(inv.amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    {inv.due_at && (
                      <p className="mt-3 text-xs text-[color:var(--kti-text-dim)]">Jatuh Tempo: {new Date(inv.due_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</p>
                    )}
                    {inv.paid_at && (
                      <p className="text-xs" style={{ color: "#4ECBAF" }}>Dibayar: {new Date(inv.paid_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</p>
                    )}
                    {inv.notes && <p className="mt-2 text-xs text-[color:var(--kti-text-faint)] italic">{inv.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
