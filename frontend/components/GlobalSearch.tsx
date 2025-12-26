"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  FileText,
  Truck,
  Receipt,
  Package,
  ArrowRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api, SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K shortcut to focus input
  useEffect(() => {
    const handleGlobalK = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalK);
    return () => window.removeEventListener("keydown", handleGlobalK);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const search = async () => {
      setLoading(true);
      try {
        const data = await api.searchGlobal(query);
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    if (result.type === "PO") router.push(`/po/view?id=${result.number}`);
    else if (result.type === "DC") router.push(`/dc/view?id=${result.number}`);
    else if (result.type === "Invoice")
      router.push(`/invoice/view?id=${encodeURIComponent(result.number)}`);
    else if (result.type === "SRV")
      router.push(`/reports?tab=reconciliation&search=${result.number}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleResultClick(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl group">
      <div
        className={cn(
          "flex items-center gap-4 px-6 py-2.5 bg-slate-100/40 hover:bg-slate-100/60 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all duration-300",
          isOpen && "bg-white border-blue-400/50 shadow-xl shadow-blue-500/5",
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <Search
            className={cn(
              "w-5 h-5 transition-colors",
              isOpen ? "text-blue-500" : "text-slate-400",
            )}
          />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search items, vendors, invoices..."
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200 shadow-sm">
          <kbd className="font-mono text-[9px] font-bold text-slate-400">
            CTRL K
          </kbd>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-[100] animate-in slide-in-from-top-1 duration-200">
          <div className="py-2">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
              Live Database Results
            </div>
            {results.map((result, idx) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200",
                  selectedIndex === idx
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-50 text-slate-700",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-xl flex items-center justify-center transition-colors",
                      selectedIndex === idx
                        ? "bg-white/20 text-white"
                        : "bg-white shadow-sm border border-slate-100 text-slate-500",
                    )}
                  >
                    {result.type === "PO" ? (
                      <Package size={18} />
                    ) : result.type === "DC" ? (
                      <Truck size={18} />
                    ) : result.type === "Invoice" ? (
                      <Receipt size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold tracking-tight text-sm">
                      {result.number}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] font-medium opacity-80 line-clamp-1",
                        selectedIndex === idx
                          ? "text-blue-50"
                          : "text-slate-400",
                      )}
                    >
                      {result.type_label} • {result.party || "No Reference"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result.amount && (
                    <div className="font-mono text-[13px] font-black tracking-tighter">
                      ₹{result.amount.toLocaleString("en-IN")}
                    </div>
                  )}
                  <StatusBadge
                    status={result.status || "Active"}
                    variant={selectedIndex === idx ? "neutral" : "success"}
                    className={cn(
                      "px-2 py-0.5 text-[9px]",
                      selectedIndex === idx &&
                        "bg-white/20 text-white border-transparent",
                    )}
                  />
                  <ArrowRight
                    size={14}
                    className={cn(
                      "transition-transform",
                      selectedIndex === idx
                        ? "translate-x-1 opacity-100"
                        : "opacity-0",
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
