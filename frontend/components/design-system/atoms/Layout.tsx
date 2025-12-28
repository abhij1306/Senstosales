"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

interface FlexProps extends LayoutProps {
    direction?: "row" | "col";
    align?: "start" | "center" | "end" | "baseline" | "stretch";
    justify?: "start" | "center" | "end" | "between" | "around";
    gap?: number | string;
    wrap?: boolean;
    inline?: boolean;
}

const FlexInternal = React.forwardRef<HTMLDivElement, FlexProps>(
    ({ direction = "row", align = "start", justify = "start", gap, wrap, inline, className, children, ...props }, ref) => {
        const directionClass = direction === "col" ? "flex-col" : "flex-row";
        const alignClass = {
            start: "items-start",
            center: "items-center",
            end: "items-end",
            baseline: "items-baseline",
            stretch: "items-stretch",
        }[align];
        const justifyClass = {
            start: "justify-start",
            center: "justify-center",
            end: "justify-end",
            between: "justify-between",
            around: "justify-around",
        }[justify];

        // Simple gap mapping for common values, or use arbitrary if numeric
        const gapClass = typeof gap === "number" ? `gap-${gap}` : gap;

        return (
            <div
                ref={ref}
                className={cn(
                    inline ? "inline-flex" : "flex",
                    directionClass,
                    alignClass,
                    justifyClass,
                    gapClass,
                    wrap && "flex-wrap",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
FlexInternal.displayName = "Flex";
export const Flex = React.memo(FlexInternal);

// Stack is a specialized Flex with direction="col"
export const Stack = React.memo(React.forwardRef<HTMLDivElement, Omit<FlexProps, "direction">>((props, ref) => (
    <Flex ref={ref} direction="col" {...props} />
)));

interface GridProps extends LayoutProps {
    cols?: number | string;
    gap?: number | string;
    align?: "start" | "center" | "end" | "stretch";
}

const GridInternal = React.forwardRef<HTMLDivElement, GridProps>(
    ({ cols = 1, gap = 4, align = "stretch", className, children, ...props }, ref) => {
        const colsClass = typeof cols === "number" ? `grid-cols-${cols}` : cols;
        const gapClass = typeof gap === "number" ? `gap-${gap}` : gap;
        const alignClass = {
            start: "items-start",
            center: "items-center",
            end: "items-end",
            stretch: "items-stretch",
        }[align];

        return (
            <div
                ref={ref}
                className={cn("grid", colsClass, gapClass, alignClass, className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
GridInternal.displayName = "Grid";
export const Grid = React.memo(GridInternal);

// Box is a generic container atom
const BoxInternal = React.forwardRef<HTMLDivElement, LayoutProps>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("will-change-[transform,opacity,filter]", className)} {...props}>
            {children}
        </div>
    )
);
BoxInternal.displayName = "Box";
export const Box = React.memo(BoxInternal);
