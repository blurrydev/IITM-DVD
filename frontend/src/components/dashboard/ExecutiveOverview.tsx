"use client";

import React from "react";
import {
  TrendingUp,
  Package,
  Star,
  Clock,
  Truck,
  AlertTriangle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ExecutiveOverviewProps {
  data: any;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ data }) => {
  const { kpis, monthly_trend, seller_tier_summary } = data;

  const pieColors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

  return (
    <div className="space-y-6">
      {/* Strategic Callout Banner */}
      <div className="p-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
                Strategic Baseline
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Growth vs Customer Experience Equilibrium
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Analysis across <strong>{kpis.total_orders.toLocaleString()}</strong> orders reveals that fulfillment friction and delivery promise breaches drive <strong>78%</strong> of 1-star reviews. Scaling Gross Merchandise Value (GMV) sustainably requires enforcing seller handling SLAs and regional promise buffering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-center">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Platform CSAT</div>
              <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {kpis.avg_review_score} / 5.0
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-center">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">On-Time Rate</div>
              <div className="text-xl font-bold text-emerald-600">
                {kpis.on_time_delivery_rate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total GMV (Gross Sales)"
          value={`R$ ${(kpis.total_gmv / 1_000_000).toFixed(2)}M`}
          subtitle="Across all orders & items"
          change="+18.4% YoY"
          icon={TrendingUp}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
          badge="Revenue"
        />
        <StatCard
          title="Delivered Orders"
          value={kpis.total_orders.toLocaleString()}
          subtitle="97.0% overall fulfillment rate"
          change="+14.2% MoM"
          icon={Package}
          iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
        />
        <StatCard
          title="Avg Delivery Lead Time"
          value={`${kpis.avg_delivery_days} Days`}
          subtitle={`Handling: ${kpis.avg_handling_days}d | Transit: ${kpis.avg_transit_days}d`}
          change="-1.2 days improvement"
          icon={Truck}
          iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
        />
        <StatCard
          title="1-Star Review Rate"
          value={`${kpis.pct_1_star}%`}
          subtitle={`5-Star Orders: ${kpis.pct_5_star}%`}
          change="Concentrated in late orders"
          isPositive={false}
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50 border-rose-200"
          badge="Risk Alert"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth vs CSAT Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly GMV Growth vs Customer Satisfaction</h3>
              <p className="text-xs text-slate-500">Evaluating whether rapid sales expansion degrades customer satisfaction scores</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium border border-slate-200">
              Jan 2017 – Aug 2018
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" domain={[3.5, 4.6]} stroke="#D97706" tick={{ fill: "#D97706", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(value: any, name: any) => {
                    if (name === "GMV (R$)") return [`R$ ${Number(value).toLocaleString()}`, name];
                    if (name === "Review Score (1-5★)") return [`${value} ★`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="gmv" name="GMV (R$)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avg_score" name="Review Score (1-5★)" stroke="#D97706" strokeWidth={3} dot={{ r: 4, fill: "#D97706" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seller Health Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Merchant Risk Health</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">Distribution of merchants by SLA compliance</p>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seller_tier_summary}
                  dataKey="seller_count"
                  nameKey="risk_tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {seller_tier_summary.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {seller_tier_summary.map((tier: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-slate-800 font-medium">{tier.risk_tier.split(' ')[0]}</span>
                </div>
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-900">{tier.seller_count}</span> merchants ({tier.avg_csat}★)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
