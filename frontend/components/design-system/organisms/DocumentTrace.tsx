"use client";

import React from "react";
import { Card } from "../atoms/Card";
import { H3, Body, SmallText } from "../atoms/Typography";
import { Badge } from "../atoms/Badge";
import { ArrowRight, FileText, Truck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DocumentTrace Organism - Atomic Design System v1.0
 * Shows PO → DC → Invoice linkage hierarchy
 * Must display real document numbers and statuses
 */

export interface DocumentNode {
  type: "po" | "dc" | "invoice";
  number: string;
  date: string;
  status: "pending" | "completed" | "active";
  link?: string;
}

export interface DocumentTraceProps {
  documents: DocumentNode[];
  className?: string;
}

const documentConfig = {
  po: {
    icon: FileText,
    label: "Purchase Order",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  dc: {
    icon: Truck,
    label: "Delivery Challan",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  invoice: {
    icon: Receipt,
    label: "GST Invoice",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
};

const DocumentNode: React.FC<{ node: DocumentNode; isLast: boolean }> = ({
  node,
  isLast,
}) => {
  const config = documentConfig[node.type];
  const Icon = config.icon;

  const content = (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
        node.link
          ? "cursor-pointer hover:border-blue-600 hover:shadow-md"
          : "border-slate-200",
      )}
    >
      <div className={cn("p-2 rounded-lg", config.bgColor)}>
        <Icon size={20} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <SmallText className="uppercase mb-0.5 font-semibold text-slate-500 tracking-wider text-[10px]">{config.label}</SmallText>
        <div className="font-semibold text-slate-900">{node.number}</div>
        <div className="text-[12px] text-slate-500 font-medium mt-0.5">{node.date}</div>
      </div>
      <Badge
        variant={
          node.status === "completed"
            ? "success"
            : node.status === "active"
              ? "default"
              : "warning"
        }
      >
        {node.status}
      </Badge>
    </div>
  );

  return (
    <div className="flex items-center gap-4">
      {node.link ? (
        <a href={node.link} className="flex-1">
          {content}
        </a>
      ) : (
        <div className="flex-1">{content}</div>
      )}

      {!isLast && <ArrowRight size={18} className="text-slate-300 shrink-0" />}
    </div>
  );
};

export const DocumentTrace: React.FC<DocumentTraceProps> = ({
  documents,
  className,
}) => {
  return (
    <Card className={cn("p-6", className)}>
      <H3 className="mb-4 text-[13px] font-semibold text-slate-500 uppercase tracking-[0.15em]">Document Traceability</H3>
      <Body className="text-slate-600 font-medium mb-6">
        Track the complete document flow from purchase order to invoice
      </Body>

      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {documents.map((doc, index) => (
          <DocumentNode
            key={index}
            node={doc}
            isLast={index === documents.length - 1}
          />
        ))}
      </div>
    </Card>
  );
};
