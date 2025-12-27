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
        "relative flex flex-col justify-between p-4 rounded-xl transition-all duration-200 min-h-[110px] border hover:shadow-lg hover:-translate-y-1",
        // Restore original colored backgrounds
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex justify-between items-start">
        <SmallText className={cn(
          "uppercase tracking-wider font-semibold text-[10px]",
          isColored ? "text-white" : "text-slate-500/90"
        )}>
          {title}
        </SmallText>

        {/* Icon - Clean Circle */}
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-base",
              variant === "primary" ? "bg-white/20 text-white" :
                variant === "success" ? "bg-white/20 text-white" :
                  variant === "warning" ? "bg-white/20 text-white" :
                    variant === "secondary" ? "bg-white/20 text-white" :
                      "bg-slate-50 text-slate-600"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className={cn(
          "text-2xl font-bold tracking-tight",
          isColored ? "text-white" : "text-slate-900"
        )}>
          {value}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              "text-[10px] font-medium mt-1 flex items-center gap-1",
              isColored ? "text-white" : trendStyles[trend.direction],
            )}
          >
            <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'}</span>
            <span>{trend.value}</span>
            <span className={cn(
              "ml-1",
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
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
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
