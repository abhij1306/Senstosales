"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TableHeaderCell Molecule - Atomic Design System v1.0
 * Composition: Typography (11px) + Sort Icon + Button behavior
 */

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  label: string;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "center" | "right";
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  label,
  sortable = false,
  sortDirection = null,
  onSort,
  align = "left",
  className,
  ...props
}) => {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const SortIcon =
    sortDirection === "asc"
      ? ArrowUp
      : sortDirection === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <th
      className={cn(
        "h-10 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]",
        "bg-slate-50 border-b border-slate-200",
        "sticky top-0 z-10",
        alignClasses[align],
        sortable &&
        "cursor-pointer select-none hover:bg-slate-100 transition-colors",
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
        )}
      >
        <span>{label}</span>
        {sortable && (
          <SortIcon
            size={14}
            className={cn(
              "transition-colors",
              sortDirection ? "text-blue-600" : "text-slate-300",
            )}
          />
        )}
      </div>
    </th>
  );
};
