import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/design-system/organisms/SidebarNav";
import GlobalSearch from "@/components/GlobalSearch";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, outfit.variable, "font-sans antialiased")}>
        <Providers>
          <div className="flex h-screen bg-background overflow-hidden">
            {/* Standardized Non-collapsible Sidebar */}
            <SidebarNav />

            <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
              {/* Optimized Master Header */}
              <header className="px-8 py-3.5 flex items-center gap-8 shrink-0 z-50 backdrop-blur-xl bg-[#F8FAFC]/90 border-b border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
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

                {/* Right Header: Contextual Actions */}
                <div className="flex items-center gap-6">
                  {/* Portal for page-specific header actions (like Date Range) */}
                  <div id="header-action-portal" />
                </div>
              </header>

              {/* Main Content Area - Shifted Up */}
              <main className="flex-1 overflow-y-scroll overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 px-8 pb-32 pt-6">
                <div className="mx-auto max-w-[1400px] w-full relative min-h-[calc(100vh-140px)]">
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
