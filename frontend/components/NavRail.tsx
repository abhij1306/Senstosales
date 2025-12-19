"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Truck,
    Receipt,
    BarChart3,
    StickyNote,
    Package,
    Layers,
    Archive
} from "lucide-react";

export default function NavRail() {
    const pathname = usePathname();

    const sections = [
        {
            title: "",
            items: [
                { href: "/", icon: LayoutDashboard, label: "Dashboard" } // Changed icon to match "Internal ERP" style
            ]
        },
        {
            title: "MANAGEMENT PORTAL",
            items: [
                { href: "/po", icon: FileText, label: "Purchase Orders" },
                { href: "/dc", icon: Truck, label: "Delivery Challans" },
                { href: "/invoice", icon: Receipt, label: "Sales & Invoices" },
            ]
        },
        {
            title: "INVENTORY",
            items: [
                // { href: "/stock", icon: Archive, label: "Stock Levels" },
                { href: "/reports", icon: BarChart3, label: "Reports" },
                { href: "/po-notes", icon: StickyNote, label: "PO Notes Templates" },
            ]
        }
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full font-sans">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Internal ERP</h1>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Management Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        {section.title && (
                            <h3 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                {section.title}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Profile Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                        JD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                        <p className="text-xs text-gray-500 truncate">Admin User</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
