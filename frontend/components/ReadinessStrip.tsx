import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

interface ReadinessStep {
  label: string;
  status: "completed" | "current" | "pending" | "error" | "warning";
  date?: string;
}

interface ReadinessStripProps {
  steps: ReadinessStep[];
  className?: string;
}

export function ReadinessStrip({ steps, className }: ReadinessStripProps) {
  return (
    <div
      className={cn("w-full bg-surface-1 border-b border-border", className)}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                className={cn(
                  "flex items-center gap-2 transition-colors duration-200",
                  getStatusColor(step.status),
                )}
              >
                <StatusIcon status={step.status} />
                <div className="flex flex-col leading-none">
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="text-[10px] opacity-80 mt-1">
                      {step.date}
                    </span>
                  )}
                </div>
              </div>

              {/* Connector Line (except for last item) */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-4 bg-border/60 relative">
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-500",
                      step.status === "completed"
                        ? "bg-success/40"
                        : "bg-transparent",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ReadinessStep["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5" />;
    case "error":
      return <AlertCircle className="w-5 h-5" />;
    case "warning":
      return <Clock className="w-5 h-5" />;
    case "current":
      return (
        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        </div>
      );
    default:
      return <Circle className="w-5 h-5 text-text-muted/30" />;
  }
}

function getStatusColor(status: ReadinessStep["status"]) {
  switch (status) {
    case "completed":
      return "text-success";
    case "current":
      return "text-primary";
    case "error":
      return "text-danger";
    case "warning":
      return "text-warning";
    default:
      return "text-text-muted/40";
  }
}
