"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { Layers } from "lucide-react";

interface CategoryRiskProps {
  data: any;
}

export const CategoryRiskAnalysis: React.FC<CategoryRiskProps> = ({ data }) => {
  const { category_data } = data;
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("All");

  const quadrants = [
    "All",
    "Growth Engines (High Vol, High CSAT)",
    "High-Risk Giants (High Vol, Low CSAT)",
    "Niche Stars (Low Vol, High CSAT)",
    "Underperformers (Low Vol, Low CSAT)",
  ];

  const filteredCategories =
    selectedQuadrant === "All"
      ? category_data
      : category_data.filter((c: any) => c.quadrant === selectedQuadrant);

  const getQuadrantColor = (quadrant: string) => {
    if (quadrant.includes("Growth Engines")) return "#10B981"; // green
    if (quadrant.includes("High-Risk Giants")) return "#EF4444"; // red
    if (quadrant.includes("Niche Stars")) return "#3B82F6"; // blue
    return "#F59E0B"; // amber
  };

  return (
    <div className="space-y-6">
      {/* Strategic Header */}
      <div className="p-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Category Quality vs Volume Matrix
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Identify which product categories generate high transaction volume but suffer from customer friction due to bulky freight, long handling, or delivery challenges.
            </p>
          </div>
          {/* Quadrant Filters */}
          <div className="flex flex-wrap gap-1.5">
            {quadrants.map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuadrant(q)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedQuadrant === q
                    ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {q === "All" ? "All Categories" : q.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Scatter / Quadrant Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Volume vs Customer Satisfaction (CSAT)</h3>
              <p className="text-xs text-slate-500">Bubble size indicates Freight Cost Burden Ratio (%)</p>
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  dataKey="total_items"
                  name="Sales Volume"
                  stroke="#94A3B8"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  label={{ value: "Total Items Sold", position: "insideBottom", offset: -10, fill: "#64748B", fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="avg_score"
                  name="Avg Review Score"
                  domain={[3.5, 4.5]}
                  stroke="#94A3B8"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  label={{ value: "Avg Rating (1-5★)", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="freight_ratio" range={[60, 400]} name="Freight Ratio" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1">{data.category_eng}</div>
                          <div className="flex justify-between text-slate-600">
                            <span>Rating:</span> <strong className="text-amber-500">{data.avg_score} ★</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Total Volume:</span> <strong className="text-slate-900">{data.total_items.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Late Delivery %:</span> <strong className="text-rose-600">{data.late_pct}%</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Avg Freight Ratio:</span> <strong className="text-blue-600">{data.freight_ratio}%</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={filteredCategories}>
                  {filteredCategories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} fillOpacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Category Table / Risk List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Category Profiles</h3>
            <p className="text-xs text-slate-500">Ranked by volume & risk flags</p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
            {filteredCategories.slice(0, 8).map((cat: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 truncate max-w-[150px]">{cat.category_eng}</span>
                  <span className="text-amber-500 font-bold">{cat.avg_score} ★</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>{cat.total_items.toLocaleString()} items</span>
                  <span className={`${cat.late_pct > 8 ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}`}>
                    {cat.late_pct}% late
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (cat.avg_score / 5) * 100)}%`,
                      backgroundColor: getQuadrantColor(cat.quadrant),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            <strong>Key Insight:</strong> Bulky categories (Furniture, Office) face up to <strong>14% late rates</strong> due to freight carrier bottlenecks, dragging down overall platform CSAT.
          </div>
        </div>
      </div>
    </div>
  );
};
