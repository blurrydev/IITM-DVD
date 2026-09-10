import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = "text-blue-600 bg-blue-50 border-blue-200",
  badge,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:translate-y-[-2px] group border border-slate-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl border ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          <span>{subtitle}</span>
          {change && (
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                isPositive ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
