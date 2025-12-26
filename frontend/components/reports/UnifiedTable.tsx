import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight, Truck } from "lucide-react";
import Pagination from "@/components/Pagination";

export interface SmartTableRow {
  po_number: number;
  po_date: string;
  po_item_no: number;
  material_description: string;
  ord_qty: number;
  dispatched_qty: number;
  pending_qty: number;
  age_days: number;
  status: "Pending" | "Completed";
}

interface UnifiedTableProps {
  data: SmartTableRow[];
  loading: boolean;
}

export function UnifiedTable({ data, loading }: UnifiedTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading operational data...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <h3 className="font-semibold text-gray-800">Operational Deep Dive</h3>
        <div className="text-xs text-gray-500">
          Showing {data.length} records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-[11px] uppercase tracking-wider font-semibold">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">PO Details</th>
              <th className="px-6 py-4 max-w-xs">Material</th>
              <th className="px-6 py-4 text-center">Progress</th>
              <th className="px-6 py-4 text-right">Age</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, idx) => {
              // Smart Highlighting logic
              const isUrgent = row.pending_qty > 0 && row.age_days > 14;
              const isWarning = row.pending_qty > 0 && row.age_days > 7;

              return (
                <tr
                  key={`${row.po_number}-${row.po_item_no}`}
                  className={`
                                        group hover:bg-gray-50 transition-colors
                                        ${isUrgent ? "bg-red-50/30" : ""}
                                    `}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`
                                            inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                            ${
                                              row.pending_qty === 0
                                                ? "bg-green-100 text-green-700"
                                                : isUrgent
                                                  ? "bg-red-100 text-red-700 animate-pulse"
                                                  : "bg-amber-100 text-amber-700"
                                            }
                                        `}
                    >
                      {row.pending_qty === 0 ? "Done" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      PO #{row.po_number}
                    </div>
                    <div className="text-xs text-gray-500">{row.po_date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-700 max-w-[240px] truncate"
                      title={row.material_description}
                    >
                      {row.material_description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-gray-600">
                        {row.dispatched_qty} / {row.ord_qty}
                      </div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.pending_qty === 0 ? "bg-green-500" : "bg-blue-500"}`}
                          style={{
                            width: `${Math.min((row.dispatched_qty / row.ord_qty) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-xs font-medium ${isUrgent ? "text-red-600" : "text-gray-500"}`}
                    >
                      {row.age_days} days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.pending_qty > 0 ? (
                      <button
                        onClick={() =>
                          router.push(`/dc/create?po=${row.po_number}`)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <Truck className="w-3 h-3" />
                        Dispatch
                      </button>
                    ) : (
                      <div className="text-xs text-gray-400 font-medium">
                        Completed
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100">
        <Pagination
          currentPage={currentPage}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
