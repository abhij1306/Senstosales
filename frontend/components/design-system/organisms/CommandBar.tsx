"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Truck,
  ShoppingCart,
  LayoutDashboard,
  Plus,
  Box,
  BarChart2,
  Receipt,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, SearchResult } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on Cmd+K and handle global shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Database Search
  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      return;
    }

    const performSearch = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await api.searchGlobal(search);
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [search, open]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + navigationItems.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      if (search.length >= 2) {
        if (selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        } else {
          handleNavigate(navigationItems[selectedIndex - results.length].path);
        }
      } else {
        handleNavigate(navigationItems[selectedIndex].path);
      }
    }
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    if (result.type === "PO") router.push(`/po/view?id=${result.number}`);
    else if (result.type === "DC") router.push(`/dc/view?id=${result.number}`);
    else if (result.type === "Invoice")
      router.push(`/invoice/view?id=${encodeURIComponent(result.number)}`);
    else if (result.type === "SRV")
      router.push(`/reports?tab=reconciliation&search=${result.number}`);
  };

  const navigationItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Purchase Orders", path: "/po", icon: ShoppingCart },
    { label: "Delivery Challans", path: "/dc", icon: Truck },
    { label: "Invoices", path: "/invoice", icon: Receipt },
    { label: "Reports", path: "/reports", icon: BarChart2 },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/60 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
        {/* Header / Search Area */}
        <div className="flex items-center px-6 py-5 border-b border-slate-100">
          <Search
            className={cn(
              "mr-4 h-6 w-6 transition-colors",
              loading ? "text-blue-500 animate-pulse" : "text-slate-400",
            )}
          />
          <input
            ref={inputRef}
            autoFocus
            className="flex-1 bg-transparent text-xl font-medium text-slate-900 outline-none placeholder:text-slate-300"
            placeholder="Search POs, DCs, Invoices, Actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:flex h-6 select-none items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 font-mono text-[10px] font-bold text-slate-400 shadow-sm">
                ESC
              </kbd>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {search.length >= 2 ? (
            <div className="p-3">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                Database Matches
              </div>
              {results.length > 0
                ? results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 text-left mb-1 group",
                      selectedIndex === idx
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "hover:bg-slate-50 text-slate-700",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl flex items-center justify-center transition-colors",
                          selectedIndex === idx
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-white",
                        )}
                      >
                        {result.type === "PO" ? (
                          <ShoppingCart size={18} />
                        ) : result.type === "DC" ? (
                          <Truck size={18} />
                        ) : result.type === "Invoice" ? (
                          <Receipt size={18} />
                        ) : result.type === "SRV" ? (
                          <FileText size={18} />
                        ) : (
                          <Box size={18} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold tracking-tight">
                          {result.number}
                        </div>
                        <div
                          className={cn(
                            "text-[11px] font-medium opacity-70",
                            selectedIndex === idx
                              ? "text-blue-50"
                              : "text-slate-500",
                          )}
                        >
                          {result.type_label} •{" "}
                          {result.party || "No Reference Data"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                      {result.amount && (
                        <div className="font-mono text-sm font-bold tracking-tighter">
                          ₹{result.amount.toLocaleString("en-IN")}
                        </div>
                      )}
                      <StatusBadge
                        status={result.status || "Active"}
                        variant={
                          selectedIndex === idx ? "neutral" : "success"
                        }
                        className={cn(
                          "px-2 py-0.5 text-[9px]",
                          selectedIndex === idx &&
                          "bg-white/20 text-white border-transparent",
                        )}
                      />
                    </div>
                  </button>
                ))
                : !loading && (
                  <div className="py-12 text-center text-slate-400">
                    No results for "{search}"
                  </div>
                )}
            </div>
          ) : (
            <div className="p-3">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNavigate(item.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left",
                      selectedIndex === idx
                        ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                        : "bg-white border-slate-100 hover:border-slate-300 text-slate-600",
                    )}
                  >
                    <item.icon
                      size={20}
                      className={
                        selectedIndex === idx
                          ? "text-blue-400"
                          : "text-slate-400"
                      }
                    />
                    <span className="font-bold tracking-tight">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-bold text-[9px] text-slate-400 uppercase tracking-widest">
              <span className="p-1 px-1.5 bg-white border border-slate-200 rounded text-slate-600">
                Enter
              </span>
              <span>to Select</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[9px] text-slate-400 uppercase tracking-widest">
              <span className="p-1 px-1.5 bg-white border border-slate-200 rounded text-slate-600">
                Esc
              </span>
              <span>to Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
