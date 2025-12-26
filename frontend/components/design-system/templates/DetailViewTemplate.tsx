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
                  className="text-[#6B7280] hover:text-[#1A3D7C] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[#111827] font-medium">
                  {crumb.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={16} className="text-[#9CA3AF]" />
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
          {subtitle && <Body className="text-[#6B7280]">{subtitle}</Body>}
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
          <div className="border-b border-[#E5E7EB]">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-[14px] font-medium transition-all",
                    "border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-[#1A3D7C] text-[#1A3D7C]"
                      : "border-transparent text-[#6B7280] hover:text-[#111827]",
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
