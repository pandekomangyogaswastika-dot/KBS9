import { useState } from "react";
import { Globe, Twitter } from "lucide-react";

/**
 * SocialPreview - Phase 11.D
 * Visual preview of Open Graph (Facebook/LinkedIn/WhatsApp) and Twitter Card
 */
export default function SocialPreview({ 
  title = "", 
  description = "", 
  image = "",
  siteName = "Kubus Teknologi Indonesia",
  url = ""
}) {
  const [previewType, setPreviewType] = useState("og"); // og | twitter
  
  const displayTitle = title || "Untitled Page";
  const displayDesc = description || "No description provided.";
  const displayImage = image || "https://via.placeholder.com/1200x630/1a1a2e/4ecbaf?text=KTI";
  const displayUrl = url || "kubusteknologi.com";
  
  // Truncate for realistic display
  const truncatedTitle = displayTitle.length > 70 ? displayTitle.substring(0, 67) + "..." : displayTitle;
  const truncatedDesc = displayDesc.length > 200 ? displayDesc.substring(0, 197) + "..." : displayDesc;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Social Media Preview</h3>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
          <button
            onClick={() => setPreviewType("og")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              previewType === "og" 
                ? "bg-white/[0.08] text-white" 
                : "text-[color:var(--kti-text-dim)] hover:text-white"
            }`}
            data-testid="preview-og-btn"
          >
            <Globe className="size-3" />
            Open Graph
          </button>
          <button
            onClick={() => setPreviewType("twitter")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              previewType === "twitter" 
                ? "bg-white/[0.08] text-white" 
                : "text-[color:var(--kti-text-dim)] hover:text-white"
            }`}
            data-testid="preview-twitter-btn"
          >
            <Twitter className="size-3" />
            Twitter
          </button>
        </div>
      </div>
      
      {/* Preview Card */}
      {previewType === "og" ? (
        // Facebook / LinkedIn / WhatsApp style
        <div className="rounded-xl border border-white/8 bg-white overflow-hidden" data-testid="og-preview">
          {/* Image */}
          <div className="aspect-[1.91/1] bg-gray-200 relative overflow-hidden">
            <img 
              src={displayImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://via.placeholder.com/1200x630/1a1a2e/4ecbaf?text=Image+Error"; }}
            />
          </div>
          
          {/* Content */}
          <div className="bg-[#f2f3f5] p-3 border-t border-gray-300">
            <p className="text-[10px] text-gray-500 uppercase mb-0.5">{displayUrl}</p>
            <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{truncatedTitle}</h4>
            <p className="text-xs text-gray-600 leading-snug">{truncatedDesc}</p>
          </div>
        </div>
      ) : (
        // Twitter Card style
        <div className="rounded-2xl border border-[#2f3336] bg-black overflow-hidden" data-testid="twitter-preview">
          {/* Image */}
          <div className="aspect-[2/1] bg-gray-800 relative overflow-hidden">
            <img 
              src={displayImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://via.placeholder.com/1200x600/1a1a2e/4ecbaf?text=Image+Error"; }}
            />
          </div>
          
          {/* Content */}
          <div className="p-3 border-t border-[#2f3336]">
            <p className="text-[10px] text-[#71767b] mb-1">{displayUrl}</p>
            <h4 className="text-sm font-semibold text-[#e7e9ea] leading-tight mb-1">{truncatedTitle}</h4>
            <p className="text-xs text-[#71767b] leading-snug">{truncatedDesc}</p>
          </div>
        </div>
      )}
      
      {/* Info */}
      <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
        <p className="text-xs text-[color:var(--kti-text-faint)] leading-relaxed">
          <span className="font-semibold text-white">💡 Tip:</span> {previewType === "og" 
            ? "This preview shows how your link will appear on Facebook, LinkedIn, and WhatsApp. Image should be 1200x630px for best results." 
            : "This preview shows how your link will appear on Twitter/X. Image should be 1200x600px (2:1 ratio) for summary_large_image cards."}
        </p>
      </div>
    </div>
  );
}