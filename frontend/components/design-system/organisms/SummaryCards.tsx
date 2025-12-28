"use client";

import React from "react";
import { Card } from "../atoms/Card";
import { H2, SmallText } from "../atoms/Typography";
import { cn } from "@/lib/utils";
import { SummaryCardSkeleton } from "../atoms/Skeleton";

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

const variantTextStyles = {
  default: "text-slate-900",
  primary: "text-[#1A3D7C]",
  secondary: "text-[#1E8A79]",
  success: "text-[#16A34A]",
  warning: "text-[#F59E0B]",
};

const variantIconStyles = {
  default: "bg-slate-50 text-slate-600",
  primary: "bg-[#1A3D7C]/10 text-[#1A3D7C]",
  secondary: "bg-[#1E8A79]/10 text-[#1E8A79]",
  success: "bg-[#16A34A]/10 text-[#16A34A]",
  warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
};

const trendStyles = {
  up: "text-emerald-600",
  down: "text-rose-600",
  neutral: "text-slate-400",
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
  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between min-h-[110px] h-full",
        "bg-comp-card-kpi-bg hover:shadow-lg hover:-translate-y-0.5", // Keep hover effects as they add interactivity
        className,
      )}
    >
      <div className="flex justify-between items-start">
        <SmallText className={cn(
          "uppercase tracking-widest font-bold text-[11px]",
          variant !== "default" ? variantTextStyles[variant] : "text-sys-color-text-secondary"
        )}>
          {title}
        </SmallText>

        {/* Icon - Clean Circle */}
        {icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-base transition-colors duration-300",
              variantIconStyles[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <H2 className={cn(
          "leading-none font-bold",
          variantTextStyles[variant]
        )}>
          {value}
        </H2>

        {/* Trend indicator area - fixed height to prevent layout shift */}
        <div className="h-4 flex items-end mt-1">
          {trend ? (
            <div
              className={cn(
                "text-[10px] font-semibold flex items-center gap-1",
                trendStyles[trend.direction],
              )}
            >
              <span className="opacity-70">{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'}</span>
              <span>{trend.value}</span>
              <span className="text-slate-400 font-medium ml-0.5">VS L/M</span>
            </div>
          ) : (
            <div className="text-[10px] opacity-0 pointer-events-none">Spacer</div>
          )}
        </div>
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
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3",
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
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3",
        className,
      )}
    >
      {cards.map((card, index) => (
        <motion.div key={index} variants={item} className="h-full">
          <SummaryCard {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
});
