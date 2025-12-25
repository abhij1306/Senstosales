"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Circle } from 'lucide-react';

export type DocumentStage = 'PO' | 'DC' | 'Invoice' | 'SRV';

interface DocumentJourneyProps {
    currentStage: DocumentStage;
    stages?: DocumentStage[];
    className?: string;
}

const STAGE_LABELS: Record<DocumentStage, string> = {
    'PO': 'Purchase Order',
    'DC': 'Delivery Challan',
    'Invoice': 'Tax Invoice',
    'SRV': 'Service Receipt'
};

export const DocumentJourney = ({
    currentStage,
    stages = ['PO', 'DC', 'Invoice'],
    className
}: DocumentJourneyProps) => {
    const currentIndex = stages.indexOf(currentStage);

    return (
        <div className={cn("flex items-center gap-1 px-1", className)}>
            {stages.map((stage, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                const isPending = index > currentIndex;

                return (
                    <React.Fragment key={stage}>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
                            isActive
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200/50"
                                : isCompleted
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-50 text-slate-400"
                        )}>
                            {isCompleted ? (
                                <Check size={12} className="text-emerald-500" />
                            ) : isActive ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            ) : (
                                <Circle size={10} className="text-slate-300" />
                            )}
                            <span className={cn(
                                "text-[10px] font-medium uppercase tracking-[0.1em]",
                                isActive ? "text-white" : isCompleted ? "text-emerald-700" : "text-slate-400"
                            )}>
                                {stage}
                            </span>
                        </div>
                        {index < stages.length - 1 && (
                            <ChevronRight size={12} className="text-slate-300 mx-0.5" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
