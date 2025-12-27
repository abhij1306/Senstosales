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

export const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
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
        "bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm",
        className,
      )}
    >
      {/* Date Range Selection */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Calendar size={14} className="text-blue-600 mr-0.5" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="bg-transparent border-none text-[12px] font-bold text-slate-800 focus:ring-0 w-32 cursor-pointer"
          />
          <span className="text-slate-300 font-black">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="bg-transparent border-none text-[12px] font-bold text-slate-800 focus:ring-0 w-32 cursor-pointer"
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
          className="h-8 gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
        >
          <FileSpreadsheet size={14} className="text-green-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Export Excel
          </span>
        </Button>
      )}
    </div>
  );
};
