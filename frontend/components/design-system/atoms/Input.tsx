"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Atom - Atomic Design System v1.0
 * Spec: 38px height, 6px radius, 12px padding
 * Border: #D1D5DB, Focus: #1A3D7C
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  variant?: "default" | "glass" | "ghost";
}

const InputInternal = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, required, variant = "default", ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within:text-[#1A3D7C] transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              // v5.0 Neomorphic & High Density
              "flex h-[34px] w-full rounded-lg px-3 py-1.5",
              "text-[13px] font-medium text-slate-950 placeholder:text-slate-400",
              "transition-all duration-300",
              // Variant styles
              variant === "default" && "bg-[#f0f4f8] border-none neo-extrusion focus:shadow-inner",
              variant === "glass" && "bg-white/40 border border-white/50 backdrop-blur-md shadow-sm",
              variant === "ghost" && "bg-transparent border-none shadow-none focus:bg-slate-50 focus:shadow-sm p-0 h-auto rounded-md",
              // Error state
              error && "ring-1 ring-red-500/50",
              icon && "pl-10",
              className,
            )}
            ref={ref}
            required={required}
            {...props}
          />
          {/* Required indicator */}
          {required && !props.value && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DC2626] text-sm pointer-events-none">
              *
            </span>
          )}
        </div>
        {/* Error message */}
        {error && <p className="mt-1 text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  },
);
InputInternal.displayName = "Input";

export const Input = React.memo(InputInternal);
