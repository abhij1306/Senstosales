"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "neutral" | "info";
  className?: string;
}

// Map common statuses to variants automatically if not provided
const getVariant = (status: string, explicitVariant?: string) => {
  if (explicitVariant) return explicitVariant;

  // Handle numerical statuses (e.g., from some API fields)
  let statusStr = String(status || "");
  if (statusStr === "0") statusStr = "Draft";
  if (statusStr === "1") statusStr = "Active";

  const lower = statusStr.toLowerCase();

  if (
    [
      "received",
      "completed",
      "delivered",
      "paid",
      "approved",
      "valid",
    ].includes(lower)
  )
    return "success";
  if (["active", "processing", "open"].includes(lower))
    return "info"; // Primary/Active is Blue/Info
  if (["pending", "partial", "draft"].includes(lower))
    return "warning";
  if (["rejected", "failed", "cancelled", "overdue", "missing"].includes(lower))
    return "error";

  return "neutral";
};

const StatusBadgeInternal = ({ status, variant, className }: StatusBadgeProps) => {
  const finalVariant = getVariant(status, variant);

  const styles = {
    // DS v5.0 Semantic Colors
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    info: "bg-blue-600/10 text-blue-600 border-blue-600/20", // Matches Primary Active
  };

  const label = String(status) === "0" ? "DRAFT" : String(status) === "1" ? "ACTIVE" : status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest",
        styles[finalVariant as keyof typeof styles],
        className,
      )}
    >
      {label}
    </span>
  );
};

StatusBadgeInternal.displayName = "StatusBadge";

export const StatusBadge = memo(StatusBadgeInternal);
