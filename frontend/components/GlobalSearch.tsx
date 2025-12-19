"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Truck, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, SearchResult } from "@/lib/api";

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Keyboard shortcut: Ctrl+K and Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search on query change
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
                console.error('Search failed:', error);
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

        if (result.type === "PO") {
            router.push(`/po/${result.number}`);
        } else if (result.type === "DC") {
            router.push(`/dc/${result.number}`);
        } else if (result.type === "Invoice") {
            router.push(`/invoice/${result.number}`);
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "PO": return "bg-blue-100 text-blue-700";
            case "DC": return "bg-green-100 text-green-700";
            case "INVOICE": return "bg-purple-100 text-purple-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded">Ctrl+K</kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsOpen(false)}
            />

            {/* Search Modal */}
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search PO, DC, Invoice by number, party name..."
                        className="flex-1 outline-none text-gray-900"
                    />
                    <button onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="p-8 text-center text-gray-500">Searching...</div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No results found</div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="py-2">
                            {results.map((result, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`px - 2 py - 1 text - xs font - medium rounded ${getTypeBadgeColor(result.type)} `}>
                                            {result.type}
                                        </span>
                                        <div>
                                            <div className="font-medium text-gray-900">{result.number}</div>
                                            <div className="text-sm text-gray-500">{result.party || "-"}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {result.amount && (
                                            <div className="font-medium text-gray-900">₹{result.amount.toLocaleString()}</div>
                                        )}
                                        <div className="text-sm text-gray-500">{result.date}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">ESC</kbd> to close</span>
                    <span>{results.length} results</span>
                </div>
            </div>
        </>
    );
}
