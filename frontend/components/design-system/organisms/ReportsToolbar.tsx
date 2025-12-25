"use client";

import React, { useState } from 'react';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { ActionButtonGroup } from '../molecules/ActionButtonGroup';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
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
    module: string;
    modules: { value: string; label: string }[];
    onModuleChange: (module: string) => void;
    onExport?: (format: 'excel' | 'csv') => void;
    loading?: boolean;
    className?: string;
}

export const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
    startDate,
    endDate,
    onDateChange,
    module,
    modules,
    onModuleChange,
    onExport,
    loading = false,
    className
}) => {
    return (
        <div className={cn(
            "flex flex-col md:flex-row items-start md:items-center gap-4 p-4",
            "bg-[#F6F8FB] rounded-lg border border-[#E5E7EB]",
            className
        )}>
            {/* Date Range */}
            <div className="flex items-center gap-3 flex-1">
                <Calendar size={20} className="text-[#6B7280]" />
                <div className="flex items-center gap-2">
                    <FormField
                        type="date"
                        value={startDate}
                        onChange={(e) => onDateChange(e.target.value, endDate)}
                        className="w-44"
                    />
                    <span className="text-[#6B7280]">→</span>
                    <FormField
                        type="date"
                        value={endDate}
                        onChange={(e) => onDateChange(startDate, e.target.value)}
                        className="w-44"
                    />
                </div>
            </div>

            {/* Module Selector */}
            <div className="flex items-center gap-3">
                <select
                    value={module}
                    onChange={(e) => onModuleChange(e.target.value)}
                    className={cn(
                        "h-[38px] px-3 rounded-md border border-[#D1D5DB] bg-white",
                        "text-[14px] font-normal text-[#111827]",
                        "focus:border-[#1A3D7C] focus:ring-2 focus:ring-[#1A3D7C]/20 focus:outline-none",
                        "transition-all duration-200"
                    )}
                    disabled={loading}
                >
                    {modules.map((mod) => (
                        <option key={mod.value} value={mod.value}>
                            {mod.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Export Actions */}
            {onExport && (
                <ActionButtonGroup
                    actions={[
                        {
                            label: 'Excel',
                            icon: <FileSpreadsheet size={16} />,
                            onClick: () => onExport('excel'),
                            variant: 'secondary',
                            disabled: loading,
                        },
                        {
                            label: 'CSV',
                            icon: <Download size={16} />,
                            onClick: () => onExport('csv'),
                            variant: 'ghost',
                            disabled: loading,
                        },
                    ]}
                />
            )}
        </div>
    );
};
