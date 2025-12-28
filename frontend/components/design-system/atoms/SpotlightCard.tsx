"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
}

const SpotlightCardInternal = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ children, className, active = false, ...props }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return;
      const rect = divRef.current.getBoundingClientRect();
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setOpacity(1);
    };

    const handleMouseLeave = () => {
      setOpacity(0);
    };

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative overflow-hidden rounded-xl border border-slate-200 bg-white/40 backdrop-blur-xl group",
          "transition-all duration-300",
          active ? "ring-2 ring-blue-500/20" : "hover:border-slate-300",
          className,
        )}
        {...props}
      >
        <div ref={divRef} className="absolute inset-0 pointer-events-none">
          {/* The Moving Spotlight Gradient */}
          <div
            className="absolute -inset-px transition-opacity duration-300"
            style={{
              opacity,
              background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.10), transparent 40%)`,
            }}
          />

          {/* Interactive Border Gradient */}
          <div
            className="absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
              maskImage:
                "linear-gradient(black, black) content-box, linear-gradient(black, black)",
              maskComposite: "exclude",
            }}
          />
        </div>

        <div className="relative">{children}</div>
      </div>
    );
  },
);
SpotlightCardInternal.displayName = "SpotlightCard";

export const SpotlightCard = React.memo(SpotlightCardInternal);
