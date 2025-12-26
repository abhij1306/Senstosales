import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/design-system/organisms/SidebarNav";
import GlobalSearch from "@/components/GlobalSearch";
import { Providers } from "./providers";
import { Suspense } from "react";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-background overflow-hidden">
            {/* Standardized Non-collapsible Sidebar */}
            <SidebarNav />

            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
              {/* Optimized Master Header */}
              <header className="px-8 py-3.5 flex items-center gap-8 shrink-0 z-50 backdrop-blur-xl bg-white/60 border-b border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                {/* Master Search Bar (Flush Left/Center) */}
                <div className="flex-1">
                  <Suspense
                    fallback={
                      <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
                    }
                  >
                    <GlobalSearch />
                  </Suspense>
                </div>

                {/* Right Header: Contextual Actions & User */}
                <div className="flex items-center gap-6">
                  {/* Portal for page-specific header actions (like Date Range) */}
                  <div id="header-action-portal" />

                  <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-900">
                        Abhineet
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                        Administrator
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-[10px]">
                        A
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content Area - Shifted Up */}
              <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 px-8 pb-32 pt-6">
                <div className="mx-auto max-w-[1400px] w-full">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
