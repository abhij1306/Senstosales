"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Icon Atom - Atomic Design System v1.0
 * Wrapper for lucide-react icons with consistent sizing
 * Default: 20px, Stroke: 2px
 */

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: keyof typeof LucideIcons;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: 16,
  md: 20, // Default from spec
  lg: 24,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  className,
  ...props
}) => {
  const LucideIcon = LucideIcons[
    name
  ] as React.ComponentType<LucideIcons.LucideProps>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <LucideIcon
      size={sizeMap[size]}
      strokeWidth={2}
      className={className}
      {...props}
    />
  );
};
