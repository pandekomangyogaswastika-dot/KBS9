import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LayoutDashboard, FileText, Download, CheckCircle2, Save } from "lucide-react";

const formatTime = (date) => {
  if (!date) return null;
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

export const DiscoveryHeader = ({
  session,
  progress,
  saving,
  locked,
  onGoDashboard,
  onGoSummary,
  onExportPdf,
  currentView,
}) => {
  const savedAt = formatTime(saving.lastSavedAt);

  return (
    <header className="sticky top-0 z-30 border-b border-discovery-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-discovery-primary text-[11px] font-bold text-white">
              KN
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-discovery-muted">ERP Discovery</span>
            {locked ? (
              <Badge className="border-0 bg-discovery-success/15 text-[10px] font-semibold text-discovery-success">
                <CheckCircle2 size={10} className="mr-1" /> Submitted
              </Badge>
            ) : (
              <Badge variant="outline" className="border-discovery-border text-[10px] font-medium text-discovery-muted">
                Draft
              </Badge>
            )}
          </div>
          <h1 className="text-lg font-bold text-discovery-text sm:text-xl" data-testid="discovery-client-name">
            {session?.client_name || "Discovery Questionnaire"}
          </h1>
          {session?.project_name ? (
            <p className="text-xs text-discovery-muted">Project: {session.project_name}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-testid="discovery-nav-dashboard"
            variant={currentView === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={onGoDashboard}
            className={
              currentView === "dashboard"
                ? "bg-discovery-primary text-white hover:bg-discovery-primary-hover"
                : "border-discovery-border text-discovery-text hover:border-discovery-primary hover:text-discovery-primary"
            }
          >
            <LayoutDashboard size={14} className="mr-1.5" /> Dashboard
          </Button>
          <Button
            data-testid="discovery-nav-summary"
            variant={currentView === "summary" ? "default" : "outline"}
            size="sm"
            onClick={onGoSummary}
            className={
              currentView === "summary"
                ? "bg-discovery-primary text-white hover:bg-discovery-primary-hover"
                : "border-discovery-border text-discovery-text hover:border-discovery-primary hover:text-discovery-primary"
            }
          >
            <FileText size={14} className="mr-1.5" /> Ringkasan
          </Button>
          <Button
            data-testid="discovery-export-pdf"
            variant="outline"
            size="sm"
            onClick={onExportPdf}
            className="border-discovery-accent/50 text-discovery-accent hover:border-discovery-accent hover:bg-discovery-accent/10"
          >
            <Download size={14} className="mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="border-t border-discovery-border bg-discovery-bg-deep/60">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-2 text-xs sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <span className="font-semibold text-discovery-text">
              {progress.answered}/{progress.total} pertanyaan
            </span>
            <Progress
              value={progress.percent}
              className="h-1.5 flex-1 bg-discovery-border [&>div]:bg-discovery-primary"
              data-testid="discovery-progress-bar"
            />
            <span className="text-discovery-muted">{progress.percent}%</span>
          </div>
          <div className="hidden items-center gap-1.5 text-discovery-muted sm:flex" data-testid="discovery-autosave-indicator">
            <Save size={12} className={saving.pending > 0 ? "animate-pulse text-discovery-primary" : ""} />
            {saving.pending > 0
              ? <span>Menyimpan…</span>
              : savedAt
                ? <span>Tersimpan {savedAt}</span>
                : <span>Otomatis tersimpan</span>}
          </div>
        </div>
      </div>
    </header>
  );
};
