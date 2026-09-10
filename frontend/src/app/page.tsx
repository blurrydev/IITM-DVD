"use client";

import React, { useEffect, useState } from "react";
import {
  fetchDashboard,
  fetchFilterOptions,
  type DashboardData,
} from "@/lib/api";
import { FulfillmentCliffView } from "@/components/dashboard/FulfillmentCliffView";
import { SellerRiskQuadrantView } from "@/components/dashboard/SellerRiskQuadrantView";
import { RegionalBottlenecksView } from "@/components/dashboard/RegionalBottlenecksView";
import { SentimentTreemapView } from "@/components/dashboard/SentimentTreemapView";
import {
  BarChart3,
  Truck,
  Users,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("fulfillment");
  const [analyticsData, setAnalyticsData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    fetchFilterOptions()
      .then((options) => setStates(options.states))
      .catch((err) => console.warn("Failed to fetch filter options:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage("");

    fetchDashboard(stateFilter ? { state: stateFilter } : {})
      .then((payload) => {
        if (cancelled) return;
        setAnalyticsData(payload);
        setStatus("live");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Dashboard API Error:", error);
        setStatus("error");
        setErrorMessage(error.message ?? "Could not connect to FastAPI server on http://localhost:8000");
      });

    return () => {
      cancelled = true;
    };
  }, [stateFilter]);

  const kpis = analyticsData?.kpis;

  const tabs = [
    {
      id: "fulfillment",
      label: "Fulfillment & Satisfaction Cliff",
      subtitle: "Visuals 1, 2, 4",
      icon: Truck,
      badge: "Core Root Cause",
    },
    {
      id: "sellers",
      label: "Seller Risk & Order Matrix",
      subtitle: "Visuals 3, 7, 9",
      icon: Users,
      badge: "Commercial Risk",
    },
    {
      id: "regional",
      label: "Regional Infrastructure & Bottlenecks",
      subtitle: "Visuals 5, 6, 8",
      icon: MapPin,
      badge: "Geographic SLAs",
    },
    {
      id: "sentiment",
      label: "Complaint Sentiment & Action Plan",
      subtitle: "Visual 10 & Actions",
      icon: MessageSquare,
      badge: "Executive Strategy",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Clean Executive Header */}
      <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200/80 px-6 py-4 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Marketplace Delivery &amp; Satisfaction Intelligence
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  FastAPI Live API
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive Storyline: Truncating the Long Delivery Tail to Protect Marketplace Expansion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Server-side filter: every visual below is recomputed by FastAPI */}
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="text-xs text-slate-700 px-3 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              aria-label="Filter by customer state"
            >
              <option value="">All states</option>
              {states.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 text-xs text-slate-600 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "live"
                    ? "bg-emerald-500 animate-pulse"
                    : status === "loading"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span>
                Orders: <strong>{kpis ? kpis.total_orders.toLocaleString() : "..."}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {status === "live" ? "Live API" : status === "loading" ? "Loading" : "API Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Section 1: Executive KPI Strip */}
      <section className="bg-white px-6 py-4 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto">
          {kpis ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* KPI 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Delivered Volume
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {kpis.delivered_orders.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                    Delivered
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Avg Rating
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {kpis.overall_avg_score}
                  </span>
                  <span className="text-xs text-amber-500 font-bold">&#9733;</span>
                  <span className="text-[11px] text-slate-400 font-medium">/ 5.0</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Satisfaction Gap
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-rose-600 tracking-tight">
                    -{kpis.score_gap}
                  </span>
                  <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                    Late vs On-Time
                  </span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Carrier Transit SLA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {kpis.avg_carrier_transit}d
                  </span>
                  <span className="text-[10px] text-slate-500">
                    (vs {kpis.avg_seller_handling}d seller)
                  </span>
                </div>
              </div>

              {/* KPI 5 */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 col-span-2 md:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Top 10% Revenue Share
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-indigo-600 tracking-tight">
                    {kpis.top_10pct_seller_rev_share}%
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                    Pareto
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-500 animate-pulse">
              Loading executive KPI metrics...
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Light Tab Navigation */}
      <nav className="sticky top-[73px] z-40 bg-slate-100/90 border-b border-slate-200/90 backdrop-blur-md px-6 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 border ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm border-slate-300 ring-1 ring-blue-500/20 font-bold"
                      : "bg-white/60 text-slate-600 hover:text-slate-900 hover:bg-white border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-tight truncate font-semibold">
                      {tab.label}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-mono mt-0.5 ${
                        isActive ? "text-blue-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {tab.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {status === "loading" && !analyticsData && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Fetching analytics payload from FastAPI backend...</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              API Connection Error
            </div>
            <p className="text-xs text-rose-700">{errorMessage}</p>
            <p className="text-xs font-mono text-slate-600 pt-2">
              Ensure backend server is running: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">uvicorn app.main:app --reload --port 8000</code>
            </p>
          </div>
        )}

        {analyticsData && (
          <>
            {activeTab === "fulfillment" && <FulfillmentCliffView data={analyticsData} />}
            {activeTab === "sellers" && <SellerRiskQuadrantView data={analyticsData} />}
            {activeTab === "regional" && <RegionalBottlenecksView data={analyticsData} />}
            {activeTab === "sentiment" && <SentimentTreemapView data={analyticsData} />}
          </>
        )}
      </main>

      {/* Executive Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Marketplace Delivery &amp; Satisfaction Intelligence &bull; Live FastAPI Integration (`http://localhost:8000`)
        </p>
      </footer>
    </div>
  );
}
