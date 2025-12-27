"use client";

import React from "react";
import { H1, Body } from "../atoms/Typography";
import { SummaryCards, SummaryCardProps } from "../organisms/SummaryCards";
import {
  ReportsToolbar,
  ReportsToolbarProps,
} from "../organisms/ReportsToolbar";
import { DataTable, Column } from "../organisms/DataTable";
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

  // Toolbar (Optional as it might be in header)
  toolbar?: Partial<Omit<ReportsToolbarProps, "className">>;

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

export const ReportsPageTemplate = React.memo(
  <T extends Record<string, any>>({
    title,
    subtitle,
    kpiCards,
    charts,
    tableTitle,
    columns,
    data,
    keyField = "id",
    page,
    pageSize,
    totalItems,
    onPageChange,
    loading,
    error,
    emptyMessage,
    className,
  }: ReportsPageTemplateProps<T>) => {
    return (
      <div className={cn("space-y-6 pb-12 w-full max-w-full overflow-hidden bg-slate-50 min-h-screen", className)}>
        {/* Enterprise Header - Compact & Functional */}
        <div className="bg-white border-b border-slate-300 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <H1 className="text-slate-800 font-bold tracking-tight text-xl">
              {title}
            </H1>
            {subtitle && (
              <Body className="text-slate-500 font-medium text-xs">
                {subtitle}
              </Body>
            )}
          </div>
          {/* Right side could hold global actions or date picker portal */}
        </div>

        <div className="px-6 space-y-6">
          {/* KPI Summary Cards - Enterprise Grid (Standard Component) */}
          {((kpiCards && kpiCards.length > 0) || loading) && (
            <SummaryCards cards={kpiCards || []} loading={loading} />
          )}

          {/* Main Content: Charts or Table */}
          <div className="space-y-4 w-full">
            {charts && (
              <div className="bg-white rounded-sm border border-slate-300 shadow-sm p-5 w-full overflow-hidden">
                <div className="mb-4 border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Analytics Overview</h3>
                </div>
                {charts}
              </div>
            )}

            {columns && data && (
              <div className="space-y-2 w-full">
                {tableTitle && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                      {tableTitle}
                    </h2>
                  </div>
                )}

                <div className="bg-white rounded-sm border border-slate-300 shadow-sm overflow-hidden w-full">
                  <div className="w-full overflow-x-auto">
                    {/* Reuse DataTable but ensure it fits the theme */}
                    <DataTable
                      columns={columns}
                      data={data}
                      keyField={keyField}
                      page={page}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={onPageChange}
                      loading={loading}
                      error={error}
                      emptyMessage={emptyMessage}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ReportsPageTemplate.displayName = "ReportsPageTemplate";
