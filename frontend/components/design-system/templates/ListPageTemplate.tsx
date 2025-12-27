"use client";

import React from "react";
import { H1, Body } from "../atoms/Typography";
import { SummaryCards, SummaryCardProps } from "../organisms/SummaryCards";
import { DataTable, Column } from "../organisms/DataTable";
import { cn } from "@/lib/utils";

/**
 * ListPageTemplate - Atomic Design System v1.0
 * Standard layout for list pages (PO, DC, Invoice, SRV)
 * Layout: Heading → Toolbar → Summary Cards (optional) → DataTable
 */

export interface ListPageTemplateProps<T = any> {
  // Page header
  title: string;
  subtitle?: string;

  // Toolbar (actions, filters, etc.)
  toolbar?: React.ReactNode;

  // Summary cards (KPIs)
  summaryCards?: SummaryCardProps[];

  // Table configuration
  columns: Column<T>[];
  data: T[];
  keyField?: string;

  // Table features
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  exportable?: boolean;
  onExport?: () => void;

  // States
  loading?: boolean;
  error?: string;
  emptyMessage?: string;

  className?: string;
  children?: React.ReactNode;
}

const ListPageTemplateInternal = <T extends Record<string, any>>({
  title,
  subtitle,
  toolbar,
  summaryCards,
  columns,
  data,
  keyField = "id",
  page,
  pageSize,
  totalItems,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  selectable,
  selectedRows,
  onSelectionChange,
  exportable,
  onExport,
  loading,
  error,
  emptyMessage,
  className,
  children,
}: ListPageTemplateProps<T>) => {
  return (
    <div className={cn("space-y-5 pb-10 w-full max-w-full overflow-hidden bg-slate-50/50 min-h-screen", className)}>
      {/* Enterprise Header - Compact & Functional */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex flex-col">
          <H1 className="text-slate-950 tracking-tight text-xl uppercase font-semibold">
            {title}
          </H1>
          {subtitle && (
            <Body className="text-slate-500 font-medium mt-0.5 text-[11px] uppercase tracking-wider">
              {subtitle}
            </Body>
          )}
        </div>

        {toolbar && (
          <div className="flex items-center gap-3">
            {toolbar}
          </div>
        )}
      </div>

      <div className="px-8 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* KPI Summary Cards - Enterprise Grid (Standard Component) */}
        {((summaryCards && summaryCards.length > 0) || loading) && (
          <SummaryCards cards={summaryCards || []} loading={loading} />
        )}

        {/* Custom Content (e.g. Grid) or DataTable */}
        {children ? (
          <div className="min-h-[400px]">{children}</div>
        ) : (
          <div className="w-full">
            <DataTable
              columns={columns}
              data={data}
              keyField={keyField}
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={onPageChange}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
              selectable={selectable}
              selectedRows={selectedRows}
              onSelectionChange={onSelectionChange}
              exportable={exportable}
              onExport={onExport}
              loading={loading}
              error={error}
              emptyMessage={emptyMessage}
              glass={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const ListPageTemplate = React.memo(ListPageTemplateInternal) as typeof ListPageTemplateInternal;
