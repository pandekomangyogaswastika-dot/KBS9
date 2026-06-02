import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * ScoreHistoryChart - Phase 11.D
 * Display SEO score trend over time using recharts
 */
export default function ScoreHistoryChart({ historyData = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="ml-3 text-sm text-[color:var(--kti-text-dim)]">Loading history...</p>
        </div>
      </div>
    );
  }
  
  if (!historyData || historyData.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Score History</h3>
        <div className="flex items-center justify-center py-12 text-[color:var(--kti-text-faint)]">
          <p className="text-sm">No history data available yet. Run analysis to track score over time.</p>
        </div>
      </div>
    );
  }
  
  // Calculate trend
  const firstScore = historyData[0]?.score || 0;
  const lastScore = historyData[historyData.length - 1]?.score || 0;
  const scoreDiff = lastScore - firstScore;
  const trendIcon = scoreDiff > 0 ? TrendingUp : scoreDiff < 0 ? TrendingDown : Minus;
  const trendColor = scoreDiff > 0 ? "text-green-400" : scoreDiff < 0 ? "text-red-400" : "text-gray-400";
  
  // Format data for recharts
  const chartData = historyData.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
    score: item.score,
    fullDate: new Date(item.timestamp).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
  }));
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Score History</h3>
        <div className="flex items-center gap-2">
          {React.createElement(trendIcon, { className: `size-4 ${trendColor}` })}
          <span className={`text-sm font-semibold ${trendColor}`}>
            {scoreDiff > 0 && "+"}{scoreDiff.toFixed(0)}
          </span>
        </div>
      </div>
      
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.3)" 
              style={{ fontSize: "11px" }}
              tick={{ fill: "rgba(255,255,255,0.5)" }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="rgba(255,255,255,0.3)" 
              style={{ fontSize: "11px" }}
              tick={{ fill: "rgba(255,255,255,0.5)" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(13, 15, 26, 0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fff"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#4ecbaf" 
              strokeWidth={2}
              dot={{ fill: "#4ecbaf", r: 4 }}
              activeDot={{ r: 6 }}
              name="SEO Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-center">
          <p className="text-[color:var(--kti-text-faint)] mb-0.5">First</p>
          <p className="text-white font-semibold">{firstScore}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-center">
          <p className="text-[color:var(--kti-text-faint)] mb-0.5">Latest</p>
          <p className="text-white font-semibold">{lastScore}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-center">
          <p className="text-[color:var(--kti-text-faint)] mb-0.5">Change</p>
          <p className={`font-semibold ${trendColor}`}>
            {scoreDiff > 0 && "+"}{scoreDiff.toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from "react";