"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Command,
    Search,
    FileText,
    Truck,
    ShoppingCart,
    LayoutDashboard,
    Plus,
    Box,
    BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./ui/Card";

// Note: In a real implementation, we would use a library like `cmdk` 
// but for now we'll build a custom accessible modal for speed and control.

export function CommandBar() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const router = useRouter();

    // Toggle on Cmd+K and handle global shortcuts
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // 1. Cmd+K / Ctrl+K: Toggle Command Bar
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }

            // 2. Escape: Close Command Bar
            if (e.key === "Escape") {
                setOpen(false);
            }

            // If modal is open, don't trigger other page-level shortcuts
            if (open) return;

            // 3. / : Search (Focus Global Search or Open Command Bar)
            if (
                e.key === "/" &&
                !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
            ) {
                e.preventDefault();
                setOpen(true);
            }

            // 4. Shift+N: Create New (Context aware)
            if (
                e.key === "N" &&
                e.shiftKey &&
                !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
            ) {
                e.preventDefault();
                setSearch("New ");
                setOpen(true);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open]);

    const handleNavigate = (path: string) => {
        setOpen(false);
        router.push(path);
    };

    const sections = [
        {
            title: "Navigation",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", path: "/" },
                { icon: ShoppingCart, label: "Purchase Orders", path: "/po" },
                { icon: Truck, label: "Delivery Challans", path: "/dc" },
                { icon: FileText, label: "Invoices", path: "/invoice" },
                { icon: BarChart2, label: "Reports", path: "/reports" },
            ]
        },
        {
            title: "Quick Actions",
            items: [
                { icon: Plus, label: "Create Delivery Challan", path: "/dc/create" },
                { icon: Plus, label: "Create Invoice", path: "/invoice/create" },
                { icon: Box, label: "Check Stock Status", path: "/reports" }, // Placeholder
            ]
        }
    ];

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-gradient-to-br from-white/35 via-white/30 to-slate-100/40 backdrop-blur-3xl rounded-2xl overflow-hidden shadow-2xl border border-white/70 animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Search Input */}
                <div className="flex items-center px-4 py-3 bg-gradient-to-r from-white/25 to-slate-50/30 backdrop-blur-xl">
                    <Search className="mr-2 h-5 w-5 text-slate-400" />
                    <input
                        autoFocus
                        className="flex h-6 w-full rounded-md bg-transparent py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-2 font-mono text-[10px] font-bold text-slate-500 shadow-sm">
                        <span className="text-xs">ESC</span>
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {sections.map((section, idx) => (
                        <div key={idx} className="mb-2">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {section.title}
                            </div>
                            {section.items.map((item, itemIdx) => (
                                <button
                                    key={itemIdx}
                                    onClick={() => handleNavigate(item.path)}
                                    className={cn(
                                        "flex w-full select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700",
                                        "hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer",
                                        "focus:bg-blue-50 focus:text-blue-600"
                                    )}
                                >
                                    <item.icon className="mr-3 h-4 w-4" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    ))}


                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-white/25 to-slate-50/30 backdrop-blur-xl px-4 py-2.5 text-[10px] text-slate-700 font-semibold flex justify-between">
                    <span>SenstoSales OS v2.1</span>
                    <div className="flex gap-3">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
