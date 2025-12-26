"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  BarChart3,
  StickyNote,
  Package,
  FileCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavRailComponent() {
  const pathname = usePathname();

  const sections = [
    {
      title: "",
      items: [{ href: "/", icon: LayoutDashboard, label: "Dashboard" }],
    },
    {
      title: "Operations",
      items: [
        { href: "/po", icon: FileText, label: "Purchase Orders" },
        { href: "/dc", icon: Truck, label: "Delivery Challans" },
        { href: "/invoice", icon: Receipt, label: "Sales Invoices" },
        { href: "/srv", icon: FileCheck, label: "SRV Receipts" },
      ],
    },
    {
      title: "Analysis",
      items: [
        {
          href: "/reports",
          icon: BarChart3,
          label: "Reports",
        },
        { href: "/po-notes", icon: StickyNote, label: "Templates" },
        { href: "/settings/my-details", icon: UserCircle, label: "My Details" },
      ],
    },
  ];

  return (
    <div className="nav-rail">
      {/* Logo Section */}
      <div className="nav-header">
        <div className="flex items-center gap-3">
          <div className="nav-logo">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight tracking-tight">
              SenstoSales
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
              Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-scrollable py-6 px-3 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <h3 className="nav-section-title">{section.title}</h3>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item: any) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn("nav-link", isActive && "nav-link-active")}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isActive ? "text-blue-600" : "text-slate-400",
                        )}
                      />
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
      <div className="nav-footer">
        <div className="flex items-center gap-3">
          <div className="nav-avatar">JD</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">
              John Doe
            </p>
            <p className="text-[10px] text-slate-500 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent re-renders on route changes
const NavRail = memo(NavRailComponent);
NavRail.displayName = "NavRail";

export default NavRail;
