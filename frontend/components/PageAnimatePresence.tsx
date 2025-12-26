"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageAnimatePresence({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className="h-full w-full">
        {children}
      </div>
    </AnimatePresence>
  );
}
