import React from "react";
import {
  AlertCircle,
  TrendingDown,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export interface Insight {
  type: "warning" | "error" | "success";
  text: string;
  action?: string;
}

interface InsightStripProps {
  insights: Insight[];
  onAction?: (action: string) => void;
}

export function InsightStrip({ insights, onAction }: InsightStripProps) {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "error":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getStyles = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900";
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          onClick={() => onAction && insight.action && onAction(insight.action)}
          className={`
                        p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm
                        ${getStyles(insight.type)}
                    `}
        >
          <div className="mt-0.5 shrink-0">{getIcon(insight.type)}</div>
          <div className="flex-1">
            <p className="font-medium text-sm leading-snug">{insight.text}</p>
            {insight.action && (
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold opacity-80 hover:opacity-100">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
