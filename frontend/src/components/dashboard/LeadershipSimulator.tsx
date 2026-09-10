"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Zap,
} from "lucide-react";

interface SimulatorProps {
  data: any;
}

export const LeadershipSimulator: React.FC<SimulatorProps> = ({ data }) => {
  const { kpis } = data;

  // Simulator Policy Controls
  const [handlingSlaCut, setHandlingSlaCut] = useState<number>(1); // Days shaved off handling time (0 to 2)
  const [delistThreshold, setDelistThreshold] = useState<number>(15); // Delist sellers with late rate > X%
  const [regionalBuffer, setRegionalBuffer] = useState<number>(3); // Extra buffer days added to promise (0 to 5)
  const [freightSubsidy, setFreightSubsidy] = useState<number>(10); // % freight subsidy in remote states (0 to 25)

  // Simulation calculations
  const baselineCsat = kpis.avg_review_score; // ~4.09
  const baselineGmv = kpis.total_gmv; // ~13.59M
  const baseline1Star = kpis.pct_1_star; // ~9.7%

  // Simulated impacts
  const csatHandlingImpact = handlingSlaCut * 0.08;
  const gmvHandlingFriction = handlingSlaCut * 0.015;

  const delistStrictness = Math.max(0, 20 - delistThreshold);
  const csatDelistImpact = delistStrictness * 0.025;
  const gmvDelistLoss = delistStrictness * 0.018;

  const csatBufferImpact = regionalBuffer * 0.04;
  const oneStarBufferReduction = regionalBuffer * 1.8;

  const csatSubsidyImpact = (freightSubsidy / 10) * 0.03;
  const gmvSubsidyBoost = (freightSubsidy / 10) * 0.035;

  // Final simulated metrics
  const simulatedCsat = Math.min(
    4.9,
    baselineCsat + csatHandlingImpact + csatDelistImpact + csatBufferImpact + csatSubsidyImpact
  ).toFixed(2);

  const netGmvMultiplier = 1 + gmvSubsidyBoost - gmvHandlingFriction - gmvDelistLoss;
  const simulatedGmv = (baselineGmv * netGmvMultiplier) / 1_000_000;
  const simulatedGmvDelta = ((netGmvMultiplier - 1) * 100).toFixed(1);

  const simulated1Star = Math.max(
    2.5,
    baseline1Star - (delistStrictness * 0.8) - oneStarBufferReduction - (handlingSlaCut * 1.2)
  ).toFixed(1);

  const resetPolicies = () => {
    setHandlingSlaCut(1);
    setDelistThreshold(15);
    setRegionalBuffer(3);
    setFreightSubsidy(10);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="p-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/50 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Executive Policy Simulator (Growth vs CSAT Sandbox)
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Adjust strategic operating levers in real time to project their combined impact on Gross Merchandise Value (GMV), Customer Satisfaction (CSAT), and 1-Star Review reduction.
            </p>
          </div>
          <button
            onClick={resetPolicies}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Levers
          </button>
        </div>
      </div>

      {/* Projected Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CSAT Projection */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Projected CSAT Rating
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
            {simulatedCsat} ★
            <span className="text-xs font-bold text-emerald-600">
              (+{(Number(simulatedCsat) - baselineCsat).toFixed(2)} pts)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Baseline: {baselineCsat} ★ across marketplace
          </p>
        </div>

        {/* GMV Projection */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Projected Net GMV
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
            R$ {simulatedGmv.toFixed(2)}M
            <span
              className={`text-xs font-bold ${
                Number(simulatedGmvDelta) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {Number(simulatedGmvDelta) >= 0 ? `+${simulatedGmvDelta}%` : `${simulatedGmvDelta}%`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Baseline: R$ {(baselineGmv / 1_000_000).toFixed(2)}M
          </p>
        </div>

        {/* 1-Star Review Rate Projection */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Projected 1-Star Review Rate
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
            {simulated1Star}%
            <span className="text-xs font-bold text-emerald-600">
              (-{(baseline1Star - Number(simulated1Star)).toFixed(1)}% drop)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Baseline: {baseline1Star}% of all orders
          </p>
        </div>
      </div>

      {/* Policy Levers Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">Adjust Operating Policy Levers</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lever 1 */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">1. Seller Handling SLA Target</span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                Cut {handlingSlaCut} Day{handlingSlaCut > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Require merchants to dispatch shipments faster (baseline handling: ~1.8 days).
            </p>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={handlingSlaCut}
              onChange={(e) => setHandlingSlaCut(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
          </div>

          {/* Lever 2 */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">2. Low-Quality Seller Throttle Threshold</span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                {delistThreshold}% Max Late Rate
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Penalize or throttle catalogue visibility for merchants whose late dispatch exceeds this limit.
            </p>
            <input
              type="range"
              min="8"
              max="20"
              step="1"
              value={delistThreshold}
              onChange={(e) => setDelistThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 mt-2"
            />
          </div>

          {/* Lever 3 */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">3. Estimated Delivery Promise Buffer</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                +{regionalBuffer} Buffer Days
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Add conservative buffer days to delivery estimates shown at checkout for distant states.
            </p>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={regionalBuffer}
              onChange={(e) => setRegionalBuffer(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 mt-2"
            />
          </div>

          {/* Lever 4 */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">4. Remote Regional Freight Subsidy</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                {freightSubsidy}% Subsidy
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Co-fund shipping rates to North/Northeast to expand catalogue reach without customer friction.
            </p>
            <input
              type="range"
              min="0"
              max="25"
              step="5"
              value={freightSubsidy}
              onChange={(e) => setFreightSubsidy(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
