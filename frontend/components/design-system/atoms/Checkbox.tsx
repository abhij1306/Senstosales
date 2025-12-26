"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Checkbox Atom - Atomic Design System v1.0
 * Spec: 18px size, 4px radius, #1A3D7C selected
 */

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(
            "h-[18px] w-[18px] rounded border-[#D1D5DB] text-[#1A3D7C]",
            "focus:ring-2 focus:ring-[#1A3D7C] focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "cursor-pointer",
            className,
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-[14px] font-normal text-[#111827] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
