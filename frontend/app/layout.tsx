'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/design-system/organisms/SidebarNav";
import GlobalSearch from "@/components/GlobalSearch";
import { CommandBar } from "@/components/CommandBar";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ToastProvider>
            <div className="flex h-screen bg-background overflow-hidden">
              {/* Standardized Non-collapsible Sidebar */}
              <SidebarNav />

              <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/30">
                {/* Floating Glass Header */}
                <header className="px-8 py-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md bg-background/5">
                  <div className="flex items-center gap-4">
                    {/* Removed Operational View indicator */}
                  </div>

                  <div className="flex items-center gap-6">
                    <GlobalSearch />
                    {/* User Context */}
                    <div className="flex items-center gap-3 pl-6">
                      <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black uppercase tracking-widest leading-none">Abhineet</div>
                        <div className="text-[8px] font-bold text-muted-foreground/60 uppercase mt-1">Administrator</div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center neo-convex group hover:scale-105 transition-transform duration-500">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">A</div>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 px-10 pb-32 pt-10">
                  <div className="mx-auto max-w-[1400px] w-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>

            <CommandBar />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
