import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "interact";
}

const GlassCard = ({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass-panel p-5",
        variant === "interact" && "glass-panel-interactive cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
