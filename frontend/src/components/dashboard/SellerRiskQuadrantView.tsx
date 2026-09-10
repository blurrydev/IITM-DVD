"use client";

import React, { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Users, AlertOctagon, TrendingUp, Filter, Info } from "lucide-react";

interface SellerRiskProps {
  data: {
    seller_risk_quadrant: {
      platform_avg_revenue: number;
      platform_avg_score: number;
      score_p25_cutoff: number;
      sellers: Array<{
        seller_id: string;
        full_seller_id: string;
        revenue: number;
        avg_review_score: number;
        orders: number;
        late_rate: number;
        state: string;
        in_pareto_80: boolean;
        is_top_risk: boolean;
        rank: number;
      }>;
    };
    order_splitting_matrix: Array<{
      sellers_cat: string;
      sellers_x: number;
      items_cat: string;
      items_y: number;
      order_count: number;
      total_revenue: number;
      avg_review_score: number;
    }>;
  };
}

export const SellerRiskQuadrantView: React.FC<SellerRiskProps> = ({ data }) => {
  const [filterMode, setFilterMode] = useState<"all" | "top_risk" | "pareto">("all");
  const { seller_risk_quadrant, order_splitting_matrix } = data;

  const filteredSellers = seller_risk_quadrant.sellers.filter((s) => {
    if (filterMode === "top_risk") return s.is_top_risk;
    if (filterMode === "pareto") return s.in_pareto_80;
    return true;
  });

  const top5RiskSellers = seller_risk_quadrant.sellers.filter((s) => s.is_top_risk);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Visual 3 & Visual 9: High Value Seller Risk & Pareto Shading */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Visual 3 &amp; 9
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                High-Value Seller Risk &amp; Pareto Quadrant Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Scatter plot with platform average reference lines and annotated Top 5 High-Revenue / Low-Satisfaction sellers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Highlight:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterMode === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Sellers
              </button>
              <button
                onClick={() => setFilterMode("pareto")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterMode === "pareto" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pareto Top 20%
              </button>
              <button
                onClick={() => setFilterMode("top_risk")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterMode === "top_risk" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top 5 Risk
              </button>
            </div>
          </div>
        </div>

        {/* Top 5 High-Volume / Low-Rating Callouts */}
        <div className="mt-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Annotated Top 5 High-Revenue Sellers in Bottom 25th Score Percentile
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {top5RiskSellers.map((seller, idx) => (
              <div
                key={seller.full_seller_id}
                className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    Risk #{idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">{seller.state}</span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                  {seller.seller_id}
                </p>
                <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                  <p>Rev: <strong className="text-slate-900">R$ {seller.revenue.toLocaleString()}</strong></p>
                  <p>Rating: <strong className="text-rose-600">{seller.avg_review_score} / 5.0</strong></p>
                  <p>Late Rate: <strong className="text-amber-700">{seller.late_rate}%</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="revenue"
                  name="Total Revenue (R$)"
                  domain={[0, "auto"]}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  label={{ value: "Total Revenue per Seller (R$)", position: "insideBottom", offset: -10, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <YAxis
                  type="number"
                  dataKey="avg_review_score"
                  name="Avg Review Score"
                  domain={[1.0, 5.0]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Avg Review Score", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <ZAxis type="number" dataKey="orders" range={[40, 260]} name="Orders" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                            <span className="font-mono font-bold text-slate-200">{d.seller_id}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{d.state}</span>
                          </div>
                          <p className="text-emerald-400">Total Revenue: R$ {d.revenue.toLocaleString()}</p>
                          <p className="text-amber-400">Avg Review Score: {d.avg_review_score} / 5.0</p>
                          <p className="text-slate-300">Total Orders: {d.orders}</p>
                          <p className="text-rose-400">Late Rate: {d.late_rate}%</p>
                          {d.is_top_risk && (
                            <p className="text-rose-300 font-bold text-[10px] bg-rose-950/80 px-2 py-0.5 rounded mt-1">
                              CRITICAL RISK: High Revenue + Low Rating
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Platform Average Reference Lines */}
                <ReferenceLine
                  y={seller_risk_quadrant.platform_avg_score}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: `Avg Score (${seller_risk_quadrant.platform_avg_score})`, position: "top", fill: "#64748b", fontSize: 10 }}
                />
                <ReferenceLine
                  x={seller_risk_quadrant.platform_avg_revenue}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: "Avg Rev", position: "insideTopRight", fill: "#64748b", fontSize: 10 }}
                />
                <Scatter name="Sellers" data={filteredSellers}>
                  {filteredSellers.map((entry, index) => {
                    let fillColor = "#3b82f6";
                    if (entry.is_top_risk) fillColor = "#e11d48";
                    else if (entry.avg_review_score < seller_risk_quadrant.platform_avg_score) fillColor = "#f59e0b";
                    else if (entry.in_pareto_80) fillColor = "#10b981";
                    return <Cell key={`cell-s-${index}`} fill={fillColor} fillOpacity={0.8} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Commercial Concentration
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Pareto Revenue Principle
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The top 1% of sellers produce <strong>26.1%</strong> of marketplace revenue, and the top 10% generate <strong>67.5%</strong>.
              </p>
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-[11px] text-rose-800 leading-normal">
                  <strong>High-Stakes Remediation:</strong> Disqualifying low-scoring sellers blindly would destroy volume. Target the 5 annotated high-volume sellers with VIP account management and dedicated courier handoffs.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span>Top 5 High-Revenue Risk Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Pareto High-Performing Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Below Platform Average Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual 7: The "Order Splitting" Matrix Bubble Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Visual 7
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Order Splitting &amp; Multi-Item Fulfillment Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Matrix comparing Distinct Sellers (X-axis) vs. Total Items in Order (Y-axis). Bubble Size = Total Revenue, Bubble Color = Average Review Score.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> 4.0+ Stars
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> 3.0-3.9 Stars
            <span className="inline-block w-3 h-3 rounded-full bg-rose-500" /> &lt;3.0 Stars
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="sellers_x"
                  name="Sellers in Order"
                  domain={[0.5, 4.5]}
                  ticks={[1, 2, 3, 4]}
                  tickFormatter={(val) => (val === 4 ? "4+ Sellers" : `${val} Seller${val > 1 ? "s" : ""}`)}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Number of Sellers in Order", position: "insideBottom", offset: -10, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <YAxis
                  type="number"
                  dataKey="items_y"
                  name="Total Items in Order"
                  domain={[0.5, 4.5]}
                  ticks={[1, 2, 3, 4]}
                  tickFormatter={(val) => (val === 4 ? "4+ Items" : `${val} Item${val > 1 ? "s" : ""}`)}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Total Items in Order", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <ZAxis type="number" dataKey="total_revenue" range={[100, 1400]} name="Revenue" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                            {d.sellers_cat} &bull; {d.items_cat}
                          </p>
                          <p className="text-emerald-400">Total Revenue: R$ {d.total_revenue.toLocaleString()}</p>
                          <p className="text-amber-400">Avg Review Score: {d.avg_review_score} / 5.0</p>
                          <p className="text-slate-300">Order Volume: {d.order_count.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Order Matrix" data={order_splitting_matrix}>
                  {order_splitting_matrix.map((entry, index) => {
                    let fillColor = "#10b981";
                    if (entry.avg_review_score < 3.0) fillColor = "#ef4444";
                    else if (entry.avg_review_score < 3.8) fillColor = "#f59e0b";
                    return <Cell key={`cell-m-${index}`} fill={fillColor} fillOpacity={0.8} stroke="#ffffff" strokeWidth={2} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                Matrix Dynamics
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Multi-Package Friction
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                When customers order 2+ items from a single seller, satisfaction remains robust (4.1 stars). But when an order is split across 2+ distinct sellers, satisfaction plummets below 3.0 stars regardless of item count.
              </p>
            </div>
            <div className="pt-3 border-t border-indigo-200/60 text-xs text-indigo-900">
              <strong>Recommendation:</strong> Introduce split-delivery notifications at checkout with estimated split arrival dates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
