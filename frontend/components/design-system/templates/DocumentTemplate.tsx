"use client";

import React from "react";
import { H1 } from "../atoms/Typography";
import { cn } from "@/lib/utils";

import { ArrowLeft } from "lucide-react";
import { Button } from "../atoms/Button";

import { motion } from "framer-motion";

interface DocumentTemplateProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  layoutId?: string;
}

export const DocumentTemplate = ({
  title,
  description,
  actions,
  children,
  className,
  onBack,
  layoutId,
}: DocumentTemplateProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          <div>
            {layoutId ? (
              <motion.div layoutId={layoutId}>
                <H1 className="uppercase tracking-tight text-slate-950">
                  {title}
                </H1>
              </motion.div>
            ) : (
              <H1 className="uppercase tracking-tight text-slate-950">
                {title}
              </H1>
            )}
            {description && (
              <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mt-0.5">
                {description}
              </div>
            )}
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="px-1">{children}</div>
    </div>
  );
};
