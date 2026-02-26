"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { LayoutGrid, Columns3 } from "lucide-react";
import { useStationSummary } from "@/hooks/useStationSummary";
import StationCard from "@/components/StationCard";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

// Lazy-load Kanban board — only fetched when toggled on
const KanbanBoard = lazy(() => import("@/components/KanbanBoard"));

type ViewMode = "tiles" | "kanban";

// ---------------------------------------------------------------------------
// Dashboard Client Component
// ---------------------------------------------------------------------------
export default function DashboardClient() {
  const { stations, loading, error } = useStationSummary();
  const [currentTime, setCurrentTime] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tiles");

  // ---------------------------------------------------------------------------
  // Live clock
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-dvh bg-slate-50 flex flex-col">
      {/* Dashboard Header — premium dark blue gradient */}
      <header
        className="relative shrink-0 px-2 py-2 sm:px-4 sm:py-3 md:px-8 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 md:gap-0 overflow-visible"
        style={{
          background: "linear-gradient(135deg, #005B97 0%, #004A7C 40%, #193D6B 100%)",
          boxShadow: "0 4px 20px rgba(0,91,151,0.15)",
          color: "white",
        }}
      >
        {/* Decorative radiance glow behind header */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(100,151,176,0.25) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(0,91,151,0.15) 0%, transparent 50%)",
          }}
        />

        <div className="relative flex items-center gap-2 sm:gap-3 md:gap-5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
            <SmartLogoLink
              alt="Skyco Shading Systems"
              imgClassName="h-7 sm:h-8 md:h-10 w-auto shrink-0"
            />
            <div className="h-5 sm:h-6 md:h-8 w-px bg-white/20" />
            <div>
              <h1 className="text-base sm:text-lg md:text-2xl font-bold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                Station Tracker
              </h1>
              <p className="text-[10px] sm:text-[11px] md:text-[13px] text-white/70 mt-0.5 font-medium hidden md:block">
                Production floor overview
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto overflow-y-visible pb-0.5 sm:pb-1 md:pb-0 hide-scrollbar">
          {/* ── View Toggle ── */}
          <div
            className="flex items-center rounded-lg sm:rounded-xl p-0.5 sm:p-1 relative shrink-0"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              id="view-toggle-tiles"
              onClick={() => setViewMode("tiles")}
              className={`
                relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold
                transition-all duration-200 ease-out min-h-[28px] sm:min-h-[32px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                ${viewMode === "tiles"
                  ? "text-[#005B97] bg-white shadow-sm"
                  : "text-white/70 hover:text-white"
                }
              `}
            >
              <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Tiles</span>
            </button>
            <button
              id="view-toggle-kanban"
              onClick={() => setViewMode("kanban")}
              className={`
                relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold
                transition-all duration-200 ease-out min-h-[28px] sm:min-h-[32px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                ${viewMode === "kanban"
                  ? "text-[#005B97] bg-white shadow-sm"
                  : "text-white/70 hover:text-white"
                }
              `}
            >
              <Columns3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Kanban</span>
            </button>
          </div>

          {/* Separator */}
          <div className="h-5 sm:h-6 w-px bg-white/20 shrink-0 hidden sm:block" />

          {/* Premium clock display */}
          <div
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-mono tabular-nums shrink-0"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
            }}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white/70 hidden xs:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-xs sm:text-sm md:text-base font-semibold">
              {currentTime}
            </span>
          </div>

          <ThemeToggle />

          {/* Order search */}
          <OrderSearch theme="dark" />
        </div>
      </header>

      {/* Main Content — switches between Tiles and Kanban */}
      <main
        className={`
          bg-slate-50 flex-1 overflow-hidden
          ${viewMode === "tiles" ? "overflow-y-auto overscroll-contain custom-scrollbar" : ""}
          p-6 md:p-8
        `}
      >
        {/* ── TILES VIEW ── */}
        {viewMode === "tiles" && (
          <>
            {/* Error state */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 max-w-[1800px] mx-auto">
                <p className="font-medium">Failed to load station data</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && stations.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7 max-w-[1800px] mx-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg animate-shimmer" />
                        <div className="h-6 w-28 bg-slate-100 rounded-md animate-shimmer" />
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-100 animate-shimmer" />
                    </div>
                    <div className="h-4 w-44 bg-slate-100 rounded-md animate-shimmer mb-6" />
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="h-12 w-14 bg-slate-100 rounded-md animate-shimmer mb-2" />
                        <div className="h-3 w-12 bg-slate-100 rounded-md animate-shimmer" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-10 bg-slate-100 rounded-md animate-shimmer" />
                        <div className="h-5 w-10 bg-slate-100 rounded-md animate-shimmer" />
                      </div>
                    </div>
                    <div className="mt-6 h-2 w-full bg-slate-100 rounded-full animate-shimmer" />
                  </div>
                ))}
              </div>
            )}

            {/* Station grid */}
            {stations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7 max-w-[1800px] mx-auto">
                {stations.map((station) => (
                  <StationCard
                    key={station.stationId}
                    station={station}
                    displayNumber={station.sortOrder + 1}
                  />
                ))}
              </div>
            )}

            {/* Empty state (only when not loading and no error) */}
            {!loading && !error && stations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162M3.75 21V18m0 0h16.5m-16.5 0a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 013.75 3h16.5a2.25 2.25 0 012.25 2.25v10.5"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                    No Stations Configured
                  </h2>
                  <p className="text-base text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Add orders through the admin panel to get started.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="mt-2 inline-flex items-center rounded-xl bg-[#005B97] px-6 py-3 text-sm font-medium text-white transition-all duration-150 ease-out active:bg-[#004A7C] active:scale-[0.97] min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
                >
                  Open Admin Panel
                </Link>
              </div>
            )}
          </>
        )}

        {/* ── KANBAN VIEW ── */}
        {viewMode === "kanban" && (
          <div className="h-full animate-fade-in">
            <Suspense
              fallback={
                <div className="flex gap-5 overflow-x-auto pb-4 px-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-2xl min-w-[280px] w-[300px] shrink-0 p-4"
                      style={{
                        background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                        border: "1px solid rgba(0,91,151,0.08)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 bg-slate-200 rounded-lg animate-shimmer" />
                        <div className="h-4 w-24 bg-slate-200 rounded-md animate-shimmer" />
                      </div>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div
                          key={j}
                          className="bg-white rounded-xl p-3.5 mb-2.5 border border-slate-100"
                        >
                          <div className="h-4 w-20 bg-slate-100 rounded-md animate-shimmer mb-2" />
                          <div className="h-3 w-32 bg-slate-100 rounded-md animate-shimmer mb-2" />
                          <div className="h-3 w-16 bg-slate-100 rounded-md animate-shimmer" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              }
            >
              <KanbanBoard />
            </Suspense>
          </div>
        )}
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
