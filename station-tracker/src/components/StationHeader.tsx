"use client";

import { useState, useEffect } from "react";
import { Pause, AlertTriangle } from "lucide-react";
import { STATION_LABELS, STATION_DESCRIPTIONS, STATIONS } from "@/lib/types";
import type { StationId } from "@/lib/types";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

interface StationHeaderProps {
  stationId: string;
  stationLabel?: string;
  stationDescription?: string;
  stationNumber?: number;
  orderCount: number;
  holdCount?: number;
  missingCount?: number;
}

export default function StationHeader({
  stationId,
  stationLabel,
  stationDescription,
  stationNumber,
  orderCount,
  holdCount = 0,
  missingCount = 0,
}: StationHeaderProps) {
  const typedStationId = stationId as StationId;
  const label = stationLabel ?? STATION_LABELS[typedStationId] ?? stationId;
  const description = stationDescription ?? STATION_DESCRIPTIONS[typedStationId] ?? "";
  const stationIndex = STATIONS.indexOf(typedStationId);
  const resolvedStationNumber =
    typeof stationNumber === "number" ? stationNumber : stationIndex >= 0 ? stationIndex + 1 : null;

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="relative shrink-0 px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,91,151,0.06)",
        borderBottom: "1px solid rgba(0,91,151,0.08)",
      }}
    >
      {/* Subtle radiance glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 10% 50%, rgba(0,91,151,0.04) 0%, transparent 50%)",
        }}
      />

      {/* Left: Logo + Station Identity */}
      <div className="relative flex items-center gap-2 sm:gap-3 md:gap-4 w-full xs:w-auto">
        {/* Skyco Logo */}
        <SmartLogoLink alt="Skyco" imgClassName="h-7 sm:h-8 md:h-10 w-auto shrink-0" />

        {/* Divider */}
        <div className="h-6 sm:h-7 md:h-8 w-px bg-slate-200 shrink-0" />

        {/* Station number badge with subtle depth */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl text-white flex items-center justify-center text-base sm:text-lg md:text-xl font-bold font-mono tabular-nums shrink-0"
          style={{
            background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
          }}
        >
          {resolvedStationNumber ?? "•"}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 leading-tight truncate" style={{ letterSpacing: "-0.02em" }}>
            {label}
          </h1>
          <p className="text-xs sm:text-sm text-[#6497B0] mt-0.5 truncate font-medium hidden sm:block">
            {description}
          </p>
        </div>
      </div>

      {/* Right: Quick Stats */}
      <div className="relative flex items-center gap-2 sm:gap-3 md:gap-4 w-full xs:w-auto justify-between xs:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 xs:pb-0">
        {/* Order count */}
        <div className="text-right shrink-0">
          <div className="font-mono text-xl sm:text-2xl md:text-3xl font-bold tabular-nums text-slate-900 leading-none tracking-tighter">
            {orderCount}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mt-0.5 sm:mt-1 font-semibold">
            Orders
          </div>
        </div>

        {/* Hold badge with bevel */}
        {holdCount > 0 && (
          <div
            className="flex items-center gap-1.5 sm:gap-2 min-w-[56px] sm:min-w-[64px] md:min-w-[72px] px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl shrink-0"
            style={{
              background: "linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(225,29,72,0.08)",
              border: "1px solid rgba(225,29,72,0.15)",
            }}
          >
            <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-rose-600 shrink-0" />
            <span className="font-mono text-sm sm:text-base md:text-lg font-semibold text-rose-600 tabular-nums">
              {holdCount}
            </span>
          </div>
        )}

        {/* Missing badge with bevel */}
        {missingCount > 0 && (
          <div
            className="flex items-center gap-1.5 sm:gap-2 min-w-[56px] sm:min-w-[64px] md:min-w-[72px] px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl shrink-0"
            style={{
              background: "linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(217,119,6,0.08)",
              border: "1px solid rgba(217,119,6,0.15)",
            }}
          >
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 shrink-0" />
            <span className="font-mono text-sm sm:text-base md:text-lg font-semibold text-amber-600 tabular-nums">
              {missingCount}
            </span>
          </div>
        )}

        {/* Premium clock display */}
        <div className="pl-2 sm:pl-3 md:pl-4 border-l border-slate-200/60 shrink-0">
          <div
            className="theme-clock-surface flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3.5 py-1.5 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl font-mono tabular-nums"
            style={{
              background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,91,151,0.08)",
            }}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#6497B0] hidden xs:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-xs sm:text-sm md:text-base text-slate-700 font-semibold">
              {currentTime}
            </span>
          </div>
        </div>

        <ThemeToggle />

        {/* Order search */}
        <OrderSearch theme="light" />
      </div>
    </header>
  );
}
