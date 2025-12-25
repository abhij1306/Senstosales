"use client";

import React from 'react';
import { Card } from '../atoms/Card';
import { H3, Body, SmallText } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { ArrowRight, FileText, Truck, Receipt } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * DocumentTrace Organism - Atomic Design System v1.0
 * Shows PO → DC → Invoice linkage hierarchy
 * Must display real document numbers and statuses
 */

export interface DocumentNode {
    type: 'po' | 'dc' | 'invoice';
    number: string;
    date: string;
    status: 'pending' | 'completed' | 'active';
    link?: string;
}

export interface DocumentTraceProps {
    documents: DocumentNode[];
    className?: string;
}

const documentConfig = {
    po: {
        icon: FileText,
        label: 'Purchase Order',
        color: 'text-[#1A3D7C]',
        bgColor: 'bg-[#1A3D7C]/10',
    },
    dc: {
        icon: Truck,
        label: 'Delivery Challan',
        color: 'text-[#2BB7A0]',
        bgColor: 'bg-[#2BB7A0]/10',
    },
    invoice: {
        icon: Receipt,
        label: 'GST Invoice',
        color: 'text-[#F59E0B]',
        bgColor: 'bg-[#F59E0B]/10',
    },
};

const DocumentNode: React.FC<{ node: DocumentNode; isLast: boolean }> = ({ node, isLast }) => {
    const config = documentConfig[node.type];
    const Icon = config.icon;

    const content = (
        <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
            node.link ? "cursor-pointer hover:border-[#1A3D7C] hover:shadow-md" : "border-[#E5E7EB]"
        )}>
            <div className={cn("p-2 rounded", config.bgColor)}>
                <Icon size={20} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <SmallText className="uppercase mb-0.5">{config.label}</SmallText>
                <div className="font-semibold text-[#111827]">{node.number}</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">{node.date}</div>
            </div>
            <Badge variant={node.status === 'completed' ? 'success' : node.status === 'active' ? 'default' : 'warning'}>
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

            {!isLast && (
                <ArrowRight size={20} className="text-[#9CA3AF] shrink-0" />
            )}
        </div>
    );
};

export const DocumentTrace: React.FC<DocumentTraceProps> = ({ documents, className }) => {
    return (
        <Card className={cn("p-6", className)}>
            <H3 className="mb-4">Document Traceability</H3>
            <Body className="text-[#6B7280] mb-6">
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
