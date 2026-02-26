"use client";

import React from "react";
import Link from "next/link";
import { Check, Pause, AlertTriangle, Flame } from "lucide-react";
import type { StationSummary } from "@/lib/types";

interface StationCardProps {
  station: StationSummary;
  /** 1-based display number (visual position in the grid) */
  displayNumber?: number;
  className?: string;
}

const StationCard = React.forwardRef<HTMLDivElement, StationCardProps>(
  function StationCard(
    {
      station,
      displayNumber,
      className,
    },
    ref
  ) {
    const hasIssues = station.holdCount > 0 || station.missingCount > 0;
    const allClear =
      station.totalOrders > 0 &&
      station.holdCount === 0 &&
      station.missingCount === 0;
    const badgeNumber = displayNumber ?? station.sortOrder + 1;

    return (
      <div ref={ref} className={`h-full ${className ?? ""}`}>
        <Link
          href={`/station/${station.stationId}`}
          className={`
            group
            station-card-link
            rounded-2xl p-5 md:p-6 lg:p-7
            bg-white
            relative
            h-full flex flex-col
            ${hasIssues ? "ring-1 ring-amber-200" : allClear ? "ring-1 ring-emerald-200" : ""}
            active:scale-[0.98]
            transition-all duration-150 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]
          `}
          style={{
            border: "1px solid rgba(0,91,151,0.08)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,91,151,0.05)",
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4 md:mb-5 shrink-0">
            <div className="flex items-center gap-3">
              {/* Station number badge */}
              <div
                className="w-9 h-9 rounded-lg text-white flex items-center justify-center text-sm font-bold font-mono tabular-nums shrink-0"
                style={{
                  background:
                    "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 3px rgba(0,91,151,0.2)",
                }}
              >
                {badgeNumber}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {station.label}
              </h2>
            </div>
            {/* Health dot */}
            <div
              className={`
                w-2.5 h-2.5 rounded-full shrink-0
                ${hasIssues ? "bg-amber-500 animate-pulse" : allClear ? "bg-emerald-500" : "bg-slate-300"}
              `}
            />
          </div>

          {/* Description - Grows to fill space */}
          <div className="flex-1 min-h-0 overflow-hidden mb-4 md:mb-6">
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 md:line-clamp-4">
              {station.description}
            </p>
          </div>

          {/* Stats Row - Pinned to bottom */}
          <div className="shrink-0 mt-auto">
            <div className="flex items-end justify-between">
              {/* Total orders -- the hero number */}
              <div>
                <div className="font-mono text-4xl md:text-5xl font-bold tabular-nums text-slate-900 leading-none tracking-tighter">
                  {station.totalOrders}
                </div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-semibold">
                  Orders
                </div>
              </div>

              {/* Mini status indicators */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
                {station.rushCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-50 rounded-full px-2 py-0.5">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-sm font-semibold text-red-600 tabular-nums">
                      {station.rushCount}
                    </span>
                  </div>
                )}
                {station.doneCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2 py-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">
                      {station.doneCount}
                    </span>
                  </div>
                )}
                {station.holdCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-rose-50 rounded-full px-2 py-0.5">
                    <Pause className="w-4 h-4 text-rose-600" />
                    <span className="font-mono text-sm font-semibold text-rose-600 tabular-nums">
                      {station.holdCount}
                    </span>
                  </div>
                )}
                {station.missingCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-2 py-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-mono text-sm font-semibold text-amber-600 tabular-nums">
                      {station.missingCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar: done / total */}
            {station.totalOrders > 0 && (
              <div className="mt-4 md:mt-6">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(station.doneCount / station.totalOrders) * 100}%`,
                      background:
                        "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                      boxShadow: "0 0 6px rgba(5,150,105,0.3)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }
);

export default StationCard;
