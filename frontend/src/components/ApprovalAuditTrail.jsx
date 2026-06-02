import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Circle, User, ChevronRight } from "lucide-react";

const ACTION_CONFIG = {
  created: { color: "#7C68E1", label: "Dibuat", Icon: Circle },
  decided: { color: "#F2A83E", label: "Diputuskan", Icon: CheckCircle2 },
  signed: { color: "#4ECBAF", label: "Ditandatangani", Icon: CheckCircle2 },
  voided: { color: "#E05555", label: "Dibatalkan", Icon: Circle },
};

export default function ApprovalAuditTrail({ logs = [], signatures = [] }) {
  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  const allEvents = [
    ...logs.map((l) => ({ ...l, _kind: "log", _ts: l.timestamp })),
    ...signatures.map((s) => ({ ...s, _kind: "sig", _ts: s.signed_at, action: "signed",
      actor_name: s.signer_name, actor_role: s.signer_role, details: { certificate_no: s.certificate_no, signature_type: s.signature_type } })),
  ].sort((a, b) => new Date(a._ts) - new Date(b._ts));

  if (allEvents.length === 0) {
    return <p className="py-4 text-center text-sm text-[color:var(--kti-text-faint)]">Belum ada riwayat.</p>;
  }

  return (
    <div className="space-y-0">
      {allEvents.map((ev, i) => {
        const cfg = ACTION_CONFIG[ev.action] || { color: "#888", label: ev.action, Icon: Circle };
        const { Icon } = cfg;
        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="grid size-8 shrink-0 place-items-center rounded-full border" style={{ borderColor: cfg.color, background: `${cfg.color}22` }}>
                <Icon className="size-4" style={{ color: cfg.color }} />
              </div>
              {i < allEvents.length - 1 && <div className="w-px flex-1 my-1" style={{ background: "rgba(255,255,255,0.07)" }} />}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-white">{cfg.label}</span>
                  <span className="ml-2 text-xs text-[color:var(--kti-text-dim)]">oleh {ev.actor_name} ({ev.actor_role})</span>
                </div>
                <span className="shrink-0 text-[11px] text-[color:var(--kti-text-faint)]">{fmtTime(ev._ts)}</span>
              </div>
              {ev._kind === "sig" && ev.details?.certificate_no && (
                <p className="mt-1 text-xs text-[color:var(--kti-text-faint)]">Sertifikat: {ev.details.certificate_no} · Metode: {ev.details.signature_type === "drawn" ? "Gambar" : "Ketik"}</p>
              )}
              {ev._kind === "log" && ev.action === "decided" && ev.details?.status && (
                <p className="mt-1 text-xs" style={{ color: ev.details.status === "approved" ? "#4ECBAF" : "#E05555" }}>
                  Status: {ev.details.status === "approved" ? "Disetujui" : "Perlu Revisi"}
                  {ev.details.feedback ? ` · ${ev.details.feedback}` : ""}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
