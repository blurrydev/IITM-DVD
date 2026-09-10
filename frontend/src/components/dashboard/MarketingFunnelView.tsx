"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Target } from "lucide-react";

interface MarketingFunnelProps {
  data: any;
}

export const MarketingFunnelView: React.FC<MarketingFunnelProps> = ({ data }) => {
  const { funnel_origin, funnel_segments } = data;

  return (
    <div className="space-y-6">
      {/* Marketing Header */}
      <div className="p-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 mt-1">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Seller Acquisition Funnel & Quality by Inbound Channel
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Analyze where new merchants are acquired (Organic, Paid Search, Social, Referral) and how their business segment profiles correlate with long-term marketplace revenue and fulfillment reliability.
            </p>
          </div>
        </div>
      </div>

      {/* Origin Channels & Segment Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Deals by Lead Origin */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Closed Merchant Deals by Acquisition Channel</h3>
              <p className="text-xs text-slate-500">Total onboarded sellers per origin channel</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel_origin} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="origin" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any) => [`${val} merchants`, "Closed Deals"]}
                />
                <Bar dataKey="closed_deals" name="Closed Deals" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Business Segments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Onboarded Merchant Segments</h3>
              <p className="text-xs text-slate-500">Volume of closed merchant leads by category</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel_segments.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis type="category" dataKey="business_segment" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any) => [`${val} merchants`, "Merchant Count"]}
                />
                <Bar dataKey="seller_count" name="Merchant Count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
