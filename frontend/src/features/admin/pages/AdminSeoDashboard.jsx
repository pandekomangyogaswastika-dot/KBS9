import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Search, Filter, RefreshCw, TrendingUp, AlertCircle, CheckCircle2,
  Globe, FileText, Briefcase, Newspaper, Users, Code, Sparkles, X, ChevronDown, ExternalLink, Download, FileDown
} from "lucide-react";
import { api, apiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSerpPreview from "@/components/seo/GoogleSerpPreview";
import SocialPreview from "@/components/seo/SocialPreview";
import SeoRecommendations from "@/components/seo/SeoRecommendations";
import ScoreHistoryChart from "@/components/seo/ScoreHistoryChart";

/**
 * AdminSeoDashboard - Phase 11.C
 * SEO monitoring & management dashboard for content team
 */
export default function AdminSeoDashboard() {
  const { t } = useTranslation();
  
  // State
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLocale, setFilterLocale] = useState("all");
  const [selectedPages, setSelectedPages] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [detailModalPage, setDetailModalPage] = useState(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // KPIs
  const [kpis, setKpis] = useState({
    totalPages: 0,
    missingMeta: 0,
    lowScore: 0,
    lastGenerated: null
  });
  
  // Load SEO pages
  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seo/pages");
      const pagesData = res.data?.data || [];
      setPages(pagesData);
      
      // Calculate KPIs
      const missing = pagesData.filter(p => !p.title || !p.description).length;
      const lowScore = pagesData.filter(p => (p.seo_score || 0) < 70).length;
      const lastGen = pagesData.length > 0 
        ? Math.max(...pagesData.map(p => new Date(p.generated_at || p.updated_at).getTime()))
        : null;
      
      setKpis({
        totalPages: pagesData.length,
        missingMeta: missing,
        lowScore,
        lastGenerated: lastGen ? new Date(lastGen).toLocaleString("id-ID") : "-"
      });
    } catch (err) {
      toast.error(apiError(err, "Gagal memuat data SEO"));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPages();
  }, []);
  
  // Filtered pages
  const filteredPages = pages.filter(p => {
    const matchSearch = p.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       p.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || p.page_type === filterType;
    const matchLocale = filterLocale === "all" || p.locale === filterLocale;
    return matchSearch && matchType && matchLocale;
  });
  
  // Bulk regenerate meta
  const handleBulkRegenerateMeta = async () => {
    if (selectedPages.length === 0) {
      toast.error("Pilih halaman terlebih dahulu");
      return;
    }
    
    setBulkActionLoading(true);
    let successCount = 0;
    
    for (const pageId of selectedPages) {
      const page = pages.find(p => p.id === pageId);
      if (!page) continue;
      
      try {
        await api.post("/seo/ai/generate-meta", {
          page_type: page.page_type,
          path: page.path,
          locale: page.locale,
          content_payload: {
            title: page.title || "Untitled",
            description: page.description || "",
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to regenerate ${page.path}:`, err);
      }
    }
    
    setBulkActionLoading(false);
    toast.success(`${successCount} halaman berhasil di-regenerate`);
    setSelectedPages([]);
    await loadPages();
  };
  
  // Bulk analyze
  const handleBulkAnalyze = async () => {
    if (selectedPages.length === 0) {
      toast.error("Pilih halaman terlebih dahulu");
      return;
    }
    
    setBulkActionLoading(true);
    let successCount = 0;
    
    for (const pageId of selectedPages) {
      const page = pages.find(p => p.id === pageId);
      if (!page) continue;
      
      try {
        const res = await api.post("/seo/ai/analyze", {
          path: page.path,
          title: page.title || "",
          description: page.description || "",
          content: page.description || "",
          locale: page.locale
        });
        
        // Update page score
        const score = res.data?.data?.score || 0;
        await api.patch(`/seo/pages/${pageId}`, { seo_score: score });
        successCount++;
      } catch (err) {
        console.error(`Failed to analyze ${page.path}:`, err);
      }
    }
    
    setBulkActionLoading(false);
    toast.success(`${successCount} halaman berhasil dianalisis`);
    setSelectedPages([]);
    await loadPages();
  };
  
  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" };
    if (score >= 60) return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40" };
    return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" };
  };
  
  // Load detail data when modal opens
  const openDetailModal = async (page) => {
    setDetailModalPage(page);
    setAnalysisData(null);
    setScoreHistory([]);
    
    // Load score history
    setHistoryLoading(true);
    try {
      const histRes = await api.get(`/seo/pages/${page.id}/score-history`);
      setScoreHistory(histRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Export PDF report
  const exportPdfReport = async (pageId) => {
    try {
      const res = await api.get(`/seo/report/pdf/${pageId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `seo-report-${pageId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF report downloaded!");
    } catch (err) {
      toast.error(apiError(err, "Failed to export PDF"));
    }
  };
  
  return (
    <div className="space-y-6 pb-10" data-testid="admin-seo-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{t("admin.seo")}</h1>
          <p className="mt-1 text-sm text-[color:var(--kti-text-dim)]">Monitor dan optimalkan SEO seluruh halaman public</p>
        </div>
        <Button
          onClick={loadPages}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] border border-white/10 text-white hover:bg-white/[0.12]"
          data-testid="seo-refresh-btn"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-500/20 border border-blue-500/30">
              <FileText className="size-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--kti-text-dim)]">Total Pages</p>
              <p className="text-2xl font-semibold text-white">{kpis.totalPages}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-xl bg-red-500/20 border border-red-500/30">
              <AlertCircle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--kti-text-dim)]">Missing Meta</p>
              <p className="text-2xl font-semibold text-white">{kpis.missingMeta}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <TrendingUp className="size-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--kti-text-dim)]">Low Score (&lt;70)</p>
              <p className="text-2xl font-semibold text-white">{kpis.lowScore}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Sparkles className="size-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--kti-text-dim)]">Last AI Gen</p>
              <p className="text-xs font-medium text-white truncate">{kpis.lastGenerated}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[color:var(--kti-text-faint)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari path atau title..."
            className="pl-10 rounded-xl border border-white/10 bg-white/[0.04] text-white"
            data-testid="seo-search-input"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
          data-testid="seo-filter-type"
        >
          <option value="all">Semua Tipe</option>
          <option value="homepage">Homepage</option>
          <option value="service">Services</option>
          <option value="case">Cases</option>
          <option value="blog">Blog</option>
          <option value="career">Career</option>
          <option value="static">Static</option>
        </select>
        
        <select
          value={filterLocale}
          onChange={(e) => setFilterLocale(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
          data-testid="seo-filter-locale"
        >
          <option value="all">Semua Bahasa</option>
          <option value="id">ID</option>
          <option value="en">EN</option>
        </select>
        
        {selectedPages.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleBulkRegenerateMeta}
              disabled={bulkActionLoading}
              className="rounded-xl bg-[rgba(124,104,225,0.18)] border border-[rgba(124,104,225,0.4)] text-white hover:bg-[rgba(124,104,225,0.28)]"
              data-testid="seo-bulk-regenerate-btn"
            >
              <Sparkles className="size-4 mr-2" />
              Regenerate ({selectedPages.length})
            </Button>
            <Button
              onClick={handleBulkAnalyze}
              disabled={bulkActionLoading}
              className="rounded-xl bg-[rgba(78,203,175,0.18)] border border-[rgba(78,203,175,0.4)] text-white hover:bg-[rgba(78,203,175,0.28)]"
              data-testid="seo-bulk-analyze-btn"
            >
              <TrendingUp className="size-4 mr-2" />
              Analyze ({selectedPages.length})
            </Button>
          </div>
        )}
      </div>
      
      {/* Pages Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-6 animate-spin text-[color:var(--kti-text-dim)]" />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="seo-pages-table">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPages(filteredPages.map(p => p.id));
                        } else {
                          setSelectedPages([]);
                        }
                      }}
                      className="size-4 rounded border-white/20 bg-white/[0.05]"
                      data-testid="seo-select-all-checkbox"
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-[color:var(--kti-text-dim)] uppercase">Path</th>
                  <th className="p-3 text-left text-xs font-medium text-[color:var(--kti-text-dim)] uppercase">Type</th>
                  <th className="p-3 text-left text-xs font-medium text-[color:var(--kti-text-dim)] uppercase">Score</th>
                  <th className="p-3 text-left text-xs font-medium text-[color:var(--kti-text-dim)] uppercase">Status</th>
                  <th className="p-3 text-left text-xs font-medium text-[color:var(--kti-text-dim)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-sm text-[color:var(--kti-text-faint)]">
                      Tidak ada halaman ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => {
                    const score = page.seo_score || 0;
                    const scoreColors = getScoreColor(score);
                    const hasMissing = !page.title || !page.description;
                    
                    return (
                      <tr key={page.id} className="border-b border-white/8 hover:bg-white/[0.02]">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPages([...selectedPages, page.id]);
                              } else {
                                setSelectedPages(selectedPages.filter(id => id !== page.id));
                              }
                            }}
                            className="size-4 rounded border-white/20 bg-white/[0.05]"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Globe className="size-4 text-[color:var(--kti-text-faint)]" />
                            <div>
                              <p className="text-sm font-medium text-white">{page.path}</p>
                              <p className="text-xs text-[color:var(--kti-text-faint)] truncate max-w-xs">{page.title || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium bg-white/[0.06] text-[color:var(--kti-text-dim)] border border-white/10">
                            {page.page_type}
                          </span>
                        </td>
                        <td className="p-3">
                          {score > 0 ? (
                            <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-semibold ${scoreColors.bg} ${scoreColors.text} border ${scoreColors.border}`}>
                              {score}
                            </div>
                          ) : (
                            <span className="text-xs text-[color:var(--kti-text-faint)]">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {hasMissing ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <AlertCircle className="size-3" /> Missing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle2 className="size-3" /> Complete
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => openDetailModal(page)}
                            className="text-xs text-[color:var(--kti-text-dim)] hover:text-white underline"
                            data-testid={`seo-view-detail-${page.id}`}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Enhanced Detail Modal with All Widgets */}
      {detailModalPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => {setDetailModalPage(null); setAnalysisData(null);}}>
          <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-white/12 bg-[#0D0F1A] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-semibold text-white truncate">SEO Detail</h2>
                <p className="text-sm text-[color:var(--kti-text-dim)] truncate">{detailModalPage.path}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => exportPdfReport(detailModalPage.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white hover:bg-white/[0.12] transition-colors"
                  data-testid="export-pdf-btn"
                >
                  <FileDown className="size-4" />
                  Export PDF
                </button>
                <button 
                  onClick={() => {setDetailModalPage(null); setAnalysisData(null);}} 
                  className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Metadata */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Metadata</h3>
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
                      <div>
                        <p className="text-xs text-[color:var(--kti-text-faint)] mb-1">Title ({detailModalPage.title?.length || 0} chars)</p>
                        <p className="text-sm text-white">{detailModalPage.title || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[color:var(--kti-text-faint)] mb-1">Description ({detailModalPage.description?.length || 0} chars)</p>
                        <p className="text-sm text-white">{detailModalPage.description || "-"}</p>
                      </div>
                      {detailModalPage.keywords && detailModalPage.keywords.length > 0 && (
                        <div>
                          <p className="text-xs text-[color:var(--kti-text-faint)] mb-2">Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {detailModalPage.keywords.map((kw, i) => (
                              <span key={i} className="rounded-full px-2 py-1 text-xs bg-white/[0.06] text-[color:var(--kti-text-dim)] border border-white/10">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Google SERP Preview */}
                  <GoogleSerpPreview
                    title={detailModalPage.title || ""}
                    description={detailModalPage.description || ""}
                    url={detailModalPage.path}
                  />
                  
                  {/* Social Preview */}
                  <SocialPreview
                    title={detailModalPage.og_title || detailModalPage.title || ""}
                    description={detailModalPage.og_description || detailModalPage.description || ""}
                    image={detailModalPage.og_image}
                    url={detailModalPage.path}
                  />
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Score History Chart */}
                  <ScoreHistoryChart 
                    historyData={scoreHistory} 
                    loading={historyLoading}
                  />
                  
                  {/* SEO Recommendations */}
                  <SeoRecommendations 
                    analysisData={analysisData}
                    loading={aiActionLoading && !analysisData}
                  />
                  
                  {/* AI Actions */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">AI Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={async () => {
                          setAiActionLoading(true);
                          try {
                            await api.post("/seo/ai/generate-meta", {
                              page_type: detailModalPage.page_type,
                              path: detailModalPage.path,
                              locale: detailModalPage.locale,
                              content_payload: { title: detailModalPage.title || "", description: detailModalPage.description || "" }
                            });
                            toast.success("Meta regenerated!");
                            await loadPages();
                            setDetailModalPage(null);
                          } catch (err) {
                            toast.error(apiError(err, "Failed"));
                          } finally {
                            setAiActionLoading(false);
                          }
                        }}
                        disabled={aiActionLoading}
                        className="w-full rounded-xl bg-[rgba(124,104,225,0.18)] border border-[rgba(124,104,225,0.4)] text-white hover:bg-[rgba(124,104,225,0.28)]"
                        data-testid="modal-regenerate-btn"
                      >
                        <Sparkles className="size-4 mr-2" /> Regenerate Meta
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          setAiActionLoading(true);
                          try {
                            const res = await api.post("/seo/ai/analyze", {
                              path: detailModalPage.path,
                              title: detailModalPage.title || "",
                              description: detailModalPage.description || "",
                              content: detailModalPage.description || "",
                              locale: detailModalPage.locale
                            });
                            setAnalysisData(res.data?.data);
                            
                            // Save score snapshot for history
                            const score = res.data?.data?.score || 0;
                            await api.post(`/seo/pages/${detailModalPage.id}/score-snapshot`);
                            
                            // Reload history
                            const histRes = await api.get(`/seo/pages/${detailModalPage.id}/score-history`);
                            setScoreHistory(histRes.data?.data || []);
                            
                            toast.success("Analysis complete!");
                          } catch (err) {
                            toast.error(apiError(err, "Failed"));
                          } finally {
                            setAiActionLoading(false);
                          }
                        }}
                        disabled={aiActionLoading}
                        className="w-full rounded-xl bg-[rgba(78,203,175,0.18)] border border-[rgba(78,203,175,0.4)] text-white hover:bg-[rgba(78,203,175,0.28)]"
                        data-testid="modal-analyze-btn"
                      >
                        <TrendingUp className="size-4 mr-2" /> Analyze SEO
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
