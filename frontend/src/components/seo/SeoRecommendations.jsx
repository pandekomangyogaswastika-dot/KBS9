import { TrendingUp, AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";

/**
 * SeoRecommendations - Phase 11.D
 * Display AI-generated SEO analysis results with checks and recommendations
 */
export default function SeoRecommendations({ analysisData, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="ml-3 text-sm text-[color:var(--kti-text-dim)]">Analyzing SEO...</p>
        </div>
      </div>
    );
  }
  
  if (!analysisData) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3 text-[color:var(--kti-text-dim)]">
          <Info className="size-5" />
          <p className="text-sm">Click "Analyze SEO (AI)" to get recommendations</p>
        </div>
      </div>
    );
  }
  
  const { score = 0, checks = [], recommendations = [] } = analysisData;
  
  // Score color
  const getScoreColor = (s) => {
    if (s >= 80) return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" };
    if (s >= 60) return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40" };
    return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" };
  };
  
  const scoreColors = getScoreColor(score);
  
  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="flex items-center gap-4">
        <div className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-2xl font-bold border ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border}`}>
          <TrendingUp className="size-6" />
          {score}/100
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">SEO Score</h3>
          <p className="text-xs text-[color:var(--kti-text-faint)]">
            {score >= 80 && "Excellent - Ready for production"}
            {score >= 60 && score < 80 && "Good - Minor improvements needed"}
            {score < 60 && "Needs work - Follow recommendations below"}
          </p>
        </div>
      </div>
      
      {/* Checks */}
      {checks.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Checks</h4>
          <div className="space-y-2">
            {checks.map((check, i) => {
              const status = check.status || "pass";
              const icon = status === "pass" ? CheckCircle2 : status === "warning" ? AlertCircle : AlertCircle;
              const color = status === "pass" ? "text-green-400" : status === "warning" ? "text-yellow-400" : "text-red-400";
              
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-white/6 bg-white/[0.02] p-3">
                  {React.createElement(icon, { className: `size-4 mt-0.5 ${color}` })}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{check.name}</p>
                    <p className="text-xs text-[color:var(--kti-text-dim)] mt-0.5">{check.message}</p>
                  </div>
                  {check.score && (
                    <span className="shrink-0 text-xs font-semibold text-[color:var(--kti-text-dim)]">
                      {check.score}/10
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-[rgba(124,104,225,0.3)] bg-[rgba(124,104,225,0.08)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">AI Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white">
                <span className="shrink-0 mt-1 size-1.5 rounded-full bg-purple-400" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import React from "react";