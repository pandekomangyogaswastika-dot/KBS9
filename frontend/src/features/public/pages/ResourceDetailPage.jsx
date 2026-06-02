import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useFetch, api } from "@/lib/apiClient";
import { ErrorView } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { data: resource, loading, error } = useFetch(`/resources/${slug}`);
  
  const [showGate, setShowGate] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (resource.gated && !showGate) {
      setShowGate(true);
      return;
    }

    if (resource.gated && (!email || !name)) {
      toast.error(lang.startsWith("en") ? "Please fill in your details" : "Mohon isi data Anda");
      return;
    }

    setDownloading(true);
    try {
      // Track download
      await api.post(`/resources/${resource.id}/track-download`);
      
      // If gated, save lead first
      if (resource.gated) {
        await api.post("/leads", {
          name,
          email,
          source: "resource_download",
          message: `Downloaded: ${lang.startsWith("en") ? resource.title.en : resource.title.id}`,
        });
      }

      // Open download link
      window.open(resource.file_url, "_blank");
      toast.success(lang.startsWith("en") ? "Download started" : "Download dimulai");
      
      // Reset gate
      setShowGate(false);
      setEmail("");
      setName("");
    } catch (err) {
      toast.error(lang.startsWith("en") ? "Download failed" : "Download gagal");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="kti-container py-24">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-white/5 rounded w-3/4" />
          <div className="h-64 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="kti-container py-24">
        <ErrorView message={error || "Resource not found"} />
      </div>
    );
  }

  return (
    <div data-testid="resource-detail-page">
      <SEOHead
        title={lang.startsWith("en") ? resource.title.en : resource.title.id}
        description={lang.startsWith("en") ? resource.description.en : resource.description.id}
        type="article"
      />
      
      <div className="kti-container py-24">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/resources')}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {lang.startsWith("en") ? "Back to Resources" : "Kembali ke Resources"}
          </Button>

          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4">{resource.type}</Badge>
            <h1 className="kti-heading-1 mb-4">
              {lang.startsWith("en") ? resource.title.en : resource.title.id}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span>{resource.download_count || 0} downloads</span>
              {resource.published_at && (
                <span>{new Date(resource.published_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Cover */}
          {resource.cover ? (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img
                src={resource.cover}
                alt={lang.startsWith("en") ? resource.title.en : resource.title.id}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-8">
              <FileText className="h-24 w-24 text-white/30" />
            </div>
          )}

          {/* Description */}
          <div className="kti-card p-8 mb-8">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: lang.startsWith("en") ? resource.description.en : resource.description.id
              }}
            />
          </div>

          {/* Download Section */}
          <div className="kti-card p-8">
            {!showGate ? (
              <div className="text-center">
                <h3 className="font-display text-xl mb-4">
                  {lang.startsWith("en") ? "Download This Resource" : "Download Resource Ini"}
                </h3>
                <p className="text-white/60 mb-6">
                  {resource.gated
                    ? (lang.startsWith("en")
                        ? "Enter your details to download"
                        : "Masukkan data Anda untuk download")
                    : (lang.startsWith("en")
                        ? "Click to start download"
                        : "Klik untuk mulai download")}
                </p>
                <Button size="lg" onClick={handleDownload} disabled={downloading}>
                  <Download className="h-5 w-5 mr-2" />
                  {downloading
                    ? (lang.startsWith("en") ? "Downloading..." : "Downloading...")
                    : (lang.startsWith("en") ? "Download Now" : "Download Sekarang")}
                </Button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <h3 className="font-display text-xl mb-4 text-center">
                  {lang.startsWith("en") ? "Enter Your Details" : "Masukkan Data Anda"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {lang.startsWith("en") ? "Name" : "Nama"}
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang.startsWith("en") ? "Your name" : "Nama Anda"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleDownload}
                    disabled={downloading || !email || !name}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {downloading
                      ? (lang.startsWith("en") ? "Processing..." : "Memproses...")
                      : (lang.startsWith("en") ? "Download" : "Download")}
                  </Button>
                  <p className="text-xs text-white/50 text-center">
                    {lang.startsWith("en")
                      ? "We respect your privacy. No spam, ever."
                      : "Kami menghormati privasi Anda. Tidak ada spam."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-sm uppercase tracking-wider text-white/50 mb-4">
                {lang.startsWith("en") ? "Tags" : "Tags"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
