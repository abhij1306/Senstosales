"use client";

import React, { useState, useMemo } from "react";
import { Card } from "../atoms/Card";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { TableHeaderCell } from "../molecules/TableHeaderCell";
import { Body, SmallText } from "../atoms/Typography";
import { ChevronLeft, ChevronRight, FileDown, Inbox } from "lucide-react";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * DataTable Organism - Atomic Design System v1.0
 * Features: Sorting, Pagination, Bulk Select, Export, Empty State
 * Uses real data only - no mock/dummy data
 */

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;

  // Pagination
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  // Sorting
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;

  // Selection
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;

  // Export
  exportable?: boolean;
  onExport?: () => void;
  exportLabel?: string;

  // Loading & Error
  loading?: boolean;
  error?: string;

  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;

  glass?: boolean;
  className?: string;
}

const DataTableComponent = <T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  exportable = false,
  onExport,
  exportLabel = "Export",
  loading = false,
  error,
  emptyMessage = "No data available",
  emptyIcon,
  glass = false,
  className,
}: DataTableProps<T>) => {
  const [internalSort, setInternalSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = page || internalPage;

  const currentSortKey = sortKey || internalSort?.key;
  const currentSortDirection = sortDirection || internalSort?.direction;

  // Calculate pagination
  const total = totalItems || data?.length || 0;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  // Sorted and paginated data
  const processedData = useMemo(() => {
    let result = data ? [...data] : [];

    // Sort
    if (currentSortKey) {
      result.sort((a, b) => {
        const aVal = a[currentSortKey];
        const bVal = b[currentSortKey];

        if (aVal < bVal) return currentSortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return currentSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Paginate (client-side only - when totalItems not provided or equals data.length)
    // Server-side pagination: totalItems > data.length (data is already paginated)
    // Client-side pagination: totalItems === data.length or undefined (need to slice)
    if (!totalItems || totalItems === data.length) {
      result = result.slice(startIndex, endIndex);
    }

    return result;
  }, [
    data,
    currentSortKey,
    currentSortDirection,
    startIndex,
    endIndex,
    totalItems,
  ]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Handle sort
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    } else {
      setInternalSort((prev) => ({
        key,
        direction:
          prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const allKeys = processedData.map((row) => String(row[keyField]));
      onSelectionChange(allKeys);
    } else {
      onSelectionChange([]);
    }
  };

  // Handle select row
  const handleSelectRow = (rowKey: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedRows, rowKey]);
    } else {
      onSelectionChange(selectedRows.filter((key) => key !== rowKey));
    }
  };

  const allSelected =
    selectable &&
    processedData.length > 0 &&
    processedData.every((row) => selectedRows.includes(String(row[keyField])));
  const selectedCount = selectedRows.length; // Optimization

  // Empty state
  if (!loading && !error && data.length === 0) {
    return (
      <Card className={cn("p-12 text-center", className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-50">
            {emptyIcon || <Inbox size={32} className="text-slate-400" />}
          </div>
          <Body className="text-slate-500">{emptyMessage}</Body>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <Body className="text-red-600">{error}</Body>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table toolbar */}
      {(exportable || selectable) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {selectable && selectedCount > 0 && (
              <SmallText className="text-slate-500 font-medium">
                {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
              </SmallText>
            )}
          </div>
          {exportable && onExport && (
            <Button variant="secondary" size="sm" onClick={onExport} className="rounded-xl">
              <FileDown size={14} className="mr-2" />
              {exportLabel}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden border-white/20" glass={glass}>
        <div
          className="overflow-x-auto"
          style={{ minHeight: "200px", display: "block" }}
        >
          <table
            className="w-full border-collapse"
            style={{ display: "table" }}
          >
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50">
                {selectable && (
                  <th className="h-10 px-4 w-12 text-center">
                    <Checkbox
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "py-2.5 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em] transition-colors border-b border-slate-200/60",
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left",
                      column.sortable &&
                      (currentSortKey === column.key
                        ? "bg-slate-100/50 text-slate-950"
                        : "hover:bg-slate-50/50 cursor-pointer"),
                    )}
                    style={{ width: column.width }}
                    onClick={
                      column.sortable ? () => handleSort(column.key) : undefined
                    }
                  >
                    {column.sortable ? (
                      <div className={cn(
                        "flex items-center gap-1.5",
                        column.align === "right" ? "justify-end" :
                          column.align === "center" ? "justify-center" : "justify-start"
                      )}>
                        {column.label}
                        <span className="text-slate-400">
                          {currentSortKey === column.key
                            ? currentSortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </div>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading
                ? Array.from({ length: pageSize || 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4">
                      <TableRowSkeleton columns={columns.length} />
                    </td>
                  </tr>
                ))
                : processedData.map((row, index) => {
                  const rowKey = row[keyField]
                    ? String(row[keyField])
                    : row.id
                      ? String(row.id)
                      : `fallback-${index}`;

                  const isSelected = selectedRows.includes(rowKey);

                  return (
                    <tr
                      key={rowKey}
                      className={cn(
                        "border-b border-slate-200/30 transition-all duration-200",
                        "hover:bg-blue-50/50 group/row",
                        isSelected && "bg-blue-50/40",
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-4 text-center">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) =>
                              handleSelectRow(rowKey, e.target.checked)
                            }
                            aria-label={`Select row`}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "py-2.5 px-4 text-[13px] font-medium text-slate-950 tabular-nums align-middle relative",
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : "text-left",
                          )}
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50 bg-slate-50/50 backdrop-blur-sm">
            <SmallText className="text-slate-500 font-medium">
              Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{endIndex}</span> of <span className="text-slate-900">{total}</span> results
            </SmallText>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl h-9 px-3"
              >
                <ChevronLeft size={14} className="mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "w-9 h-9 p-0 rounded-xl transition-all duration-200",
                        currentPage === pageNum ? "shadow-md scale-105" : "hover:bg-slate-200/50"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl h-9 px-3"
              >
                Next
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;

export { DataTable };
