import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "neutral" | "info";
  className?: string;
}

// Map common statuses to variants automatically if not provided
const getVariant = (status: string, explicitVariant?: string) => {
  if (explicitVariant) return explicitVariant;

  const lower = (status || "").toLowerCase();

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
  if (["pending", "processing", "open", "partial"].includes(lower))
    return "warning";
  if (["rejected", "failed", "cancelled", "overdue", "missing"].includes(lower))
    return "error";

  return "neutral";
};

const StatusBadge = ({ status, variant, className }: StatusBadgeProps) => {
  const finalVariant = getVariant(status, variant);

  const styles = {
    success:
      "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]",
    warning:
      "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]",
    error:
      "bg-[hsl(var(--error)/0.15)] text-[hsl(var(--error))] border-[hsl(var(--error)/0.2)]",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    info: "bg-blue-50 text-blue-600 border-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
        styles[finalVariant as keyof typeof styles],
        className,
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
