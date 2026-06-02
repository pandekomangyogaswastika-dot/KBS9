import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const DiscoveryInvalid = ({ onNavigate }) => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <Card className="w-full max-w-md border-discovery-border bg-discovery-card p-8 text-center shadow-discovery-lg">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-discovery-warn/10 text-discovery-warn">
        <AlertCircle size={28} />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-discovery-text">Link tidak valid</h1>
      <p className="mb-6 text-sm leading-relaxed text-discovery-muted">
        Maaf, link discovery yang Anda buka tidak valid atau sudah kadaluarsa. Silakan minta link baru
        ke tim vendor IT.
      </p>
      <Button
        data-testid="discovery-invalid-back"
        onClick={() => onNavigate("/discovery")}
        className="bg-discovery-primary text-white hover:bg-discovery-primary-hover"
      >
        <ArrowLeft size={16} className="mr-2" /> Kembali ke beranda Discovery
      </Button>
    </Card>
  </div>
);
