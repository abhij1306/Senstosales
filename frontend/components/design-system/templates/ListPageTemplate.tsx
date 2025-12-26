"use client";

import React from "react";
import { H1 } from "../atoms/Typography";
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
}: ListPageTemplateProps<T>) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <div className="space-y-2">
        <H1 className="uppercase tracking-tight">{title}</H1>
        {subtitle && <p className="text-[14px] text-[#6B7280]">{subtitle}</p>}
      </div>

      {/* Toolbar */}
      {toolbar && <div>{toolbar}</div>}

      {/* Summary Cards */}
      {summaryCards && summaryCards.length > 0 && (
        <SummaryCards cards={summaryCards} loading={loading} />
      )}

      {/* Data Table */}
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
    </div>
  );
}
