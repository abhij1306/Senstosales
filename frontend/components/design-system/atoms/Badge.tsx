"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge Atom - Atomic Design System v5.0
 * High-density, professional indicators.
 * Font: 10px, Semibold, Uppercase.
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "outline";
}

const BadgeInternal = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      // Primary blue - Enterprise Standard
      default: "bg-blue-600/10 text-blue-600 border-blue-600/20",
      // Emerald - Growth / Success
      secondary: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
      success: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
      // Amber - Attention
      warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      // Red - Critical
      error: "bg-red-500/10 text-red-500 border-red-500/20",
      // Outline - Subtle
      outline: "bg-transparent text-slate-600 border-slate-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5",
          "text-[10px] font-semibold uppercase tracking-wider",
          "transition-all duration-200 tabular-nums truncate",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
BadgeInternal.displayName = "Badge";

export const Badge = React.memo(BadgeInternal);
