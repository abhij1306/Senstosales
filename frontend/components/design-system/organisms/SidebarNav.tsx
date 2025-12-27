"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Receipt,
  FileText,
  Settings,
  ChevronRight,
  Package,
  Activity,
  Box,
  Users,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    label: "Intelligence",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ]
  },
  {
    label: "Operations",
    items: [
      { name: "Purchase Order", href: "/po", icon: ShoppingCart },
      { name: "Delivery Challan", href: "/dc", icon: Truck },
      { name: "Invoice", href: "/invoice", icon: Receipt },
      { name: "SRV Ingestion", href: "/srv", icon: Box },
    ]
  },
  {
    label: "Configuration",
    items: [
      { name: "PO Notes", href: "/po-notes", icon: FileText },
      { name: "Settings", href: "/settings/my-details", icon: Settings },
    ]
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 relative overflow-hidden border-r border-slate-200 font-heading">

      {/* Brand Header - Compacted */}
      <div className="p-6 pb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Package className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-black text-slate-900 tracking-tight leading-none uppercase">
              SENSTO<span className="text-blue-600">SALES</span>
            </span>
            <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em]">
              PRO ENTERPRISE
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups - Densified */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar relative z-10">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <h3 className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 opacity-70">
              {group.label}
            </h3>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
                    />
                  )}

                  <div className="flex items-center gap-3 relative z-10 pl-2">
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-bold tracking-wider uppercase",
                        isActive ? "text-blue-700" : "text-slate-600 group-hover:text-slate-900"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-3 h-3 text-blue-600 opacity-100" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Premium Profile Footer */}
      <div className="p-4 shrink-0 mt-auto relative z-10 border-t border-slate-100">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-black text-[11px]">
              AS
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-900 truncate">Abhijit S.</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate">Administrator</span>
              </div>
            </div>
            <div className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
              <Settings size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
