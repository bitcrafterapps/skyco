"use client";

import { use, useMemo } from "react";
import { useStationOrders } from "@/hooks/useStationOrders";
import StationHeader from "@/components/StationHeader";
import StationFooter from "@/components/StationFooter";
import OrderTable from "@/components/OrderTable";

interface StationPageProps {
  params: Promise<{ stationId: string }>;
}

export default function StationPage({ params }: StationPageProps) {
  const { stationId: rawStationId } = use(params);

  const {
    orders,
    stationLabel,
    stationDescription,
    stationSortOrder,
    loading,
    error,
    toggleStatus,
    reorderOrders,
    lastRefreshed,
  } = useStationOrders(rawStationId);

  // Filter out done orders that have finished their fade-out animation
  const DONE_DISMISS_DELAY = 31_000; // 30s delay + 1s animation
  const visibleOrders = orders.filter((order) => {
    if (!order.done || !order.doneAt) return true;
    return Date.now() - order.doneAt < DONE_DISMISS_DELAY;
  });

  // Compute hold and missing counts from visible orders
  const holdCount = useMemo(
    () => visibleOrders.filter((o) => o.hold).length,
    [visibleOrders]
  );
  const missingCount = useMemo(
    () => visibleOrders.filter((o) => o.missing).length,
    [visibleOrders]
  );

  // Connection status derived from error state
  const isConnected = !error;

  // Format last refresh time
  const lastRefreshLabel = useMemo(() => {
    if (!lastRefreshed) return "...";
    const date = new Date(lastRefreshed);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [lastRefreshed]);

  return (
    <div className="h-dvh w-dvw burn-in-prevention">
      <div className="h-dvh grid grid-rows-[auto_1fr_auto] bg-white">
        {/* Zone 1: Station Header -- fixed, never scrolls */}
        <StationHeader
          stationId={rawStationId}
          stationLabel={stationLabel ?? undefined}
          stationDescription={stationDescription ?? undefined}
          stationNumber={
            typeof stationSortOrder === "number" ? stationSortOrder + 1 : undefined
          }
          orderCount={visibleOrders.length}
          holdCount={holdCount}
          missingCount={missingCount}
        />

        {/* Zone 2: Order Table -- scrollable */}
        <main className="overflow-y-auto overscroll-contain custom-scrollbar bg-slate-50">
          {/* Error banner inside scroll area */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl mx-4 mt-3 px-4 py-3 text-sm">
              Connection error: {error}. Retrying...
            </div>
          )}

          <OrderTable
            orders={visibleOrders}
            onToggleStatus={toggleStatus}
            onReorder={reorderOrders}
            loading={loading}
          />
        </main>

        {/* Zone 3: Footer -- fixed, never scrolls */}
        <StationFooter
          isConnected={isConnected}
          lastRefresh={lastRefreshLabel}
        />
      </div>
    </div>
  );
}
