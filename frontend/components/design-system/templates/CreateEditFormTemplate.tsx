"use client";

import React from "react";
import { H1, H2, Body } from "../atoms/Typography";
import { Button } from "../atoms/Button";
import { ActionButtonGroup, Action } from "../molecules/ActionButtonGroup";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CreateEditFormTemplate - Atomic Design System v1.0
 * Standard layout for create/edit pages
 * Layout: Breadcrumbs → Heading → Form Sections → Action Buttons
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface FormSection {
  title: string;
  description?: string;
  content: React.ReactNode;
}

export interface CreateEditFormTemplateProps {
  // Navigation
  breadcrumbs?: BreadcrumbItem[];

  // Header
  title: string;
  subtitle?: string;

  // Form sections
  sections: FormSection[];

  // Actions
  primaryAction: Action;
  secondaryActions?: Action[];

  // State
  loading?: boolean;

  className?: string;
}

export const CreateEditFormTemplate: React.FC<CreateEditFormTemplateProps> = ({
  breadcrumbs,
  title,
  subtitle,
  sections,
  primaryAction,
  secondaryActions = [],
  loading = false,
  className,
}) => {
  return (
    <div className={cn("max-w-5xl mx-auto space-y-6", className)}>
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

      {/* Page Header */}
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <H1>{title}</H1>
        {subtitle && <Body className="text-slate-500 font-medium">{subtitle}</Body>}
      </div>

      {/* Form Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            <div className="space-y-1">
              <H2 className="text-[16px] font-semibold">{section.title}</H2>
              {section.description && (
                <Body className="text-slate-500 font-medium">{section.description}</Body>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 -mx-6 flex items-center justify-between gap-4 backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-3">
          {secondaryActions.length > 0 && (
            <ActionButtonGroup actions={secondaryActions} align="left" />
          )}
        </div>

        <Button
          variant={primaryAction.variant || "default"}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || loading}
          className="min-w-32"
        >
          {primaryAction.icon}
          {primaryAction.label}
        </Button>
      </div>
    </div>
  );
};
