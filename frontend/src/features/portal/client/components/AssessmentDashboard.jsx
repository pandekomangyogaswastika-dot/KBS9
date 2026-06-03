import { ProgressRing } from "./ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, AlertTriangle, ShoppingCart, Warehouse, TrendingUp, Wallet,
  Radio, Network, Database, Server, ShieldCheck, Users, Banknote, MessageSquare,
  ChevronRight, Clock, UserCircle2, ArrowRight, FileText, Download,
} from "lucide-react";

const ICON_MAP = {
  Building2, AlertTriangle, ShoppingCart, Warehouse, TrendingUp, Wallet,
  Radio, Network, Database, Server, ShieldCheck, Users, Banknote, MessageSquare,
};

const loc = (obj, lang = "id") => {
  if (typeof obj === "string") return obj;
  return obj?.[lang] || obj?.id || obj?.en || "";
};

const statusLabel = (status) => {
  if (status === "completed") return "Selesai";
  if (status === "in_progress") return "Sedang diisi";
  return "Belum dimulai";
};

const statusBadgeClass = (status) => {
  if (status === "completed") return "bg-[rgba(115,209,173,0.15)] text-[color:var(--kti-teal)]";
  if (status === "in_progress") return "bg-[rgba(124,104,225,0.15)] text-[color:var(--kti-indigo)]";
  return "bg-white/[0.06] text-[color:var(--kti-text-dim)]";
};

export const AssessmentDashboard = ({
  session,
  template,
  domains,
  progress,
  lang = "id",
  onOpenDomain,
  onGoSummary,
  onExportPdf,
  isLocked,
}) => {
  const progressMap = {};
  (progress?.domains || []).forEach((p) => { progressMap[p.domain_id] = p; });
  const overallPercent = progress?.percent || 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(124,104,225,0.15)] via-white/[0.03] to-[rgba(115,209,173,0.08)] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-bold text-white">
              {loc(template?.name, lang)}
            </h2>
            <p className="text-sm leading-relaxed text-[color:var(--kti-text-dim)]">
              {session?.client_name} · Pengisian ini menjadi acuan analisis kebutuhan sistem.
              <strong className="text-white"> Tidak ada jawaban yang "salah"</strong> — kejujuran &amp; akurasi yang paling penting.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[color:var(--kti-text-faint)]">
              <li>✓ Jawaban tersimpan otomatis</li>
              <li>✓ Setiap pertanyaan boleh dilewati</li>
              <li>✓ Tersedia penjelasan non-teknis (ikon "?")</li>
            </ul>
          </div>
          <ProgressRing
            percent={overallPercent}
            size={92}
            stroke={7}
            testId="dashboard-progress-ring"
          />
        </div>
      </div>

      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Pilih Domain untuk Diisi</h3>
          <p className="text-xs text-[color:var(--kti-text-faint)]">
            {domains.length} domain · estimasi total {Math.round((template?.estimated_minutes || 180) / 60 * 10) / 10} jam
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              data-testid="dashboard-export-pdf"
              variant="outline"
              size="sm"
              className="border-[rgba(115,209,173,0.3)] text-[color:var(--kti-teal)] hover:bg-[rgba(115,209,173,0.1)]"
            >
              <Download size={14} className="mr-1.5" /> Export PDF
            </Button>
          )}
          <Button
            onClick={onGoSummary}
            data-testid="dashboard-go-summary"
            variant="outline"
            size="sm"
            className="border-[rgba(124,104,225,0.3)] text-[color:var(--kti-indigo)] hover:bg-[rgba(124,104,225,0.1)]"
          >
            <FileText size={14} className="mr-1.5" /> Lihat Ringkasan
            <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Domain cards grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {domains.map((d, idx) => {
          const Icon = ICON_MAP[d.icon] || Building2;
          const dp = progressMap[d.id] || { answered: 0, total: d.questions?.length || 0, percent: 0, status: "not_started" };
          return (
            <button
              key={d.id || idx}
              type="button"
              data-testid={`dashboard-domain-card-${d.id || idx}`}
              onClick={() => onOpenDomain(idx)}
              className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,104,225,0.4)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[rgba(124,104,225,0.15)] text-[color:var(--kti-indigo)]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--kti-text-faint)]">
                      Domain {String(d.number || idx + 1).padStart(2, "0")}
                    </p>
                    <h4 className="text-sm font-semibold leading-snug text-white group-hover:text-[color:var(--kti-indigo)]">
                      {loc(d.title, lang)}
                    </h4>
                  </div>
                </div>
                <ProgressRing percent={dp.percent} size={44} stroke={4} />
              </div>

              {d.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-[color:var(--kti-text-faint)]">
                  {loc(d.description, lang)}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--kti-text-dim)]">
                {d.recommended_pic?.[0] && (
                  <span className="flex items-center gap-1">
                    <UserCircle2 size={11} />
                    {d.recommended_pic[0]}
                  </span>
                )}
                {d.estimated_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> ~{d.estimated_minutes} menit
                  </span>
                )}
                <span>{dp.answered}/{dp.total} terjawab</span>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2">
                <Badge
                  className={`border-0 text-[10px] font-semibold ${
                    statusBadgeClass(dp.status)
                  }`}
                >
                  {statusLabel(dp.status)}
                </Badge>
                <span className="flex items-center gap-1 text-xs font-medium text-[color:var(--kti-indigo)] opacity-0 transition-opacity group-hover:opacity-100">
                  Buka <ChevronRight size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
