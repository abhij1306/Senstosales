"use client";

import React, { useState, useMemo } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { TableHeaderCell } from '../molecules/TableHeaderCell';
import { Body, SmallText } from '../atoms/Typography';
import { ChevronLeft, ChevronRight, FileDown, Inbox } from 'lucide-react';
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
    align?: 'left' | 'center' | 'right';
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
    sortDirection?: 'asc' | 'desc';
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

    className?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    keyField = 'id',
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
    exportLabel = 'Export',
    loading = false,
    error,
    emptyMessage = 'No data available',
    emptyIcon,
    className
}: DataTableProps<T>) {
    const [internalSort, setInternalSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [internalPage, setInternalPage] = useState(1);

    const currentPage = page || internalPage;

    const currentSortKey = sortKey || internalSort?.key;
    const currentSortDirection = sortDirection || internalSort?.direction;

    // Calculate pagination
    const total = totalItems || data.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    // Sorted and paginated data
    const processedData = useMemo(() => {
        let result = [...data];

        // Sort
        if (currentSortKey) {
            result.sort((a, b) => {
                const aVal = a[currentSortKey];
                const bVal = b[currentSortKey];

                if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Paginate (only if not server-side)
        if (!totalItems) {
            result = result.slice(startIndex, endIndex);
        }

        return result;
    }, [data, currentSortKey, currentSortDirection, startIndex, endIndex, totalItems]);

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
            setInternalSort(prev => ({
                key,
                direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
        }
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;

        if (checked) {
            const allKeys = processedData.map(row => String(row[keyField]));
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
            onSelectionChange(selectedRows.filter(key => key !== rowKey));
        }
    };

    const allSelected = selectable && processedData.length > 0 && processedData.every(row => selectedRows.includes(String(row[keyField])));
    const someSelected = selectable && selectedRows.length > 0 && !allSelected;

    // Empty state
    if (!loading && !error && data.length === 0) {
        return (
            <Card className={cn("p-12 text-center", className)}>
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-[#F6F8FB]">
                        {emptyIcon || <Inbox size={32} className="text-[#9CA3AF]" />}
                    </div>
                    <Body className="text-[#6B7280]">{emptyMessage}</Body>
                </div>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className={cn("p-8 text-center", className)}>
                <Body className="text-[#DC2626]">{error}</Body>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Table toolbar */}
            {(exportable || selectable) && (
                <div className="flex items-center justify-between">
                    <div>
                        {selectable && selectedRows.length > 0 && (
                            <SmallText className="text-[#6B7280]">
                                {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
                            </SmallText>
                        )}
                    </div>
                    {exportable && onExport && (
                        <Button variant="secondary" size="sm" onClick={onExport}>
                            <FileDown size={16} />
                            {exportLabel}
                        </Button>
                    )}
                </div>
            )}

            {/* Table */}
            <Card className="p-0 overflow-hidden border border-[#E5E7EB]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#FAFBFC] border-b border-[#E5E7EB]">
                                {selectable && (
                                    <th className="h-12 px-4 w-12">
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
                                            "py-2.5 px-4 text-[11px] font-medium text-slate-600 uppercase tracking-widest transition-colors",
                                            column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                                            column.sortable && (currentSortKey === column.key ? "bg-slate-200/50 text-slate-950" : "hover:bg-slate-100/50 cursor-pointer")
                                        )}
                                        style={{ width: column.width }}
                                        onClick={column.sortable ? () => handleSort(column.key) : undefined}
                                    >
                                        {column.sortable ? (
                                            <div className="flex items-center gap-1">
                                                {column.label}
                                                <span className="text-[#9CA3AF]">
                                                    {currentSortKey === column.key ? (
                                                        currentSortDirection === 'asc' ? '↑' : '↓'
                                                    ) : '↕'}
                                                </span>
                                            </div>
                                        ) : (
                                            column.label
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center">
                                        <SmallText className="text-[#6B7280]">Loading...</SmallText>
                                    </td>
                                </tr>
                            ) : (
                                processedData.map((row, rowIndex) => {
                                    const rowKey = String(row[keyField]);
                                    const isSelected = selectedRows.includes(rowKey);

                                    return (
                                        <tr
                                            key={rowKey}
                                            className={cn(
                                                "border-b border-[#F3F4F6] transition-colors",
                                                "hover:bg-[#F6F8FB]",
                                                isSelected && "bg-[#1A3D7C]/5"
                                            )}
                                        >
                                            {selectable && (
                                                <td className="px-4 py-4">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={(e) => handleSelectRow(rowKey, e.target.checked)}
                                                        aria-label={`Select row ${rowIndex + 1}`}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((column) => (
                                                <td
                                                    key={column.key}
                                                    className={cn(
                                                        "py-3 px-4 text-[13px] font-medium text-slate-950 tabular-nums align-top",
                                                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                                    )}
                                                >
                                                    {column.render
                                                        ? column.render(row[column.key], row)
                                                        : row[column.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-[#F6F8FB]/30">
                        <SmallText className="text-[#6B7280]">
                            Showing {startIndex + 1} to {endIndex} of {total} results
                        </SmallText>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
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
                                            variant={currentPage === pageNum ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className="w-8 h-8 p-0"
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
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
