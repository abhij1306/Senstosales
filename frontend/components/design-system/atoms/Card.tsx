"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Card Atom - Atomic Design System v1.0
 * Professional "Glassmorphism" for high-density business intelligence.
 * Surface: bg-white/45 | backdrop-blur-xl (24px) | border-white/20.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

const CardInternal = ({ className, glass = true, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        glass
          ? "bg-white/45 backdrop-blur-xl border-white/20 shadow-sm"
          : "bg-white border-slate-200 shadow-sm",
        className,
      )}
      {...props}
    />
  );
};

export const Card = React.memo(CardInternal);
