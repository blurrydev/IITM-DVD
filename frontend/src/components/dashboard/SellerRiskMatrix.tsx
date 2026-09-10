"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Users, AlertTriangle, Sliders, CheckCircle } from "lucide-react";

interface SellerRiskProps {
  data: any;
}

export const SellerRiskMatrix: React.FC<SellerRiskProps> = ({ data }) => {
  const { seller_data, seller_tier_summary } = data;
  const [lateThreshold, setLateThreshold] = useState<number>(10);
  const [minVolume, setMinVolume] = useState<number>(30);

  // Filter sellers dynamically based on leadership policy sliders
  const activeSellers = seller_data.filter((s: any) => s.total_items >= minVolume);
  const breachedSellers = activeSellers.filter((s: any) => s.pct_late >= lateThreshold);
  const atRiskRevenue = breachedSellers.reduce((sum: number, s: any) => sum + s.total_revenue, 0);
  const totalActiveRevenue = activeSellers.reduce((sum: number, s: any) => sum + s.total_revenue, 0);
  const revenueImpactPct = totalActiveRevenue > 0 ? ((atRiskRevenue / totalActiveRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Policy Simulation Banner */}
      <div className="p-6 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Seller SLA Enforcement & Quality Governance
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Simulate the impact of establishing a strict Late Dispatch Policy on merchants. What portion of sellers and GMV is penalized to protect customer satisfaction?
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Late SLA Threshold:</span>
                <span className="text-amber-600 font-bold">{lateThreshold}% late orders</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(Number(e.target.value))}
                className="w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SLA Policy Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged Merchants (&gt;{lateThreshold}%)</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {breachedSellers.length} <span className="text-sm font-normal text-slate-500">/ {activeSellers.length} active</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {((breachedSellers.length / activeSellers.length) * 100).toFixed(1)}% of merchant base
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">At-Risk GMV Exposure</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            R$ {(atRiskRevenue / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {revenueImpactPct}% of tracked GMV
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CSAT of Flagged Merchants</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {breachedSellers.length > 0
              ? (
                  breachedSellers.reduce((acc: number, s: any) => acc + s.avg_score, 0) /
                  breachedSellers.length
                ).toFixed(2)
              : "N/A"}{" "}
            ★
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Significant contributor to 1-star reviews
          </div>
        </div>
      </div>

      {/* Seller Distribution Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Top High-Volume Merchants & Delay Rates</h3>
            <span className="text-xs text-slate-500">Ranked by volume</span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeSellers.slice(0, 15)}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="seller_id"
                  stroke="#94A3B8"
                  tick={{ fill: "#64748B", fontSize: 10 }}
                  tickFormatter={(id) => id.substring(0, 6)}
                />
                <YAxis stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any, name: any) => [
                    name === "pct_late" ? `${val}%` : val,
                    name === "pct_late" ? "Late Delivery %" : name,
                  ]}
                />
                <Bar dataKey="pct_late" name="Late Delivery %" radius={[6, 6, 0, 0]}>
                  {activeSellers.slice(0, 15).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pct_late >= lateThreshold ? "#EF4444" : "#10B981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Actions / Governance Tiers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Governance Actions</h3>
            <p className="text-xs text-slate-500">Targeted interventions to balance growth and satisfaction</p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-rose-900">Tier 1: Fulfillment Throttle</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  Sellers with &gt;15% late dispatch rate and &lt;3.5★ CSAT are temporarily suppressed from search until backlog clears.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-900">Tier 2: SLA Warning & Handling Buffer</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  Sellers exceeding {lateThreshold}% late orders receive automated SLA warnings and extended delivery promises on PDP.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-900">Tier 3: Buy-Box Boost for Star Sellers</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  Reward merchants maintaining &gt;4.3★ and &lt;5% late dispatch with lower commission rates and search ranking priority.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
