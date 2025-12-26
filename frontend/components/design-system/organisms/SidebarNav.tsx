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
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Purchase Order", href: "/po", icon: ShoppingCart },
  { name: "Delivery Challan", href: "/dc", icon: Truck },
  { name: "Invoice", href: "/invoice", icon: Receipt },
  { name: "SRV Ingestion", href: "/srv", icon: Box },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "PO Notes", href: "/po-notes", icon: FileText },
  { name: "Settings", href: "/settings/my-details", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-gradient-to-b from-[#1E3A5F] to-[#152841] flex flex-col z-50 shadow-2xl shrink-0">
      {/* Brand Header */}
      <div className="p-8 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded-full bg-gradient-to-b from-[#00BFA6] to-[#00A890]" />
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-white tracking-tight leading-none uppercase">
              ERP <span className="text-[#00BFA6]">Management</span>
            </span>
            <span className="text-[10px] font-medium text-white/40 mt-1.5 uppercase tracking-widest">
              Senstographic
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Streams */}
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-white/10 text-white shadow-lg backdrop-blur-sm"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive
                      ? "text-[#00BFA6]"
                      : "text-white/50 group-hover:text-white/80",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.12em]",
                    isActive
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-100",
                  )}
                >
                  {item.name}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#00BFA6] to-[#00A890] mr-[-8px] shadow-lg shadow-teal-500/50"
                />
              )}
              {!isActive && (
                <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Status Footer */}
      <div className="p-6 shrink-0 bg-black/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00BFA6] animate-pulse shadow-lg shadow-teal-500/50" />
          <span className="text-[9px] font-semibold text-[#00BFA6] uppercase tracking-widest">
            System Operational
          </span>
        </div>
        <div className="text-[9px] font-semibold text-white/20 uppercase tracking-widest">
          CORE OS V3.1.1
        </div>
      </div>
    </div>
  );
}
