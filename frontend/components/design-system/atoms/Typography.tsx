"use client";

import React from "react";
import { cn, formatIndianCurrency } from "@/lib/utils";

/**
 * Typography Atoms - Atomic Design System v5.0 (DSC Compliant)
 * Fixed scale: 10px (header 4), 13px (body), 16px (header 3), 20px (header 2), 28px (header 1)
 * Weights: 400 (normal), 500 (medium), 600 (semibold)
 */

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

// Heading (H1): 28px, font-medium, UPPERCASE
const H1Internal = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(
        "text-[28px] font-medium leading-tight text-slate-950 uppercase tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
);
H1Internal.displayName = "H1";
export const H1 = React.memo(H1Internal);

// Subheading: 20px, font-medium
const H2Internal = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-[20px] font-medium leading-tight text-slate-950 tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
);
H2Internal.displayName = "H2";
export const H2 = React.memo(H2Internal);

// Section heading: 16px, medium
const H3Internal = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-[16px] font-medium leading-normal text-slate-950",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
);
H3Internal.displayName = "H3";
export const H3 = React.memo(H3Internal);

// Body text (Value): 13px, medium
const BodyInternal = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-[13px] font-medium leading-relaxed text-slate-950",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  ),
);
BodyInternal.displayName = "Body";
export const Body = React.memo(BodyInternal);

// Label text: 10px, semibold, uppercase, slate-600
const LabelInternal = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[10px] font-semibold text-slate-600 uppercase tracking-widest block mb-1",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  ),
);
LabelInternal.displayName = "Label";
export const Label = React.memo(LabelInternal);

// Small/Secondary text: 11px, medium
const SmallTextInternal = ({
  className,
  children,
  ...props
}: TypographyProps) => (
  <small
    className={cn("text-[11px] font-medium text-slate-500", className)}
    {...props}
  >
    {children}
  </small>
);
export const SmallText = React.memo(SmallTextInternal);

// Table text: 12px, normal
const TableTextInternal = ({
  className,
  children,
  ...props
}: TypographyProps) => (
  <span
    className={cn("text-[12px] font-normal text-slate-900", className)}
    {...props}
  >
    {children}
  </span>
);
export const TableText = React.memo(TableTextInternal);

// Accounting/Numeric: 13px, mono, medium
const AccountingInternal = ({
  className,
  children,
  isCurrency,
  short,
  ...props
}: TypographyProps & { isCurrency?: boolean; short?: boolean }) => {
  let content = children;

  if (isCurrency && typeof children === "number") {
    if (short) {
      content = formatIndianCurrency(children);
    } else {
      content = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(children);
    }
  } else if (typeof children === "number") {
    content = children.toLocaleString("en-IN");
  }

  return (
    <span
      className={cn(
        "text-[13px] font-medium font-mono tabular-nums text-slate-950",
        className,
      )}
      suppressHydrationWarning
      {...props}
    >
      {content}
    </span>
  );
};
export const Accounting = React.memo(AccountingInternal);

// Mono/Code text: 12px, mono font
const MonoCodeInternal = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        "text-[12px] font-mono font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-900",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
);
MonoCodeInternal.displayName = "MonoCode";
export const MonoCode = React.memo(MonoCodeInternal);
