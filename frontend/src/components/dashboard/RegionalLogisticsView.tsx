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
  Cell,
} from "recharts";
import { MapPin, Navigation, Compass } from "lucide-react";

interface RegionalLogisticsProps {
  data: any;
}

export const RegionalLogisticsView: React.FC<RegionalLogisticsProps> = ({ data }) => {
  const { state_geo, region_summary } = data;

  const regionColors: Record<string, string> = {
    Southeast: "#3B82F6",
    South: "#10B981",
    "Central-West": "#F59E0B",
    Northeast: "#EC4899",
    North: "#EF4444",
  };

  return (
    <div className="space-y-6">
      {/* Geographic Overview Header */}
      <div className="p-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/50 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-700 mt-1">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Regional Delivery Disparities & Continental Logistics Friction
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Brazil's geographic scale creates extreme divergence in customer experience. While Southeast states (SP, RJ, MG) enjoy <strong>8–10 day deliveries</strong> and <strong>4.2★ CSAT</strong>, North and Northeast destinations endure <strong>24–28 day transits</strong> and significantly elevated late shipment rates.
            </p>
          </div>
        </div>
      </div>

      {/* Regional Macro Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {region_summary.map((reg: any, i: number) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: regionColors[reg.customer_region] || "#64748B" }}
            />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{reg.customer_region}</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {reg.avg_score} ★
            </div>
            <div className="mt-2.5 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Orders:</span>
                <span className="text-slate-900 font-semibold">{reg.orders.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Transit:</span>
                <span className="text-slate-900 font-semibold">{reg.avg_delivery_days} days</span>
              </div>
              <div className="flex justify-between">
                <span>Late Rate:</span>
                <span className={reg.late_pct > 10 ? "text-rose-600 font-bold" : "text-emerald-600 font-semibold"}>
                  {reg.late_pct}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* State-by-State Delivery Lead Time Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">State Delivery Lead Times (Days)</h3>
              <p className="text-xs text-slate-500">Median days from purchase to delivery by customer destination state</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Ranked by Volume
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state_geo.slice(0, 16)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="customer_state" stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }}
                  formatter={(val: any, name: any) => [
                    name === "avg_delivery_days" ? `${val} days` : `${val}%`,
                    name === "avg_delivery_days" ? "Median Delivery Days" : "Late %",
                  ]}
                />
                <Bar dataKey="avg_delivery_days" name="Median Delivery Days" radius={[6, 6, 0, 0]}>
                  {state_geo.slice(0, 16).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={regionColors[entry.region] || "#3B82F6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Regional Strategy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Logistics Interventions</h3>
            <p className="text-xs text-slate-500">Targeted regional solutions</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-cyan-900">
                <MapPin className="w-4 h-4 text-cyan-700" /> Northeast Regional Cross-Dock Hub
              </div>
              <p className="text-slate-600 leading-relaxed">
                Partner with local carrier hubs in Salvador (BA) and Recife (PE) to bypass São Paulo multi-leg sorting delays, saving an estimated 5–7 transit days.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Navigation className="w-4 h-4 text-amber-700" /> Dynamic SLA Promise Buffering
              </div>
              <p className="text-slate-600 leading-relaxed">
                Increase the customer-facing estimated delivery promise by <strong>+3 business days</strong> for North / Northeast destinations to prevent false expectations and drop 1-star review spikes by ~30%.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
            <strong>Key Takeaway:</strong> SP (São Paulo) represents <strong>42%</strong> of total marketplace orders with an average delivery of only <strong>8.3 days</strong> and CSAT of <strong>4.2★</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
