"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Truck, Receipt, BarChart3, StickyNote } from "lucide-react";

export default function NavRail() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "Dashboard" },
        { href: "/po", icon: FileText, label: "Purchase Orders" },
        { href: "/dc", icon: Truck, label: "Delivery Challans" },
        { href: "/invoice", icon: Receipt, label: "Invoices" },
        { href: "/reports", icon: BarChart3, label: "Reports" },
        { href: "/po-notes", icon: StickyNote, label: "PO Notes" },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900">Sales Manager</h1>
                <p className="text-sm text-gray-500 mt-1">v2.5</p>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
