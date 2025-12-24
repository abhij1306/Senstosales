import React from 'react';
import { cn } from '@/lib/utils';
import { SearchX } from 'lucide-react';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface DenseTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField?: keyof T;
    onRowClick?: (item: T) => void;
    className?: string;
    loading?: boolean;
}

export function DenseTable<T>({
    data,
    columns,
    keyField = 'id' as keyof T,
    onRowClick,
    className,
    loading = false
}: DenseTableProps<T>) {

    // Ensure we render the table structure even if data is empty, to prevent layout accumulation/flicker
    return (
        <div className={cn("w-full overflow-hidden rounded-lg border border-white/20", className)}>
            <table className="w-full text-left">
                <thead className="bg-white/40 backdrop-blur-sm border-b border-white/20">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={cn("px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider", col.className)}>
                                {col.header}
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
