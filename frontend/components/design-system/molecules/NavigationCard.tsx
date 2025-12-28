"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Body, SmallText } from "../atoms/Typography";
import { motion } from "framer-motion";

export interface NavigationCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}

export const NavigationCard = ({
    title,
    description,
    icon,
    active,
    onClick,
    className,
}: NavigationCardProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-start p-5 rounded-2xl transition-all duration-300 text-left border overflow-hidden",
                "bg-white/40 backdrop-blur-md border-white/20 shadow-sm hover:shadow-lg",
                active
                    ? "ring-2 ring-blue-500/50 border-blue-500/30 bg-blue-50/30"
                    : "hover:bg-white/60",
                className
            )}
        >
            {/* Decorative accent for active state */}
            {active && (
                <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-blue-500/10 rounded-full blur-2xl" />
            )}

            {icon && (
                <div
                    className={cn(
                        "p-2.5 rounded-xl mb-3 transition-colors",
                        active ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-500"
                    )}
                >
                    {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 20 }) : icon}
                </div>
            )}

            <Body className={cn("font-bold tracking-tight", active ? "text-blue-900" : "text-slate-800")}>
                {title}
            </Body>

            {description && (
                <SmallText className={cn("mt-1.5 line-clamp-2", active ? "text-blue-700/70" : "text-slate-500")}>
                    {description}
                </SmallText>
            )}

            {/* Underline indicator for active state */}
            {active && (
                <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"
                />
            )}
        </motion.button>
    );
};
