import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./ProgressRing";
import {
  Building2, AlertTriangle, ShoppingCart, Warehouse, TrendingUp, Wallet,
  Radio, Network, Database, Server, ShieldCheck, Users, Banknote, MessageSquare,
  ChevronRight, Clock, UserCircle2, ArrowRight,
} from "lucide-react";

const ICON_MAP = {
  Building2, AlertTriangle, ShoppingCart, Warehouse, TrendingUp, Wallet,
  Radio, Network, Database, Server, ShieldCheck, Users, Banknote, MessageSquare,
};

const statusLabel = (status) => {
  if (status === "completed") return "Selesai";
  if (status === "in_progress") return "Sedang berlangsung";
  return "Belum dimulai";
};

const statusBadgeClass = (status) => {
  if (status === "completed") return "bg-discovery-success/12 text-discovery-success";
  if (status === "in_progress") return "bg-discovery-primary/10 text-discovery-primary";
  return "bg-discovery-border/40 text-discovery-muted";
};

export const DiscoveryDashboard = ({ domains, progress, onOpenDomain, onGoSummary }) => {
  const progressMap = {};
  progress.domains.forEach((p) => { progressMap[p.domain_id] = p; });

  return (
    <div className="space-y-6">
      <Card className="border-discovery-border bg-gradient-to-br from-white via-white to-discovery-soft p-6 shadow-discovery-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-bold text-discovery-text">
              Selamat datang di Discovery Questionnaire
            </h2>
            <p className="text-sm leading-relaxed text-discovery-muted">
              Pengisian ini akan menjadi acuan tim vendor IT untuk merancang sistem ERP yang benar-benar
              sesuai kebutuhan bisnis Anda. <strong>Tidak ada jawaban yang “salah”</strong>—kejujuran &amp;
              akurasi yang paling penting.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-discovery-muted">
              <li>✓ Jawaban tersimpan otomatis (boleh tinggal &amp; lanjut nanti)</li>
              <li>✓ Setiap pertanyaan boleh dilewati</li>
              <li>✓ Setiap pertanyaan ada penjelasan non-teknis (ikon “?”)</li>
            </ul>
          </div>
          <ProgressRing percent={progress.percent} size={88} stroke={7} testId="discovery-dashboard-progress-ring" />
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-discovery-text">Pilih Domain untuk diisi</h3>
            <p className="text-xs text-discovery-muted">14 domain • estimasi total 3–4 jam (bisa dibagi per PIC/role)</p>
          </div>
          <Button
            data-testid="discovery-go-summary"
            variant="outline"
            onClick={onGoSummary}
            className="border-discovery-accent/40 text-discovery-accent hover:bg-discovery-accent/10"
          >
            Lihat Ringkasan <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {domains.map((d) => {
            const Icon = ICON_MAP[d.icon] || Building2;
            const dp = progressMap[d.id] || { answered: 0, total: d.questions?.length || 0, percent: 0, status: "not_started" };
            return (
              <button
                key={d.id}
                type="button"
                data-testid={`discovery-domain-card-${d.id}`}
                onClick={() => onOpenDomain(d.id)}
                className="group flex flex-col gap-3 rounded-2xl border border-discovery-border bg-white p-4 text-left transition-all hover:border-discovery-primary hover:shadow-discovery focus:outline-none focus-visible:ring-2 focus-visible:ring-discovery-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-discovery-soft text-discovery-primary">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-discovery-muted">
                        Domain {String(d.number).padStart(2, "0")}
                      </p>
                      <h4 className="text-sm font-semibold leading-snug text-discovery-text group-hover:text-discovery-primary">
                        {d.title}
                      </h4>
                    </div>
                  </div>
                  <ProgressRing percent={dp.percent} size={44} stroke={4} />
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-discovery-muted">
                  {d.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-discovery-muted">
                  <span className="flex items-center gap-1">
                    <UserCircle2 size={11} /> {d.recommended_pic[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> ~{d.estimated_minutes} menit
                  </span>
                  <span className="flex items-center gap-1">
                    {dp.answered}/{dp.total} terjawab
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-discovery-border pt-2">
                  <Badge className={`border-0 text-[10px] font-semibold ${statusBadgeClass(dp.status)}`}>
                    {statusLabel(dp.status)}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs font-medium text-discovery-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Buka <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
