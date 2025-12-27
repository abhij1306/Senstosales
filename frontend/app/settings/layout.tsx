"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { H1 } from "@/components/design-system/atoms/Typography";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/molecules/Tabs";

const TABS = [
  { name: "My Details", href: "/settings/my-details", value: "my-details" },
  { name: "Buyer Management", href: "/settings/buyers", value: "buyers" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current tab value based on pathname
  const currentTab =
    TABS.find((tab) => pathname.startsWith(tab.href))?.value || "my-details";

  return (
    <div className="space-y-8">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/20 pb-8">
        <div className="space-y-2">
          <H1 className="uppercase tracking-tight">Settings</H1>
          <p className="text-[14px] text-[#6B7280]">
            Configure your business profile and buyer entities
          </p>
        </div>

        <Tabs
          value={currentTab}
          onValueChange={(val) => {
            const tab = TABS.find((t) => t.value === val);
            if (tab) router.push(tab.href);
          }}
        >
          <TabsList className="bg-white/40 border border-white/40 shadow-sm backdrop-blur-sm p-1 rounded-xl">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-[11px] uppercase tracking-wider"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      <div className="pb-20">
        {children}
      </div>
    </div>
  );
}
