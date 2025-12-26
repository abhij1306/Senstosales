"use client";

import React from "react";
import { Button } from "../atoms/Button";
import { cn } from "@/lib/utils";

/**
 * ActionButtonGroup Molecule - Atomic Design System v1.0
 * Composition: 2-3 aligned buttons (Edit / Download / Delete)
 */

export interface Action {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "ghost";
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ActionButtonGroupProps {
  actions: Action[];
  align?: "left" | "center" | "right";
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  align = "right",
  className,
}) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={cn("flex items-center gap-2", alignClasses[align], className)}
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || "ghost"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          className="gap-1.5"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
};
