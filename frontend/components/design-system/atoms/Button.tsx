"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Atom - Atomic Design System v1.1
 * Spec: 40px height, 8px radius, 16px padding
 * Colors: Blue 600 (Primary), Emerald 600 (Secondary), Red 600 (Destructive)
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Blue 600
        default:
          "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",

        // Secondary: White/Ghost background with slate border
        secondary:
          "bg-white/50 text-slate-700 border border-slate-200 hover:bg-white active:bg-slate-50",

        // Destructive: Red background or Red text
        destructive:
          "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 border border-red-100",

        // Ghost: Transparent, subtle hover
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100/50 active:bg-slate-100",

        // Outline: Border with transparent background
        outline:
          "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100",

        // Link: No background, underline on hover
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        // Default: 40px height, 16px horizontal padding
        default: "h-10 px-4 py-2.5",

        // Small: 32px height, 12px horizontal padding
        sm: "h-8 px-3 py-1.5 text-xs",

        // Large: 48px height, 24px horizontal padding
        lg: "h-12 px-6 py-3",

        // Icon: 40px square
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ButtonInternal = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
ButtonInternal.displayName = "ButtonInternal";

// Memoized export to prevent re-renders when props haven't changed
export const Button = React.memo(ButtonInternal);
export { buttonVariants };
