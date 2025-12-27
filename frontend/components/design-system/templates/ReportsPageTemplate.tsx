"use client";

import React from "react";
import { H1, H2, H3, Body } from "../atoms/Typography";
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

import { Card } from "../atoms/Card";

export const ReportsPageTemplate = React.memo(
  <T extends Record<string, any>>({
    title,
    subtitle,
    toolbar,
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
      <div className={cn("space-y-6 pb-12 w-full max-w-full overflow-hidden bg-slate-50/50 min-h-screen", className)}>
        {/* Enterprise Header - Compact & Functional */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm sticky top-0 z-10 -mx-6 mb-4">
          <div className="flex flex-col">
            <H1 className="text-slate-950 tracking-tight">
              {title}
            </H1>
            {subtitle && (
              <Body className="text-slate-500 font-medium mt-1">
                {subtitle}
              </Body>
            )}
          </div>

          {/* Integrated Toolbar Portal or Direct usage */}
          <div id="header-action-portal" className="flex items-center gap-3 mt-4 md:mt-0" />
        </div>

        <div className="px-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* Optional Direct Toolbar if not portalled */}
          {toolbar && !document.getElementById('header-action-portal') && (
            <ReportsToolbar
              startDate={toolbar.startDate || ""}
              endDate={toolbar.endDate || ""}
              onDateChange={toolbar.onDateChange || (() => { })}
              onExport={toolbar.onExport}
              loading={loading || toolbar.loading}
            />
          )}

          {/* KPI Summary Cards - Enterprise Grid (Standard Component) */}
          {((kpiCards && kpiCards.length > 0) || loading) && (
            <SummaryCards cards={kpiCards || []} loading={loading} />
          )}

          {/* Main Content: Charts or Table */}
          <div className="space-y-6 w-full">
            {charts && (
              <Card glass={true} className="p-6 w-full overflow-hidden border-white/20">
                <div className="mb-6 border-b border-slate-200/50 pb-3 flex items-center justify-between">
                  <H3 className="text-slate-700 uppercase tracking-[0.1em]">Analytics Overview</H3>
                </div>
                {charts}
              </Card>
            )}

            {columns && data && (
              <div className="space-y-4 w-full">
                {tableTitle && (
                  <div className="flex items-center justify-between px-1">
                    <H2 className="text-slate-800 uppercase tracking-wide">
                      {tableTitle}
                    </H2>
                  </div>
                )}

                <div className="w-full">
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
                    className="w-full"
                    glass={true}
                  />
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
