"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { H1, SmallText } from "@/components/design-system/atoms/Typography";
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
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Settings Header - Flush with Master Header */}
      <div className="px-8 pt-2 pb-6 bg-white/40 backdrop-blur-md border-b border-white/20 shrink-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <H1 className="uppercase tracking-tight text-[24px]">Settings</H1>
            <SmallText className="text-slate-500 font-medium">
              Configure your business profile and buyer entities
            </SmallText>
          </div>

          <Tabs
            value={currentTab}
            onValueChange={(val) => {
              const tab = TABS.find((t) => t.value === val);
              if (tab) router.push(tab.href);
            }}
          >
            <TabsList className="bg-slate-200/40 border border-white/40 shadow-sm backdrop-blur-sm">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6 py-2"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area - Gutter aligned with Header */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-transparent to-slate-100/30">
        <div className="max-w-[1400px] mx-auto py-8 mb-20">{children}</div>
      </div>
    </div>
  );
}
