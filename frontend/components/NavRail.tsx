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
        <nav className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">S</span>
            </div>

            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                        title={item.label}
                    >
                        <Icon className="w-5 h-5" />
                    </Link>
                );
            })}
        </nav>
    );
}
