import React from "react";
import {
  AlertTriangle,
  FileText,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

interface PendingItem {
  category: string;
  count: number;
  percentage: number;
  action?: string;
}

interface TopItem {
  name: string;
  units: number;
  trend: number;
}

interface InsightsPanelProps {
  pendingItems: PendingItem[];
  uninvoicedCount: number;
  topItems?: TopItem[];
  onAction?: (action: string, data?: any) => void;
}

export function InsightsPanel({
  pendingItems,
  uninvoicedCount,
  topItems = [],
  onAction,
}: InsightsPanelProps) {
  return (
    <div className="space-y-3">
      {/* Pending Breakdown */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-800">
            Pending Breakdown
          </h3>
        </div>

        <div className="space-y-2.5">
          {pendingItems.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-700">{item.category}</span>
                <span className="text-gray-900">{item.count} items</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.percentage > 50
                      ? "bg-red-400"
                      : item.percentage > 30
                        ? "bg-amber-400"
                        : "bg-green-400"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              {item.action && (
                <button
                  onClick={() => onAction?.(item.action!, item)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium mt-1 flex items-center gap-1"
                >
                  {item.action} <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Uninvoiced Challans - Actionable */}
      {uninvoicedCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900">
                {uninvoicedCount} Challan{uninvoicedCount > 1 ? "s" : ""}{" "}
                Pending Invoice
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Overdue by 14+ days. Revenue at risk.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onAction?.("draft_invoice_all")}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Draft Invoice Now
            </button>
            <button
              onClick={() => onAction?.("view_details")}
              className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {topItems && topItems.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Top Selling Items
          </h3>
          <div className="space-y-2">
            {topItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">{idx + 1}.</span>
                  <span
                    className="font-medium text-gray-700 truncate max-w-[150px]"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {item.units}
                  </span>
                  {item.trend !== 0 && (
                    <span
                      className={`text-[10px] font-medium ${item.trend > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {item.trend > 0 ? "↑" : "↓"}
                      {Math.abs(item.trend)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
