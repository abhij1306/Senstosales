"use client";

import React from "react";
import { Badge } from "../atoms/Badge";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

/**
 * StatusTag Molecule - Atomic Design System v1.0
 * Composition: Badge + Optional Icon
 * Ensures no color-only meaning (includes text/icon)
 */

export interface StatusTagProps {
  status: "active" | "pending" | "completed" | "error" | "inactive";
  label?: string;
  icon?: keyof typeof LucideIcons;
  className?: string;
}

const statusConfig = {
  active: {
    variant: "success" as const,
    defaultLabel: "Active",
    defaultIcon: "CheckCircle2" as keyof typeof LucideIcons,
  },
  pending: {
    variant: "warning" as const,
    defaultLabel: "Pending",
    defaultIcon: "Clock" as keyof typeof LucideIcons,
  },
  completed: {
    variant: "success" as const,
    defaultLabel: "Completed",
    defaultIcon: "Check" as keyof typeof LucideIcons,
  },
  error: {
    variant: "error" as const,
    defaultLabel: "Error",
    defaultIcon: "AlertCircle" as keyof typeof LucideIcons,
  },
  inactive: {
    variant: "outline" as const,
    defaultLabel: "Inactive",
    defaultIcon: "Minus" as keyof typeof LucideIcons,
  },
};

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  label,
  icon,
  className,
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;
  const iconName = icon || config.defaultIcon;
  const IconComponent = LucideIcons[
    iconName
  ] as React.ComponentType<LucideIcons.LucideProps>;

  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      {IconComponent && <IconComponent size={12} />}
      <span>{displayLabel}</span>
    </Badge>
  );
};
