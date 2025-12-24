import React from 'react';
import { cn } from '@/lib/utils';
import { SearchX, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
    enableSorting?: boolean; // New sorting flag
}

export interface SortConfig<T> {
    key: keyof T;
    direction: 'asc' | 'desc';
}

interface DenseTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField?: keyof T;
    onRowClick?: (item: T) => void;
    className?: string;
    loading?: boolean;
    onSort?: (key: keyof T) => void; // New prop
    sortConfig?: SortConfig<T> | null; // New prop
}

export function DenseTable<T>({
    data,
    columns,
    keyField = 'id' as keyof T,
    onRowClick,
    className,
    loading = false,
    onSort,
    sortConfig
}: DenseTableProps<T>) {

    // Ensure we render the table structure even if data is empty, to prevent layout accumulation/flicker
    return (
        <div className={cn("w-full overflow-hidden rounded-lg border border-white/20", className)}>
            <table className="w-full text-left">
                <thead className="bg-white/40 backdrop-blur-sm border-b border-white/20">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={cn(
                                    "px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider",
                                    col.className, // Apply column class to header
                                    col.enableSorting && onSort ? "cursor-pointer hover:bg-white/40 select-none transition-colors group" : ""
                                )}
                                onClick={() => col.enableSorting && onSort && col.accessorKey ? onSort(col.accessorKey) : undefined}
                            >
                                <div className={cn(
                                    "flex items-center gap-1",
                                    col.className?.includes("text-right") ? "justify-end" : "justify-start"
                                )}>
                                    {col.header}
                                    {col.enableSorting && onSort && (
                                        <span className="text-slate-400">
                                            {sortConfig && sortConfig.key === col.accessorKey ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <ArrowUp className="w-3 h-3 text-blue-500" />
                                                ) : (
                                                    <ArrowDown className="w-3 h-3 text-blue-500" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/70">
                    {loading ? (
                        // Skeleton Loading State
                        Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={`skeleton-${idx}`}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={cn("px-3 py-3", col.className)}>
                                        <div className="h-4 bg-slate-200/50 rounded animate-pulse w-full max-w-[80%]" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (!data || !Array.isArray(data) || data.length === 0) ? (
                        <tr>
                            <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <SearchX className="w-8 h-8 opacity-20" />
                                    <p className="text-sm italic">No records found</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIdx) => (
                            <tr
                                key={String(row[keyField] || rowIdx)}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={cn(
                                    "transition-colors hover:bg-white/20",
                                    onRowClick && "cursor-pointer"
                                )}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={cn("px-3 py-2 text-sm text-slate-700", col.className)}>
                                        {col.cell ? col.cell(row) : String(row[col.accessorKey as keyof T] || '-')}
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
