"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Truck, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Removed Ctrl+K - CommandBar handles it
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await api.searchGlobal(query);
                setResults(data);
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
        else if (result.type === "Invoice") router.push(`/invoice/view?id=${encodeURIComponent(result.number)}`);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-white/40 hover:shadow-lg hover:bg-white/80 transition-all duration-300 min-w-[300px]"
            >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 font-medium flex-1 text-left">Search for anything...</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-2 font-mono text-[10px] font-bold text-slate-400 shadow-sm">
                    ⌘K
                </kbd>
            </button>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-all" onClick={() => setIsOpen(false)} />

            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-xl z-50">
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-200/50">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to search POs, DCs, Invoices..."
                            className="flex-1 bg-transparent outline-none text-slate-900 text-lg placeholder:text-slate-400"
                        />
                        <button onClick={() => setIsOpen(false)}>
                            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading && <div className="p-8 text-center text-slate-400 text-sm">Searching...</div>}

                        {!loading && query.length >= 2 && results.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">No results found.</div>
                        )}

                        {!loading && results.length > 0 && (
                            <div className="py-1">
                                {results.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full px-4 py-3 hover:bg-slate-100/50 flex items-center justify-between text-left transition-colors border-b border-transparent hover:border-slate-100 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg flex items-center justify-center",
                                                result.type === 'PO' ? "bg-blue-50 text-blue-600" :
                                                    result.type === 'DC' ? "bg-purple-50 text-purple-600" :
                                                        "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {result.type === 'PO' ? <FileText className="w-4 h-4" /> :
                                                    result.type === 'DC' ? <Truck className="w-4 h-4" /> :
                                                        <Receipt className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 text-sm">{result.number}</div>
                                                <div className="text-xs text-slate-500">{result.party || "Unknown Party"}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-sm font-medium text-slate-700">
                                                {result.amount ? `₹${result.amount.toLocaleString()}` : ''}
                                            </div>
                                            <StatusBadge status={result.status || 'Active'} variant="neutral" className="scale-75 origin-right" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-200/50 bg-slate-50/50 text-[10px] text-slate-400 flex justify-between uppercase tracking-wider font-medium">
                        <span>SenstoSales Search</span>
                        <span>{results.length} Matches</span>
                    </div>
                </div>
            </div>
        </>
    );
}
