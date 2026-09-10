"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MapPin, Navigation, Compass, Layers, ArrowUpRight } from "lucide-react";

interface RegionalProps {
  data: {
    regional_performance: Array<{
      state: string;
      order_count: number;
      avg_delivery_days: number;
      late_rate_pct: number;
      avg_review_score: number;
    }>;
    parallel_coordinates: {
      meta: {
        approval_lag_max: number;
        seller_handling_max: number;
        carrier_transit_max: number;
      };
      samples: Array<{
        order_id: string;
        approval_lag_hours: number;
        seller_handling_days: number;
        carrier_transit_days: number;
        review_score: number;
      }>;
    };
    hexbin_map: Array<{
      lat: number;
      lng: number;
      order_count: number;
      median_carrier_transit: number;
      avg_review_score: number;
      state: string;
    }>;
  };
}

export const RegionalBottlenecksView: React.FC<RegionalProps> = ({ data }) => {
  const { regional_performance, parallel_coordinates, hexbin_map } = data;
  const [highlightScore, setHighlightScore] = useState<number | "all">("all");

  // Filter parallel coordinates
  const filteredParallel = parallel_coordinates.samples.filter(
    (s) => highlightScore === "all" || s.review_score === highlightScore
  );

  // Hexbin map coordinate bounding box for SVG projection (Brazil bounds approx)
  // Lat: 5 to -34, Lng: -74 to -34
  const minLat = -34, maxLat = 5;
  const minLng = -74, maxLng = -34;
  const svgWidth = 540;
  const svgHeight = 440;

  const projectPoint = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * (svgWidth - 60) + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 60) + 30;
    return { x, y };
  };

  // Color generator for hexbin transit days
  const getTransitColor = (days: number) => {
    if (days <= 5) return "#10b981"; // fast green
    if (days <= 9) return "#3b82f6"; // blue
    if (days <= 14) return "#f59e0b"; // amber
    if (days <= 20) return "#f97316"; // orange
    return "#ef4444"; // critical red
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Visual 5: Regional Performance Dashboard */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                Visual 5
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Regional Performance Dashboard (Sorted Delivery vs. Late Rate)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer states with &ge; 300 orders sorted by average delivery days, showing side-by-side late delivery rate.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            States analyzed: <strong className="text-slate-800">{regional_performance.length} states</strong>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regional_performance}
                margin={{ top: 20, right: 30, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="state"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Avg Delivery Days", angle: -90, position: "insideLeft", offset: 15, style: { fill: "#94a3b8", fontSize: 11 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                            State: {label} ({item.order_count.toLocaleString()} orders)
                          </p>
                          <p className="text-sky-400">Avg Delivery Time: {item.avg_delivery_days} days</p>
                          <p className="text-rose-400">Late Delivery Rate: {item.late_rate_pct}%</p>
                          <p className="text-amber-400">Avg Review Score: {item.avg_review_score} / 5.0</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar
                  yAxisId="left"
                  dataKey="avg_delivery_days"
                  name="Avg Delivery Days"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="right"
                  dataKey="late_rate_pct"
                  name="Late-Delivery Rate (%)"
                  fill="#fb7185"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-sky-50/50 border border-sky-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                Geographic Insight
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Infrastructure Disparities
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Northeastern &amp; Northern states (AL, MA, SE, PA, BA) suffer <strong>25 to 30+ day</strong> delivery times and <strong>15-25% late rates</strong>, driving their lower satisfaction scores.
              </p>
            </div>
            <div className="pt-3 border-t border-sky-200/60 text-xs text-sky-900">
              <strong>Action Policy:</strong> Adjust SLA promises regionally rather than promising blanket 10-day deliveries to remote states.
            </div>
          </div>
        </div>
      </div>

      {/* Visual 6 & Visual 8: Parallel Coordinates & Hexbin Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 6: The "Logistics Bottleneck" Parallel Coordinates Plot */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                    Visual 6
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Fulfillment Stage Bottleneck Analysis
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approval Lag (hrs) &rarr; Seller Handling (days) &rarr; Carrier Transit (days)
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setHighlightScore("all")}
                  className={`px-2 py-0.5 rounded ${
                    highlightScore === "all" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHighlightScore(1)}
                  className={`px-2 py-0.5 rounded ${
                    highlightScore === 1 ? "bg-rose-600 text-white font-bold" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  1-Star
                </button>
                <button
                  onClick={() => setHighlightScore(5)}
                  className={`px-2 py-0.5 rounded ${
                    highlightScore === 5 ? "bg-emerald-600 text-white font-bold" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  5-Star
                </button>
              </div>
            </div>

            {/* SVG Parallel Coordinates Diagram */}
            <div className="w-full mt-4 h-[280px]">
              <svg viewBox="0 0 460 250" className="w-full h-full select-none">
                {/* 3 Axes definitions */}
                {/* Axis 1: Approval Lag (0 to 72 hrs) at x = 70 */}
                {/* Axis 2: Seller Handling (0 to 15 days) at x = 230 */}
                {/* Axis 3: Carrier Transit (0 to 40 days) at x = 390 */}
                <line x1="70" y1="40" x2="70" y2="210" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="230" y1="40" x2="230" y2="210" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="390" y1="40" x2="390" y2="210" stroke="#cbd5e1" strokeWidth="2" />

                {/* Axis Labels */}
                <text x="70" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">
                  Approval Lag (hrs)
                </text>
                <text x="70" y="225" textAnchor="middle" className="text-[9px] fill-slate-400">
                  0 - 72h
                </text>

                <text x="230" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">
                  Seller Handling (days)
                </text>
                <text x="230" y="225" textAnchor="middle" className="text-[9px] fill-slate-400">
                  0 - 15d
                </text>

                <text x="390" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">
                  Carrier Transit (days)
                </text>
                <text x="390" y="225" textAnchor="middle" className="text-[9px] fill-slate-400">
                  0 - 40d
                </text>

                {/* Sample paths */}
                {filteredParallel.map((s, idx) => {
                  const y1 = 210 - (Math.min(s.approval_lag_hours, 72) / 72) * 170;
                  const y2 = 210 - (Math.min(s.seller_handling_days, 15) / 15) * 170;
                  const y3 = 210 - (Math.min(s.carrier_transit_days, 40) / 40) * 170;

                  const color = s.review_score === 1 ? "#f43f5e" : s.review_score >= 4 ? "#10b981" : "#f59e0b";
                  const opacity = s.review_score === 1 ? 0.7 : 0.25;

                  return (
                    <path
                      key={`path-${idx}`}
                      d={`M 70 ${y1} C 150 ${y1}, 150 ${y2}, 230 ${y2} C 310 ${y2}, 310 ${y3}, 390 ${y3}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={s.review_score === 1 ? 2 : 1.2}
                      strokeOpacity={opacity}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-2 bg-violet-50/60 border border-violet-200/70 p-3 rounded-xl">
            <p className="text-xs text-violet-900 leading-normal">
              <strong>Bottleneck Observation:</strong> 1-star orders (red traces) clearly spike upwards on the <em>Carrier Transit</em> axis, whereas Approval Lag and Seller Handling remain relatively uniform across review scores.
            </p>
          </div>
        </div>

        {/* Visual 8: The "Regional Infrastructure" Hexbin Map */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    Visual 8
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Geographic Carrier Transit Distribution Map
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hexagonally binned geolocation coordinates colored by Median Carrier Transit Days.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> &le;5d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 6-9d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 10-14d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> &gt;15d</span>
              </div>
            </div>

            {/* SVG Hexagonal Binning Map of Brazil */}
            <div className="w-full mt-2 h-[280px] flex items-center justify-center bg-slate-900 rounded-xl p-2 relative overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                {hexbin_map.map((bin, i) => {
                  const { x, y } = projectPoint(bin.lat, bin.lng);
                  const color = getTransitColor(bin.median_carrier_transit);
                  const radius = Math.min(18, Math.max(9, Math.sqrt(bin.order_count) / 4.5));

                  // Generate Hexagon polygon points
                  const points = [
                    `${x},${y - radius}`,
                    `${x + radius * 0.866},${y - radius * 0.5}`,
                    `${x + radius * 0.866},${y + radius * 0.5}`,
                    `${x},${y + radius}`,
                    `${x - radius * 0.866},${y + radius * 0.5}`,
                    `${x - radius * 0.866},${y - radius * 0.5}`,
                  ].join(" ");

                  return (
                    <g key={`hex-${i}`} className="group cursor-pointer">
                      <polygon
                        points={points}
                        fill={color}
                        fillOpacity={0.82}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        className="transition-all hover:fill-opacity-100 hover:stroke-white"
                      />
                      <title>{`Cluster ${bin.state}: ${bin.median_carrier_transit} days median transit (${bin.order_count} orders, avg rating: ${bin.avg_review_score})`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-2 bg-teal-50/60 border border-teal-200/70 p-3 rounded-xl">
            <p className="text-xs text-teal-900 leading-normal">
              <strong>Geographic Cluster Insight:</strong> The Southeast cluster (São Paulo/Rio) achieves rapid 4-7 day transit (green/blue), whereas Northern and Amazonian clusters experience 18-25+ day transit times (orange/red).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
