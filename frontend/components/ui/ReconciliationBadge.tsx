"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Truck, Package, AlertCircle } from 'lucide-react';

interface ReconciliationBadgeProps {
    ordered: number;
    delivered: number;
    received: number;
    size?: 'sm' | 'md';
    className?: string;
}

const ReconciliationBadge = ({ ordered, delivered, received, size = 'md', className }: ReconciliationBadgeProps) => {
    // Invariants Check
    const isDeliverPending = delivered < ordered;
    const isReceivePending = received < delivered;
    const isOverDelivered = delivered > ordered;

    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-center gap-3">
                {/* Ordered */}
                <div className="flex items-center gap-1 text-slate-400">
                    <Package size={iconSize} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{ordered}</span>
                </div>

                <div className="h-px w-4 bg-slate-200" />

                {/* Delivered */}
                <div className={cn(
                    "flex items-center gap-1",
                    isOverDelivered ? "text-red-500" : isDeliverPending ? "text-blue-500" : "text-emerald-500"
                )}>
                    <Truck size={iconSize} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{delivered}</span>
                </div>

                <div className="h-px w-4 bg-slate-200" />

                {/* Received */}
                <div className={cn(
                    "flex items-center gap-1",
                    isReceivePending ? "text-amber-500" : "text-emerald-500"
                )}>
                    <CheckCircle2 size={iconSize} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{received}</span>
                </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(received / Math.max(ordered, delivered, 1)) * 100}%` }}
                />
                <div
                    className="h-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${((delivered - received) / Math.max(ordered, delivered, 1)) * 100}%` }}
                />
                {isDeliverPending && (
                    <div
                        className="h-full bg-slate-200 transition-all duration-500"
                        style={{ width: `${((ordered - delivered) / Math.max(ordered, delivered, 1)) * 100}%` }}
                    />
                )}
            </div>

            {(isOverDelivered || isReceivePending) && (
                <div className="flex items-center gap-1 text-[9px] font-medium animate-pulse">
                    <AlertCircle size={10} className={isOverDelivered ? "text-red-500" : "text-amber-500"} />
                    <span className={isOverDelivered ? "text-red-600" : "text-amber-600"}>
                        {isOverDelivered ? "Over-delivering" : "Receipt Pending"}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ReconciliationBadge;
