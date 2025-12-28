"use client";

import React, { useState, useEffect } from "react";
import { Input } from "../atoms/Input";
import { Button } from "../atoms/Button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * SearchBar Molecule - Atomic Design System v1.0
 * Composition: Input + Search Icon + Clear Button + Keyboard Shortcut
 * Performance: 300ms debounce to prevent excessive re-renders
 */

export interface SearchBarProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
}

const SearchBarInternal = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({
    id,
    name,
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    shortcut,
    className,
  }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, 300);

    // Sync debounced value to parent
    useEffect(() => {
      if (debouncedValue !== value) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange, value]);

    // Sync external value changes back to local state
    // Important: Only sync if it's different to avoid loops
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch();
      }
    };

    const handleClear = () => {
      setLocalValue("");
      onChange(""); // Immediate clear
    };

    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          id={id}
          name={name}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          icon={<Search size={16} />}
          className="pr-20"
        />

        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors p-1"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {shortcut && !localValue && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 rounded pointer-events-none tracking-widest uppercase">
            {shortcut}
          </kbd>
        )}
      </div>
    );
  },
);
SearchBarInternal.displayName = "SearchBar";

export const SearchBar = React.memo(SearchBarInternal);
