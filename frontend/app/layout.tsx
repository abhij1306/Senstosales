'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import NavRail from "@/components/NavRail";
import GlobalSearch from "@/components/GlobalSearch";
import { CommandBar } from "@/components/CommandBar";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Transparent NavRail Container */}
            <NavRail />

            <div className="flex-1 flex flex-col relative">
              {/* Floating Glass Header */}
              <header className="px-6 py-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-2">
                  {/* Breadcrumbs or Page Title could go here dynamically, 
                        but for now we keep it clean or rely on page-level headers */}
                </div>

                <div className="flex items-center gap-4">
                  <div className="glass-search rounded-full px-2 py-1 shadow-sm">
                    <GlobalSearch />
                  </div>
                  {/* User Profile / Notifications could go here */}
                </div>
              </header>

              {/* Main Content Area - Scrollable */}
              <main className="flex-1 overflow-auto scrollbar-thin px-6 pb-6 pt-0">
                <div className="mx-auto max-w-[1400px] w-full">
                  {children}
                </div>
              </main>
            </div>
          </div>


          <CommandBar />
        </ToastProvider>
      </body>
    </html>
  );
}
