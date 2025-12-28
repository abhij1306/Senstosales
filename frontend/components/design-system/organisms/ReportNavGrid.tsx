"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { NavigationCard, NavigationCardProps } from "../molecules/NavigationCard";
import { motion } from "framer-motion";

export interface ReportNavGridProps {
    items: (Omit<NavigationCardProps, "onClick"> & { id: string })[];
    activeId: string;
    onSelect: (id: string) => void;
    className?: string;
}

export const ReportNavGrid = ({
    items,
    activeId,
    onSelect,
    className,
}: ReportNavGridProps) => {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4", className)}>
            {items.map((item) => (
                <NavigationCard
                    key={item.id}
                    {...item}
                    active={item.id === activeId}
                    onClick={() => onSelect(item.id)}
                />
            ))}
        </div>
    );
};
