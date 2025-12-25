import React from 'react';
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TableHeaderCell = ({ children, className, numeric, ...props }: { children?: React.ReactNode; className?: string; numeric?: boolean } & React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={cn(
        "h-8 px-3 text-left align-middle font-semibold text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 bg-background/40 neo-flat backdrop-blur-sm sticky top-0 z-10 border-b border-border/10",
        numeric && "text-right",
        className
    )} {...props}>
        {children}
    </th>
);

export const TableRowCell = ({ children, className, numeric, ...props }: { children?: React.ReactNode; className?: string; numeric?: boolean } & React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={cn(
        "py-1.5 px-3 align-middle border-b border-border/5 transition-colors group-hover:bg-primary/5 text-[10px] font-extrabold tracking-tight",
        numeric && "font-mono tabular-nums text-right text-primary/80",
        className
    )} {...props}>
        {children}
    </td>
);
