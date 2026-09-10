"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { Clock, Truck, AlertOctagon, Info } from "lucide-react";

interface DeliveryJourneyProps {
  data: any;
}

export const DeliveryJourneyAnalysis: React.FC<DeliveryJourneyProps> = ({ data }) => {
  const { delay_impact, score_journey } = data;

  return (
    <div className="space-y-6">
      {/* Root Cause Header Banner */}
      <div className="p-6 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/80 via-white to-orange-50/50 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 mt-1">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Fulfillment Delay &amp; SLA Performance
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Customer satisfaction does not scale gradually with transit speed — it falls off a steep cliff the instant an order passes its <strong>Estimated Delivery Date</strong>. Orders arriving even 1–3 days late suffer an explosion in 1-star reviews from <strong>4.8% to 54.1%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Delay Buckets & Review Score Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Review Score by Delivery Delay Bracket</h3>
              <p className="text-xs text-slate-500">Actual Delivery Date vs Promised Checkout Estimate</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Avg Score (1-5★)
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delay_impact} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="delay_bucket" 
                  stroke="#94A3B8" 
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94A3B8" domain={[1, 5]} tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any) => [`${val} ★`, "Average Score"]}
                />
                <Bar dataKey="avg_review_score" name="Average Review Score" radius={[6, 6, 0, 0]}>
                  {delay_impact.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.avg_review_score >= 4.0
                          ? "#10B981"
                          : entry.avg_review_score >= 3.0
                          ? "#F59E0B"
                          : "#EF4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-slate-500 block text-[10px] font-medium uppercase">On-Time 5★ Rate</span>
              <span className="text-emerald-700 font-bold text-sm">62.8%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-slate-500 block text-[10px] font-medium uppercase">1-3d Late 1★ Rate</span>
              <span className="text-amber-700 font-bold text-sm">54.1%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-slate-500 block text-[10px] font-medium uppercase">&gt;7d Late 1★ Rate</span>
              <span className="text-rose-700 font-bold text-sm">82.6%</span>
            </div>
          </div>
        </div>

        {/* Lead Time Breakdown: Handling vs Transit Days */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Journey Lead Times by Customer Rating</h3>
              <p className="text-xs text-slate-500">Comparing Seller Dispatch vs Carrier Transit Lead Times</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Days Spent
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={score_journey} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="review_score" 
                  stroke="#94A3B8" 
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickFormatter={(v) => `${v} ★ Rating`}
                />
                <YAxis stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any, name: any) => [`${val} days`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="avg_handling" name="Seller Handling (Days)" stackId="a" fill="#6366F1" />
                <Bar dataKey="avg_transit" name="Carrier Transit (Days)" stackId="a" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              1-Star orders take an average of <strong>19.8 days</strong> in transit compared to <strong>10.2 days</strong> for 5-Star orders. Seller handling time accounts for an extra ~2.5 days on poorly rated shipments.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
