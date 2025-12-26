"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Atom - Atomic Design System v1.0
 * Spec: 40px height, 8px radius, 16px padding
 * Colors: Primary #1A3D7C, Secondary #2BB7A0, Destructive #DC2626
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3D7C] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: #1A3D7C background, white text
        default:
          "bg-[#1A3D7C] text-white hover:bg-[#152F61] active:bg-[#0F2346]",

        // Secondary: Transparent bg, #2BB7A0 border and text
        secondary:
          "bg-transparent text-[#2BB7A0] border border-[#2BB7A0] hover:bg-[#F6F8FB] active:bg-[#E5E7EB]",

        // Destructive: #DC2626 background, white text
        destructive:
          "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B]",

        // Ghost: Transparent, subtle hover
        ghost:
          "bg-transparent text-[#111827] hover:bg-[#F6F8FB] active:bg-[#E5E7EB]",

        // Outline: Border with transparent background
        outline:
          "bg-transparent text-[#111827] border border-[#D1D5DB] hover:bg-[#F6F8FB] active:bg-[#E5E7EB]",

        // Link: No background, underline on hover
        link: "text-[#1A3D7C] underline-offset-4 hover:underline",
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
