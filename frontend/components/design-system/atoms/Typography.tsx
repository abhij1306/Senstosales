"use client";

import React from "react";
import { cn, formatIndianCurrency } from "@/lib/utils";

/**
 * Typography Atoms - Atomic Design System v1.0
 * Fixed scale: 12px (table), 14px (body), 16px (label), 20px (subheading), 28px (heading)
 * Weights: 400 (normal), 500 (medium), 600 (semibold)
 */

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

// Heading: 28px, medium
export const H1 = ({ className, children, ...props }: TypographyProps) => (
  <h1
    className={cn(
      "text-[28px] font-medium leading-tight text-[#111827]",
      className,
    )}
    {...props}
  >
    {children}
  </h1>
);

// Subheading: 20px, medium
export const H2 = ({ className, children, ...props }: TypographyProps) => (
  <h2
    className={cn(
      "text-[20px] font-medium leading-tight text-[#111827]",
      className,
    )}
    {...props}
  >
    {children}
  </h2>
);

// Section heading: 16px, medium
export const H3 = ({ className, children, ...props }: TypographyProps) => (
  <h3
    className={cn(
      "text-[16px] font-medium leading-normal text-slate-950",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
);

// Body text (Value): 13px, medium
export const Body = ({ className, children, ...props }: TypographyProps) => (
  <p
    className={cn(
      "text-[13px] font-medium leading-relaxed text-slate-950",
      className,
    )}
    {...props}
  >
    {children}
  </p>
);

// Label text: 10px, semibold, uppercase
export const Label = ({ className, children, ...props }: LabelProps) => (
  <label
    className={cn(
      "text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1",
      className,
    )}
    {...props}
  >
    {children}
  </label>
);

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
export const MonoCode = ({
  className,
  children,
  ...props
}: TypographyProps) => (
  <code
    className={cn(
      "text-[12px] font-mono font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-900",
      className,
    )}
    {...props}
  >
    {children}
  </code>
);
