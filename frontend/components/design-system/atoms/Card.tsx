"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Card Atom - Atomic Design System v1.0
 * Spec: 8px radius, 20px padding, white background, subtle shadow
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardInternal = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-white p-5 border border-[#E5E7EB]",
          "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CardInternal.displayName = "CardInternal";

export const Card = React.memo(CardInternal);
