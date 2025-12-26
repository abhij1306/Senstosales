"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge Atom - Atomic Design System v1.0
 * Uses strict color palette with proper contrast
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

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    // Primary blue
    default: "bg-[#1A3D7C]/10 text-[#1A3D7C] border-[#1A3D7C]/20",
    // Teal secondary
    secondary: "bg-[#2BB7A0]/10 text-[#2BB7A0] border-[#2BB7A0]/20",
    // Success green
    success: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    // Warning amber
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    // Error red
    error: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
    // Outline
    outline: "bg-transparent text-[#111827] border-[#D1D5DB]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5",
        "text-[12px] font-medium uppercase tracking-tight",
        "transition-all duration-200",
        "mb-1 tabular-nums transition-all truncate",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
