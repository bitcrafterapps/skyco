"use client";

import { Flame } from "lucide-react";

export default function RushBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-[0.12em] rounded-full px-2 py-0.5 shrink-0">
      <Flame className="h-3 w-3 text-red-500" aria-hidden="true" />
      RUSH
    </span>
  );
}
