"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Atom - Atomic Design System v1.1
 * Spec: 38px height, 6px radius, 12px padding
 * Border: Slate 300, Focus: Blue 600
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const InputInternal = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, required, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              // Base styles matching spec
              "flex h-[38px] w-full rounded-md border bg-white px-3 py-2",
              "text-[13px] font-medium text-slate-950 placeholder:text-slate-400",
              "transition-all duration-200",
              // Border states
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20",
              // Focus state
              "focus:outline-none",
              // Disabled state
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              // Icon padding
              icon && "pl-10",
              className,
            )}
            ref={ref}
            required={required}
            {...props}
          />
          {/* Required indicator */}
          {required && !props.value && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm pointer-events-none">
              *
            </span>
          )}
        </div>
        {/* Error message */}
        {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
      </div>
    );
  },
);
InputInternal.displayName = "InputInternal";

export const Input = React.memo(InputInternal);
