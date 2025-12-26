"use client";

import React from "react";
import { Card } from "../atoms/Card";
import { H2, SmallText } from "../atoms/Typography";
import { cn } from "@/lib/utils";
import { SummaryCardSkeleton } from "../../ui/Skeleton";

/**
 * SummaryCard Organism - Atomic Design System v1.0
 * Used in dashboard and list pages for KPI display
 * Max 4 per row, equal height, real data only
 */

export interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  variant?: "default" | "primary" | "success" | "warning" | "secondary";
  className?: string;
}

const variantStyles = {
  default: "bg-white border-[#E5E7EB]",
  primary:
    "bg-gradient-to-br from-[#1A3D7C] to-[#152F61] text-white border-transparent",
  secondary:
    "bg-gradient-to-br from-[#2BB7A0] to-[#1E8A79] text-white border-transparent",
  success:
    "bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white border-transparent",
  warning:
    "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white border-transparent",
};

const trendStyles = {
  up: "text-[#16A34A]",
  down: "text-[#DC2626]",
  neutral: "text-[#6B7280]",
};

export const SummaryCard = React.memo(function SummaryCard({
  title,
  value,
  icon,
  trend,
  variant = "default",
  className,
}: SummaryCardProps) {
  const isColored = variant !== "default";

  return (
    <Card
      className={cn(
        "flex items-center gap-4 transition-all duration-200 hover:shadow-lg min-h-[100px]",
        variantStyles[variant],
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            "p-3 rounded-full shrink-0",
            isColored ? "bg-white/20" : "bg-[#1A3D7C]/10",
          )}
        >
          <div className={isColored ? "text-white" : "text-[#1A3D7C]"}>
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <H2
          className={cn(
            "mb-1 tabular-nums transition-all truncate",
            isColored ? "text-white" : "text-[#111827]",
          )}
        >
          {value}
        </H2>
        <SmallText
          className={cn(
            "uppercase tracking-wide",
            isColored ? "text-white/80" : "text-[#6B7280]",
          )}
        >
          {title}
        </SmallText>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              "text-[10px] font-medium mt-1 flex items-center gap-1",
              isColored ? "text-white/90" : trendStyles[trend.direction],
            )}
          >
            {trend.direction === "up" && "↑"}
            {trend.direction === "down" && "↓"}
            {trend.direction === "neutral" && "→"}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </Card>
  );
});

/**
 * SummaryCards Container
 * Ensures max 4 per row with equal heights
 */
export interface SummaryCardsProps {
  cards: SummaryCardProps[];
  loading?: boolean;
  className?: string;
}

export const SummaryCards = React.memo(function SummaryCards({
  cards,
  loading,
  className,
}: SummaryCardsProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
          className,
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
});
