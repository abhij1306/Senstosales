"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface DocumentTemplateProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const DocumentTemplate = ({
    title,
    description,
    actions,
    children,
    className
}: DocumentTemplateProps) => {
    return (
        <div className={cn("space-y-4 animate-in fade-in duration-500", className)}>
            {/* Compact Header */}
            <div className="flex items-center justify-between px-1 mb-2">
                <div>
                    <h1 className="text-[18px] font-medium tracking-tight text-slate-950">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-1">
                {children}
            </div>
        </div>
    );
};
