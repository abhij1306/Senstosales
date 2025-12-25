"use client";

import React from 'react';
import { H1, Body } from '../atoms/Typography';
import { SummaryCards, SummaryCardProps } from '../organisms/SummaryCards';
import { ReportsToolbar, ReportsToolbarProps } from '../organisms/ReportsToolbar';
import { DataTable, Column } from '../organisms/DataTable';
import { cn } from "@/lib/utils";

/**
 * ReportsPageTemplate - Atomic Design System v1.0
 * Standard layout for reports page
 * Layout: Heading → Reports Toolbar → KPI Cards → Charts → Data Table
 */

export interface ReportsPageTemplateProps<T = any> {
    // Page header
    title: string;
    subtitle?: string;

    // Toolbar (date range, module selector, export)
    toolbar: Omit<ReportsToolbarProps, 'className'>;

    // KPI Summary cards
    kpiCards?: SummaryCardProps[];

    // Charts section
    charts?: React.ReactNode;

    // Data table
    tableTitle?: React.ReactNode;
    columns?: Column<T>[];
    data?: T[];
    keyField?: string;

    // Table features
    page?: number;
    pageSize?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    exportable?: boolean;
    onExport?: () => void;

    // States
    loading?: boolean;
    error?: string;
    emptyMessage?: string;

    className?: string;
}

export function ReportsPageTemplate<T extends Record<string, any>>({
    title,
    subtitle,
    toolbar,
    kpiCards,
    charts,
    tableTitle,
    columns,
    data,
    keyField = 'id',
    page,
    pageSize,
    totalItems,
    onPageChange,
    exportable,
    onExport,
    loading,
    error,
    emptyMessage,
    className
}: ReportsPageTemplateProps<T>) {
    return (
        <div className={cn("space-y-6", className)}>
            {/* Page Header */}
            <div className="space-y-2">
                <H1>{title}</H1>
                {subtitle && (
                    <Body className="text-[#6B7280]">{subtitle}</Body>
                )}
            </div>

            {/* Reports Toolbar */}
            <ReportsToolbar {...toolbar} />

            {/* KPI Summary Cards */}
            {kpiCards && kpiCards.length > 0 && (
                <SummaryCards cards={kpiCards} />
            )}

            {/* Charts Section */}
            {charts && (
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    {charts}
                </div>
            )}

            {/* Data Table */}
            {columns && data && (
                <div className="space-y-3">
                    {tableTitle && (
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-semibold text-[#111827]">
                                {tableTitle}
                            </h2>
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={data}
                        keyField={keyField}
                        page={page}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={onPageChange}
                        exportable={exportable}
                        onExport={onExport}
                        loading={loading}
                        error={error}
                        emptyMessage={emptyMessage}
                    />
                </div>
            )}
        </div>
    );
}
