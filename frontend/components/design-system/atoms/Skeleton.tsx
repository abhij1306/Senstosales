"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "text";
}

const SkeletonInternal = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangle", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "animate-pulse bg-slate-200/60 dark:bg-slate-800/60",
        variant === "rectangle" && "rounded-md",
        variant === "circle" && "rounded-full",
        variant === "text" && "h-4 rounded",
        className,
      )}
      {...props}
    />
  ),
);
SkeletonInternal.displayName = "Skeleton";

export const Skeleton = React.memo(SkeletonInternal);

export function SummaryCardSkeleton() {
  return (
    <div className="flex flex-col justify-between p-4 rounded-xl min-h-[110px] h-full border bg-white/45 backdrop-blur-xl border-white/20 shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" className="w-24 h-3 bg-slate-200/50" />
        <Skeleton variant="circle" className="w-8 h-8 bg-slate-200/50" />
      </div>
      <div className="mt-auto pt-4 space-y-2">
        <Skeleton variant="text" className="w-20 h-7 bg-slate-200/50" />
        <Skeleton variant="text" className="w-28 h-3 bg-slate-200/30" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-slate-100/50 last:border-0 px-4 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "h-4 bg-slate-200/40",
            i === 0 ? "w-[20%]" : i === 1 ? "w-[15%]" : "w-[10%]",
            i >= 2 && "ml-auto", // Push last ones to right if they look like numeric
          )}
        />
      ))}
    </div>
  );
}
