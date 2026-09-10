"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";

interface SentimentProps {
  data: {
    sentiment_treemap: Array<{
      name: string;
      value: number;
      color: string;
      subcategories: Array<{
        name: string;
        weight: number;
        sample_keywords: string[];
      }>;
    }>;
  };
}

export const SentimentTreemapView: React.FC<SentimentProps> = ({ data }) => {
  const { sentiment_treemap } = data;
  const [selectedCategory, setSelectedCategory] = useState<string>(sentiment_treemap[0]?.name || "");

  const activeCategory = sentiment_treemap.find((c) => c.name === selectedCategory) || sentiment_treemap[0];
  const totalFeedbackVolume = sentiment_treemap.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Visual 10: The Complaint Sentiment Word-Cloud-to-Category Treemap */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                Visual 10
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Complaint Sentiment &amp; Topic Classification
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hierarchical classification of Portuguese review comment messages into primary operational drivers and sub-themes.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Total Analyzed Comments: <strong className="text-slate-800">{totalFeedbackVolume.toLocaleString()}</strong>
          </div>
        </div>

        {/* High-level category cards / Interactive Treemap blocks */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {sentiment_treemap.map((cat) => {
            const isSelected = cat.name === selectedCategory;
            const pct = ((cat.value / totalFeedbackVolume) * 100).toFixed(1);
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-white"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70"
                }`}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {pct}% Share
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                    {cat.name}
                  </h4>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{cat.value.toLocaleString()} comments</span>
                  <span
                    className="font-bold"
                    style={{ color: cat.color }}
                  >
                    Drill down &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Drill-Down View of Selected Category */}
        <div className="mt-6 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeCategory.color }}
              />
              <h3 className="text-sm font-bold text-slate-900">
                Drill-Down Breakdown: {activeCategory.name}
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Representative Sub-topics &amp; High-Frequency Keywords
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {activeCategory.subcategories.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {sub.weight.toLocaleString()} msgs
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Trigger Keywords:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.sample_keywords.map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        &ldquo;{kw}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Management Recommendations directly tied to Technical Report Section 6 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Executive Decision Matrix (Tied Directly to EDA Findings)
            </h3>
            <p className="text-xs text-slate-500">
              Operational interventions mapped to evidence, owner, and expected impact.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Priority 1 &bull; Carrier Operations
            </span>
            <h4 className="text-xs font-bold text-slate-900">
              Truncate the 25+ Day Tail
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Implement proactive exception alerts at day 16 of transit. Establishing regional carrier SLAs in North/Northeast routes prevents orders sliding into the 2.61-star satisfaction cliff.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Priority 2 &bull; Marketplace Product
            </span>
            <h4 className="text-xs font-bold text-slate-900">
              Split-Fulfillment Cart Guidance
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When orders contain multiple sellers (2.88 rating cliff), provide explicit split-package tracking at checkout to align customer expectations and eliminate missing item complaints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Priority 3 &bull; Merchant Partnerships
            </span>
            <h4 className="text-xs font-bold text-slate-900">
              Targeted Top-5 Seller Remediation
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deploy VIP logistics support specifically to the Top 5 revenue sellers with high late rates rather than instituting blanket punitive bans that jeopardize commercial volume.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
