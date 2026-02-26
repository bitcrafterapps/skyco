"use client";

import Link from "next/link";

interface StationFooterProps {
  isConnected: boolean;
  lastRefresh: string;
}

export default function StationFooter({
  isConnected,
  lastRefresh,
}: StationFooterProps) {
  return (
    <footer className="station-footer-surface bg-white/80 backdrop-blur-sm border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
      {/* Connection indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`
            w-1.5 h-1.5 rounded-full
            ${isConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse"}
          `}
        />
        <span>{isConnected ? "Live" : "Reconnecting..."}</span>
      </div>

      {/* Last updated */}
      <span className="font-mono tabular-nums">Updated {lastRefresh}</span>

      {/* Back to dashboard */}
      <Link
        href="/"
        className="text-slate-400 active:text-[#005B97] underline underline-offset-2 min-h-[44px] flex items-center transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] rounded"
      >
        Dashboard
      </Link>
    </footer>
  );
}
