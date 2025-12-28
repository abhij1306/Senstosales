"use client";

import React from "react";
import { H1, Body, SmallText } from "../atoms/Typography";
import { SummaryCards, type SummaryCardProps } from "../organisms/SummaryCards";
import { DataTable, type Column } from "../organisms/DataTable";
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

export function ListPageTemplate<T extends Record<string, any>>({
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
}: ListPageTemplateProps<T>) {
  return (
    <div className={cn("min-h-screen will-change-[transform,opacity]", className)}>
      {/* Premium Header Strip */}
      <div className="header-strip sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <H1 className="tracking-tight">{title}</H1>
            {subtitle && (
              <SmallText className="text-slate-500 font-medium block">
                {subtitle}
              </SmallText>
            )}
          </div>
          {toolbar && <div className="flex items-center gap-3">{toolbar}</div>}
        </div>
      </div>

      <div className="space-y-4">

        {/* Summary Cards */}
        {summaryCards && summaryCards.length > 0 && (
          <SummaryCards cards={summaryCards} loading={loading} />
        )}

        <div className="pb-6 min-h-[500px]">
          {children ? (
            <div className="min-h-[400px]">{children}</div>
          ) : (
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
