import React from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

interface TrendItem {
  month: string;
  ordered_value: number;
  invoiced_value: number;
}

interface TrendsSectionProps {
  data: TrendItem[];
  range: string;
}

export function TrendsSection({ data, range }: TrendsSectionProps) {
  if (!data || data.length === 0) return null;

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.ordered_value, d.invoiced_value)),
  );
  const scale = maxValue > 0 ? 100 / maxValue : 1;

  // Simple Line/Bar combo visualizer
  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Sales & Dispatch Trends
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>{" "}
                Ordered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>{" "}
                Invoiced
              </div>
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-2 gap-2">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs text-gray-300">
              <div className="border-b border-gray-100 h-full w-full absolute top-0"></div>
              <div className="border-b border-gray-100 h-full w-full absolute top-1/4"></div>
              <div className="border-b border-gray-100 h-full w-full absolute top-2/4"></div>
              <div className="border-b border-gray-100 h-full w-full absolute top-3/4"></div>
            </div>

            {data.map((item, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center flex-1 h-full justify-end group z-10"
              >
                <div className="absolute bottom-0 w-full flex justify-center gap-1 h-full items-end pb-6">
                  {/* Bar for Invoiced */}
                  <div
                    style={{ height: `${item.invoiced_value * scale}%` }}
                    className="w-2 md:w-4 bg-green-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-500"
                  ></div>
                  {/* Bar for Ordered */}
                  <div
                    style={{ height: `${item.ordered_value * scale}%` }}
                    className="w-2 md:w-4 bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-500"
                  ></div>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 absolute bottom-0">
                  {item.month}
                </span>

                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-gray-900 text-white text-xs p-2 rounded pointer-events-none transition-opacity z-20 whitespace-nowrap">
                  <div className="font-semibold mb-1">Month {item.month}</div>
                  <div>Ord: ₹{(item.ordered_value / 1000).toFixed(1)}k</div>
                  <div>Inv: ₹{(item.invoiced_value / 1000).toFixed(1)}k</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50/50 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>Insight:</strong> Invoicing is trailing orders by{" "}
              <strong>12%</strong> this quarter. Consider expediting dispatch
              for pending items.
            </p>
          </div>
        </div>

        {/* Period Comparison (Simple Cards) */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
              This Quarter Efficiency
            </h3>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-bold text-gray-900">92%</span>
              <span className="flex items-center text-sm font-bold text-green-600 mb-1">
                <ArrowUpRight className="w-4 h-4" /> 4.5%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              vs Last Quarter (87.5%)
            </p>

            <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[92%]"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Pending Breakdown
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Material Shortage</span>
                  <span>3 Items</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full">
                  <div className="h-full bg-red-400 w-[30%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Awaiting Inspection</span>
                  <span>5 Items</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full">
                  <div className="h-full bg-amber-400 w-[50%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Ready for Dispatch</span>
                  <span>2 Items</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full">
                  <div className="h-full bg-green-400 w-[20%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
