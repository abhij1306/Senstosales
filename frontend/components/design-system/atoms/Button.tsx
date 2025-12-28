"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Button Atom - Atomic Design System v5.0
 * High-density, Enterprise styling.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Blue-600 background, white text - Enterprise Default
        default:
          "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-900/10 active:shadow-inner",

        // Secondary: White glass-morphic button
        secondary:
          "bg-white/40 backdrop-blur-xl text-slate-900 border border-white/20 hover:bg-white active:shadow-inner neo-extrusion transition-all duration-300",

        // Destructive: Red-500 background, white text
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",

        // Ghost: Transparent, subtle hover - for toolbars
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",

        // Outline: Border with transparent background - for secondary actions
        outline:
          "bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100",

        // Link: Simple text with underline behavior
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        // High Density Default: 36px height
        default: "h-9 px-4 py-2",
        // Extra Compact: 32px height
        sm: "h-8 px-3 text-[11px]",
        // Large: 44px height
        lg: "h-11 px-6 text-base",
        // Icon Square
        icon: "h-9 w-9",
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

export const Button = React.memo(ButtonInternal);
export { buttonVariants };
