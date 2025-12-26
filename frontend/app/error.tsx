"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("System Runtime Fault:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6">
      <GlassCard className="max-w-md w-full p-10 text-center space-y-8 border-rose-100 shadow-2xl shadow-rose-100/20">
        <div className="flex justify-center">
          <div className="p-6 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100/50 text-rose-600 animate-bounce duration-1000">
            <AlertCircle className="w-12 h-12" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="heading-xl text-rose-700 uppercase tracking-tighter">
            Runtime Exception
          </h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {error.digest || "PROCESS TERMINATED"}
          </p>
        </div>

        <div className="p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-[11px] font-bold leading-relaxed text-slate-600 italic">
          {error.message ||
            "The system encountered an unhandled exception during state reconciliation."}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button
            onClick={() => router.push("/")}
            className="btn-premium btn-ghost border-slate-200"
          >
            <Home className="w-4 h-4" /> REBOOT HUB
          </button>
          <button
            onClick={reset}
            className="btn-premium btn-primary bg-rose-600 shadow-rose-200"
          >
            <RefreshCcw className="w-4 h-4" /> RETRY SYNC
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
