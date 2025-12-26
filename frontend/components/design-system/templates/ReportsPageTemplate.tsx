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
      <div className={cn("space-y-8", className)}>
        {/* Page Header - Compact & Premium */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <H1 className="uppercase tracking-tight text-slate-900">
                {title}
              </H1>
            </div>
            {subtitle && (
              <Body className="text-slate-400 font-medium ml-4.5">
                {subtitle}
              </Body>
            )}
          </div>
        </div>

        {/* KPI Summary Cards - Visual Focal Point */}
        {((kpiCards && kpiCards.length > 0) || loading) && (
          <SummaryCards
            cards={kpiCards || []}
            loading={loading}
            className="gap-6"
          />
        )}

        {/* Main Content: Charts or Table */}
        <div className="space-y-6">
          {charts && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
              {charts}
            </div>
          )}

          {columns && data && (
            <div className="space-y-4">
              {tableTitle && (
                <div className="flex items-center gap-4 px-1">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    {tableTitle}
                  </h2>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              )}

              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
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
          )}
        </div>
      </div>
    );
  },
);

ReportsPageTemplate.displayName = "ReportsPageTemplate";
