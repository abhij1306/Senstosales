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
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, required, ...props }, ref) => {
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
              // Base styles matching spec
              "flex h-[38px] w-full rounded-md border bg-white px-3 py-2",
              "text-sm font-normal text-[#111827] placeholder:text-[#9CA3AF]",
              "transition-all duration-200",
              // Border states
              error
                ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                : "border-[#D1D5DB] focus:border-[#1A3D7C] focus:ring-2 focus:ring-[#1A3D7C]/20",
              // Focus state
              "focus:outline-none",
              // Disabled state
              "disabled:bg-[#F6F8FB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed",
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
Input.displayName = "Input";
