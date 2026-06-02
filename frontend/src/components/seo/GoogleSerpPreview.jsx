import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * GoogleSerpPreview - Phase 11.D
 * Visual preview of how title & description appear in Google Search Results
 */
export default function GoogleSerpPreview({ title = "", description = "", url = "" }) {
  const titleLength = title.length;
  const descLength = description.length;
  
  // SEO recommendations
  const titleStatus = titleLength === 0 ? "empty" : titleLength > 60 ? "warning" : titleLength < 40 ? "short" : "good";
  const descStatus = descLength === 0 ? "empty" : descLength > 160 ? "warning" : descLength < 120 ? "short" : "good";
  
  const displayTitle = title || "Untitled Page";
  const displayDesc = description || "No meta description provided. Google may generate its own snippet from page content.";
  const displayUrl = url || "https://example.com/page-url";
  
  // Truncate for display (Google typically shows ~60 chars title, ~160 desc)
  const truncatedTitle = titleLength > 60 ? displayTitle.substring(0, 57) + "..." : displayTitle;
  const truncatedDesc = descLength > 160 ? displayDesc.substring(0, 157) + "..." : displayDesc;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Google Search Preview</h3>
        <div className="flex items-center gap-2 text-xs">
          {titleStatus === "good" && <CheckCircle2 className="size-3 text-green-400" />}
          {titleStatus === "warning" && <AlertCircle className="size-3 text-yellow-400" />}
          {titleStatus === "short" && <AlertCircle className="size-3 text-blue-400" />}
          {titleStatus === "empty" && <AlertCircle className="size-3 text-red-400" />}
        </div>
      </div>
      
      {/* Google SERP Mock */}
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 space-y-1" data-testid="serp-preview">
        {/* Breadcrumb / URL */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#70757a]">https://kubusteknologi.com › </span>
          <span className="text-[#70757a] truncate">{displayUrl.replace(/^https?:\/\/[^\/]+\/?/, "")}</span>
        </div>
        
        {/* Title (Blue Link) */}
        <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-normal leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
          {truncatedTitle}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#4d5156] leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
          {truncatedDesc}
        </p>
      </div>
      
      {/* Character Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[color:var(--kti-text-faint)]">Title Length</span>
            <span className={`text-xs font-semibold ${
              titleStatus === "good" ? "text-green-400" :
              titleStatus === "warning" ? "text-yellow-400" :
              titleStatus === "short" ? "text-blue-400" : "text-red-400"
            }`}>
              {titleLength}/60
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div 
              className={`h-full transition-all ${
                titleStatus === "good" ? "bg-green-500" :
                titleStatus === "warning" ? "bg-yellow-500" :
                titleStatus === "short" ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min((titleLength / 60) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[color:var(--kti-text-faint)]">
            {titleStatus === "good" && "Perfect length"}
            {titleStatus === "warning" && "Too long, will be truncated"}
            {titleStatus === "short" && "Could be more descriptive"}
            {titleStatus === "empty" && "Missing title"}
          </p>
        </div>
        
        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[color:var(--kti-text-faint)]">Description Length</span>
            <span className={`text-xs font-semibold ${
              descStatus === "good" ? "text-green-400" :
              descStatus === "warning" ? "text-yellow-400" :
              descStatus === "short" ? "text-blue-400" : "text-red-400"
            }`}>
              {descLength}/160
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div 
              className={`h-full transition-all ${
                descStatus === "good" ? "bg-green-500" :
                descStatus === "warning" ? "bg-yellow-500" :
                descStatus === "short" ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min((descLength / 160) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[color:var(--kti-text-faint)]">
            {descStatus === "good" && "Optimal length"}
            {descStatus === "warning" && "Too long, will be cut off"}
            {descStatus === "short" && "Could add more detail"}
            {descStatus === "empty" && "Missing description"}
          </p>
        </div>
      </div>
    </div>
  );
}