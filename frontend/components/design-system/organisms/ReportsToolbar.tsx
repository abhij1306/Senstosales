"use client";

import React, { useState } from "react";
import { FormField } from "../molecules/FormField";
import { Button } from "../atoms/Button";
import { FileSpreadsheet, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReportsToolbar Organism - Atomic Design System v1.0
 * Date range selector + Module selector + Export buttons
 * Used in Reports page
 */

export interface ReportsToolbarProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onExport?: () => void;
  loading?: boolean;
  className?: string;
}

const ReportsToolbarInternal: React.FC<ReportsToolbarProps> = ({
  startDate,
  endDate,
  onDateChange,
  onExport,
  loading = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4",
        "bg-white/45 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm",
        className,
      )}
    >
      {/* Date Range Selection */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Calendar size={14} className="text-blue-600 mr-1" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="bg-transparent border-none text-[12px] font-medium text-slate-800 focus:ring-0 w-32 cursor-pointer outline-none"
          />
          <span className="text-slate-300 font-medium">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="bg-transparent border-none text-[12px] font-medium text-slate-800 focus:ring-0 w-32 cursor-pointer outline-none"
          />
        </div>
      </div>

      {/* Export Action */}
      {onExport && (
        <Button
          onClick={onExport}
          variant="secondary"
          size="sm"
          disabled={loading}
          className="h-9 gap-2 bg-white border-slate-200 text-slate-700 shadow-sm"
        >
          <FileSpreadsheet size={16} className="text-emerald-600" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Export Report
          </span>
        </Button>
      )}
    </div>
  );
};

export const ReportsToolbar = React.memo(ReportsToolbarInternal);
