import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatBlockProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "primary" | "teal" | "navy";
}

export const StatBlock = ({
  label,
  value,
  delta,
  icon,
  className,
  variant = "default",
}: StatBlockProps) => {
  const variantStyles = {
    default: "bg-white shadow-sm",
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    teal: "bg-gradient-to-br from-cyan-500 via-teal-500 to-green-500 text-white",
    navy: "bg-gradient-to-br from-[#2d4a6e] via-[#1E3A5F] to-[#152841] text-white",
  };

  const isColored = variant !== "default";

  return (
    <div
      className={cn(
        "rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg",
        variantStyles[variant],
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            "p-3 rounded-full shrink-0",
            isColored ? "bg-white/20" : "bg-primary/10",
          )}
        >
          <div className={isColored ? "text-white" : "text-primary"}>
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <div
          className={cn(
            "text-2xl font-semibold tabular-nums leading-none mb-1",
            isColored ? "text-white" : "text-slate-900",
          )}
        >
          {value}
        </div>
        <div
          className={cn(
            "text-[11px] font-medium",
            isColored ? "text-white/70" : "text-slate-500",
          )}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
