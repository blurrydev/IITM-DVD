"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { Clock, AlertTriangle, Layers, TrendingDown, ArrowRight } from "lucide-react";

interface FulfillmentCliffProps {
  data: {
    satisfaction_cliff: Array<{
      bucket: string;
      avg_score: number;
      one_star_pct: number;
      five_star_pct: number;
      order_count: number;
    }>;
    root_cause_analysis: Array<{
      delay_bucket: string;
      seller_handling_score: number;
      carrier_transit_score: number;
      seller_count: number;
      carrier_count: number;
    }>;
    logistics_complexity: Array<{
      sellers_category: string;
      avg_review_score: number;
      order_count: number;
      one_star_pct: number;
    }>;
  };
}

export const FulfillmentCliffView: React.FC<FulfillmentCliffProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Visual 1: The Satisfaction Cliff */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Visual 1
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Satisfaction Cliff &amp; Delivery Duration Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clustered bar chart measuring Average Review Score and 1-Star Review Share across delivery duration tiers.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-rose-50/70 border border-rose-200/80 px-4 py-2.5 rounded-xl">
            <TrendingDown className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900">Critical 25+ Day Drop-off</p>
              <p className="text-[11px] text-rose-700">
                Average review collapses to <strong>2.61 stars</strong> (43.6% 1-star ratings).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.satisfaction_cliff}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  label={{ value: "Avg Review Score (Stars)", angle: -90, position: "insideLeft", offset: 15, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 60]}
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#f43f5e", fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                            Delivery Bucket: {label}
                          </p>
                          <p className="text-amber-400 font-semibold">
                            Avg Review Score: {item.avg_score} / 5.0
                          </p>
                          <p className="text-rose-400">
                            1-Star Share: {item.one_star_pct}%
                          </p>
                          <p className="text-emerald-400">
                            5-Star Share: {item.five_star_pct}%
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            Orders: {item.order_count.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                />
                <Bar
                  yAxisId="left"
                  dataKey="avg_score"
                  name="Avg Review Score (Stars)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {data.satisfaction_cliff.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.bucket === "25+d" ? "#f43f5e" : entry.bucket === "16-25d" ? "#fb923c" : "#3b82f6"}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="right"
                  dataKey="one_star_pct"
                  name="1-Star Review Rate (%)"
                  fill="#fecdd3"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Executive Takeaway
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                The Non-Linear Severity Cliff
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Between 0 and 15 days, customer rating stays resiliently high (~4.2 stars). The degradation steepens after 16 days, plummeting into a cliff at <strong>25+ days</strong>.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Action Guideline</span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                Target exception mitigation to truncate the 25+ day tail rather than marginally expediting 3-5 day orders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual 2 & Visual 4: Root Cause & Logistics Complexity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 2: Root Cause Analysis (Seller vs Carrier) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    Visual 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Root Cause Analysis (Seller vs. Carrier)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of review degradation across Seller Handling vs. Carrier Transit.
                </p>
              </div>
            </div>

            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.root_cause_analysis}
                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="delay_bucket"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[2.5, 4.5]}
                    ticks={[2.5, 3.0, 3.5, 4.0, 4.5]}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                            <p className="font-bold text-slate-200">{label} Delay Duration</p>
                            <p className="text-amber-400">
                              Seller Handling Score: {payload[0]?.value} / 5.0
                            </p>
                            <p className="text-indigo-400">
                              Carrier Transit Score: {payload[1]?.value} / 5.0
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar
                    dataKey="seller_handling_score"
                    name="Seller Handling Stage"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="carrier_transit_score"
                    name="Carrier Transit Stage"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 bg-amber-50/60 border border-amber-200/70 p-3 rounded-xl">
            <p className="text-xs text-amber-900 leading-normal">
              <strong>Owner Assignment:</strong> Carrier Transit exhibits a significantly sharper slope of satisfaction loss than seller handling, confirming carrier routing & transit bottlenecks are the primary culprit.
            </p>
          </div>
        </div>

        {/* Visual 4: Logistics Complexity Indicator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    Visual 4
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Logistics Complexity Indicator
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order split impact: Satisfaction by count of distinct sellers per order.
                </p>
              </div>
            </div>

            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.logistics_complexity}
                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="sellers_category"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[1.0, 5.0]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                            <p className="font-bold text-slate-200">{label}</p>
                            <p className="text-purple-400">
                              Avg Review Score: {item.avg_review_score} / 5.0
                            </p>
                            <p className="text-rose-400">
                              1-Star Share: {item.one_star_pct}%
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Total Orders: {item.order_count.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="avg_review_score"
                    name="Avg Review Score"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  >
                    {data.logistics_complexity.map((entry, index) => (
                      <Cell
                        key={`cell-c-${index}`}
                        fill={index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 bg-purple-50/60 border border-purple-200/70 p-3 rounded-xl">
            <p className="text-xs text-purple-900 leading-normal">
              <strong>Split-Order Penalty:</strong> 1-seller orders average <strong>4.12 stars</strong>, while multi-seller split orders immediately drop to <strong>2.88 stars</strong>. Unified cart delivery tracking is urgently needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
