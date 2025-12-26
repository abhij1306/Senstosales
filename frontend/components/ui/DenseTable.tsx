import React from "react";
import { cn } from "@/lib/utils";
import { SearchX, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  enableSorting?: boolean;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: "asc" | "desc";
}

interface DenseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  loading?: boolean;
  onSort?: (key: keyof T) => void;
  sortConfig?: SortConfig<T> | null;
}

export function DenseTable<T>({
  data,
  columns,
  keyField = "id" as keyof T,
  onRowClick,
  className,
  loading = false,
  onSort,
  sortConfig,
}: DenseTableProps<T>) {
  return (
    <div className={cn("table-container", className)}>
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-20">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn(
                  "table-th",
                  col.className,
                  col.enableSorting && onSort
                    ? "cursor-pointer hover:bg-slate-50/50 select-none transition-colors group"
                    : "",
                )}
                onClick={() =>
                  col.enableSorting && onSort && col.accessorKey
                    ? onSort(col.accessorKey)
                    : undefined
                }
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    col.className?.includes("text-right")
                      ? "justify-end"
                      : "justify-start",
                  )}
                >
                  <span className="uppercase tracking-widest text-[10px] font-black">
                    {col.header}
                  </span>
                  {col.enableSorting && onSort && (
                    <span className="text-slate-400">
                      {sortConfig && sortConfig.key === col.accessorKey ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-blue-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white/10">
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="animate-pulse">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn("table-td", col.className)}>
                    <div className="h-6 bg-slate-200/40 rounded-lg w-full max-w-[70%] shadow-inner" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data || !Array.isArray(data) || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                  <div className="p-4 bg-slate-50 rounded-full shadow-inner">
                    <SearchX className="w-12 h-12 opacity-40" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                      No Records In Repository
                    </p>
                    <p className="text-[10px] font-bold mt-1 opacity-60">
                      Try adjusting your filters or ingestion parameters
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={String(row[keyField] || rowIdx)}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  "table-row group animate-in fade-in slide-in-from-bottom-1 duration-300",
                  onRowClick && "cursor-pointer",
                )}
                style={{ animationDelay: `${rowIdx * 30}ms` }}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn("table-td", col.className)}>
                    {col.cell ? (
                      col.cell(row)
                    ) : (
                      <span className="text-slate-700 font-semibold group-hover:text-blue-700 transition-colors">
                        {String(row[col.accessorKey as keyof T] ?? "—")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
