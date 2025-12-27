"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Card } from "../atoms/Card";
import { H3 } from "../atoms/Typography";
import { Button } from "../atoms/Button";
import { cn } from "@/lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string; // For the content container
  maxWidth?: string; // e.g. "max-w-md", "max-w-2xl"
}

const DialogInternal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  maxWidth = "max-w-md",
}: DialogProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className={cn("w-full pointer-events-auto", maxWidth)}
            >
              <Card
                className={cn(
                  "overflow-hidden shadow-2xl border border-white/20",
                  "bg-white/45 backdrop-blur-xl", // Professional Glassmorphism
                  className,
                )}
                glass={true}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50">
                  <H3 className="text-slate-950 uppercase tracking-wider">{title || "Dialog"}</H3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-200/50 text-slate-500"
                  >
                    <X size={18} />
                  </Button>
                </div>

                {/* Body */}
                <div className="p-6">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200/50 flex justify-end gap-3">
                    {footer}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export const Dialog = React.memo(DialogInternal);
