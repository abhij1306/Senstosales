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
  default: "bg-white border-slate-200 shadow-sm",
  primary:
    "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-transparent",
  secondary:
    "bg-gradient-to-br from-slate-600 to-slate-700 text-white border-transparent",
  success:
    "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent",
  warning:
    "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-transparent",
};

const trendStyles = {
  up: "text-emerald-600",
  down: "text-red-500",
  neutral: "text-slate-500",
};

import { motion, AnimatePresence } from "framer-motion";

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
    <div
      className={cn(
        "relative flex flex-col justify-between p-4 rounded-xl transition-all duration-300 min-h-[95px] border hover:shadow-lg hover:-translate-y-0.5",
        // Restore original colored backgrounds
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex justify-between items-start">
        <SmallText className={cn(
          "uppercase tracking-[0.1em] font-semibold text-[10px]",
          isColored ? "text-white/90" : "text-slate-500"
        )}>
          {title}
        </SmallText>

        {/* Icon - Clean Circle */}
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110",
              variant === "primary" ? "bg-white/20 text-white" :
                variant === "success" ? "bg-white/10 text-white" :
                  variant === "warning" ? "bg-white/20 text-white" :
                    variant === "secondary" ? "bg-white/20 text-white" :
                      "bg-slate-50 text-slate-600 border border-slate-100"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className={cn(
          "text-2xl font-medium tracking-tight",
          isColored ? "text-white" : "text-slate-950"
        )}>
          {value}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              "text-[10px] font-medium mt-1.5 flex items-center gap-1.5",
              isColored ? "text-white/80" : trendStyles[trend.direction],
            )}
          >
            <span className="text-xs">{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'}</span>
            <span className="tracking-wide">{trend.value}</span>
            <span className={cn(
              "ml-0.5 opacity-70",
              isColored ? "text-white" : "text-slate-400"
            )}>vs last month</span>
          </div>
        )}
      </div>
    </div>
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    } as any
  }
};

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {cards.map((card, index) => (
        <motion.div key={index} variants={item}>
          <SummaryCard {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
});
