import React from 'react';
import { cn } from '@/lib/utils'; // Assuming generic utility exists, else will inline

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'interact';
}

const GlassCard = ({ children, className, variant = 'default', ...props }: GlassCardProps) => {
    return (
        <div
            className={cn(
                "glass rounded-xl p-5 transition-all duration-300",
                variant === 'interact' && "hover:translate-y-[-2px] hover:shadow-lg cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default GlassCard;
