'use client';

import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleDataTableProps {
    data: any[];
    columns: {
        header: string;
        accessor: string;
        width?: number;
        align?: 'left' | 'center' | 'right';
        render?: (row: any) => React.ReactNode;
    }[];
    className?: string;
}

export function SimpleDataTable({ data = [], columns = [], className }: SimpleDataTableProps) {
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className={cn("rounded-xl overflow-hidden bg-white", className)}>
            {/* Borderless Header */}
            <div className="flex bg-slate-50/50 h-9 sticky top-0 z10">
                {columns.map((col, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex items-center px-4 font-semibold text-[10px] uppercase tracking-wider text-slate-400",
                            col.align === 'right' && "justify-end",
                            col.align === 'center' && "justify-center"
                        )}
                        style={{ width: col.width ? `${col.width}%` : `${100 / (columns.length || 1)}%` }}
                    >
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Borderless Body */}
            <div className="overflow-y-auto max-h-[500px]">
                {safeData.length > 0 ? (
                    safeData.map((row, rowIdx) => {
                        if (!row) return null;
                        return (
                            <div
                                key={rowIdx}
                                className="flex hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer"
                            >
                                {columns.map((col, colIdx) => (
                                    <div
                                        key={colIdx}
                                        className={cn(
                                            "flex items-center px-4 py-2.5 text-[13px] font-medium",
                                            col.align === 'right' && "justify-end font-mono tabular-nums text-slate-700",
                                            col.align === 'center' && "justify-center",
                                            !col.align && "text-slate-600"
                                        )}
                                        style={{ width: col.width ? `${col.width}%` : `${100 / columns.length}%` }}
                                    >
                                        {col.render ? col.render(row) : (
                                            <span className="truncate">
                                                {row[col.accessor]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-2 opacity-30">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">No data available</div>
                    </div>
                )}
            </div>
        </div>
    );
}
