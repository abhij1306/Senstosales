import React from "react";
import { cn } from "@/lib/utils";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: "low" | "medium" | "high";
  interactive?: boolean;
}

export const GlassContainer = ({
  children,
  className,
  intensity = "medium",
  interactive = false,
  ...props
}: GlassContainerProps) => {
  const intensityMap = {
    low: "bg-white/10 backdrop-blur-sm",
    medium: "bg-white/30 backdrop-blur-md",
    high: "bg-white/50 backdrop-blur-xl",
  };

  return (
    <div
      className={cn(
        intensityMap[intensity],
        "rounded-2xl shadow-lg",
        interactive &&
          "hover:bg-white/40 transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
