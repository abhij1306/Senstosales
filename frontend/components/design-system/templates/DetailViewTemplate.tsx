"use client";

import React, { useState } from "react";
import { H1, H2, Body } from "../atoms/Typography";
import { SummaryCards, SummaryCardProps } from "../organisms/SummaryCards";
import { DocumentTrace, DocumentNode } from "../organisms/DocumentTrace";
import { ActionButtonGroup, Action } from "../molecules/ActionButtonGroup";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DetailViewTemplate - Atomic Design System v1.0
 * Standard layout for detail/view pages
 * Layout: Breadcrumbs → Header + Actions → Summary Cards → Document Trace → Tabbed Content
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface DetailViewTemplateProps {
  // Navigation
  breadcrumbs?: BreadcrumbItem[];

  // Header
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;

  // Header actions
  actions?: Action[];

  // Summary cards
  summaryCards?: SummaryCardProps[];

  // Document traceability
  documentTrace?: DocumentNode[];

  // Tabs
  tabs?: TabItem[];
  defaultTab?: string;

  // Additional content (if not using tabs)
  children?: React.ReactNode;

  className?: string;
}

export const DetailViewTemplate: React.FC<DetailViewTemplateProps> = ({
  breadcrumbs,
  title,
  subtitle,
  badge,
  actions,
  summaryCards,
  documentTrace,
  tabs,
  defaultTab,
  children,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.[0]?.id || "");

  const activeTabContent = tabs?.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-[14px]">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-slate-500 hover:text-blue-600 transition-colors font-medium"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-900 font-semibold">
                  {crumb.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={14} className="text-slate-300" />
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <H1>{title}</H1>
            {badge}
          </div>
          {subtitle && <Body className="text-slate-500 font-medium">{subtitle}</Body>}
        </div>

        {actions && actions.length > 0 && (
          <ActionButtonGroup actions={actions} align="right" />
        )}
      </div>

      {/* Summary Cards */}
      {summaryCards && summaryCards.length > 0 && (
        <SummaryCards cards={summaryCards} />
      )}

      {/* Document Trace */}
      {documentTrace && documentTrace.length > 0 && (
        <DocumentTrace documents={documentTrace} />
      )}

      {/* Tabs */}
      {tabs && tabs.length > 0 ? (
        <div className="space-y-4">
          {/* Tab Headers */}
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all",
                    "border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-900",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>{activeTabContent}</div>
        </div>
      ) : (
        // Direct content if no tabs
        children && <div>{children}</div>
      )}
    </div>
  );
};
