"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "text";
}

export function Skeleton({
  className,
  variant = "rectangle",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/60 dark:bg-slate-800/60",
        variant === "rectangle" && "rounded-md",
        variant === "circle" && "rounded-full",
        variant === "text" && "h-4 rounded",
        className,
      )}
      {...props}
    />
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-5 border border-[#E5E7EB] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center gap-4 h-[100px]">
      <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-2/3 h-6" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0 px-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "h-4",
            i === 0 ? "w-[25%]" : i === 1 ? "w-[20%]" : "w-[15%]",
          )}
        />
      ))}
    </div>
  );
}
