import React from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export interface KPIData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage change
  status?: "success" | "warning" | "error" | "neutral";
  subtitle?: string;
  onClick?: () => void;
}

interface CompactKPIProps {
  kpis: KPIData[];
}

export function CompactKPIRow({ kpis }: CompactKPIProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-amber-600 bg-amber-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    return trend > 0 ? (
      <TrendingUp className="w-3 h-3 text-green-500" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-500" />
    );
  };

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              {kpi.label}
            </span>
            {kpi.status === "error" && (
              <AlertTriangle className="w-3 h-3 text-red-500" />
            )}
            {kpi.status === "success" && (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">
              {kpi.value}
            </span>
            {kpi.unit && (
              <span className="text-xs text-gray-500">{kpi.unit}</span>
            )}
          </div>

          {(kpi.trend !== undefined || kpi.subtitle) && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(kpi.trend)}
              <span
                className={`text-[10px] font-medium ${
                  kpi.trend && kpi.trend > 0
                    ? "text-green-600"
                    : kpi.trend && kpi.trend < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {kpi.subtitle || (kpi.trend ? `${Math.abs(kpi.trend)}%` : "")}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
