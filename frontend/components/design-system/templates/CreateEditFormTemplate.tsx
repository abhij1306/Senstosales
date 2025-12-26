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

      {/* Page Header */}
      <div className="space-y-2 pb-4 border-b border-[#E5E7EB]">
        <H1>{title}</H1>
        {subtitle && <Body className="text-[#6B7280]">{subtitle}</Body>}
      </div>

      {/* Form Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            <div className="space-y-1">
              <H2>{section.title}</H2>
              {section.description && (
                <Body className="text-[#6B7280]">{section.description}</Body>
              )}
            </div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-[#F6F8FB] border-t border-[#E5E7EB] px-6 py-4 -mx-6 flex items-center justify-between gap-4">
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
