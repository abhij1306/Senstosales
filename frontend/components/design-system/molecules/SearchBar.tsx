"use client";

import React, { useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Search, X } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * SearchBar Molecule - Atomic Design System v1.0
 * Composition: Input + Search Icon + Clear Button + Keyboard Shortcut
 */

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    shortcut?: string;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    shortcut,
    className
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={cn("relative", className)}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                icon={<Search size={16} />}
                className="pr-20"
            />

            {/* Clear button */}
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors p-1"
                    aria-label="Clear search"
                >
                    <X size={16} />
                </button>
            )}

            {/* Keyboard shortcut hint */}
            {shortcut && !value && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-medium text-[#6B7280] bg-[#F6F8FB] border border-[#D1D5DB] rounded pointer-events-none">
                    {shortcut}
                </kbd>
            )}
        </div>
    );
};
