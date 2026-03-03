"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StationOrder, StatusField } from "@/lib/types";

interface UseStationOrdersReturn {
  orders: StationOrder[];
  stationLabel: string | null;
  stationDescription: string | null;
  stationSortOrder: number | null;
  loading: boolean;
  error: string | null;
  toggleStatus: (orderId: string, field: StatusField) => void;
  reorderOrders: (orderIds: string[]) => void;
  lastRefreshed: number | null;
  /** Configured auto-advance delay in ms (default 5 min). Drives the countdown. */
  advanceDelayMs: number;
}

const POLL_INTERVAL = 5_000;

export function useStationOrders(stationId: string): UseStationOrdersReturn {
  const [orders, setOrders] = useState<StationOrder[]>([]);
  const [stationLabel, setStationLabel] = useState<string | null>(null);
  const [stationDescription, setStationDescription] = useState<string | null>(null);
  const [stationSortOrder, setStationSortOrder] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [advanceDelayMs, setAdvanceDelayMs] = useState(5 * 60_000);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Fetch the configured auto-advance delay once on mount
  useEffect(() => {
    fetch("/api/settings?prefix=done_advance_delay_minutes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const raw = json?.data?.done_advance_delay_minutes;
        const mins = raw ? parseFloat(raw) : NaN;
        if (!isNaN(mins) && mins > 0) setAdvanceDelayMs(mins * 60_000);
      })
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`/api/stations/${stationId}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status}`);
      }

      const json = await res.json();

      if (!mountedRef.current) return;

      // API returns { data: { stationId, label, orders } }
      setStationLabel(json.data?.label ?? null);
      setStationDescription(json.data?.description ?? null);
      setStationSortOrder(
        typeof json.data?.sortOrder === "number" ? json.data.sortOrder : null
      );
      const incomingOrders: StationOrder[] = json.data?.orders ?? [];

      // Preserve local doneAt timestamps for orders already tracked
      setOrders((prev) => {
        const prevMap = new Map(prev.map((o) => [o.id, o]));
        return incomingOrders.map((order: StationOrder) => {
          const existing = prevMap.get(order.id);
          return {
            ...order,
            doneAt:
              order.done && existing?.doneAt
                ? existing.doneAt
                : order.done
                  ? order.doneAt ?? Date.now()
                  : null,
          };
        });
      });

      setError(null);
      setLastRefreshed(Date.now());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [stationId]);


  // Initial fetch and polling
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchOrders();

    const interval = setInterval(fetchOrders, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const toggleStatus = useCallback(
    async (orderId: string, field: StatusField) => {
      // Find the current value so we can compute the new value
      const currentOrder = orders.find((o) => o.id === orderId);
      if (!currentOrder) return;

      const newValue = !currentOrder[field];

      // Optimistic update — statuses are independent
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          if (newValue) {
            // Activating one status — statuses are independent
            const updates: Partial<StationOrder> = { [field]: true };
            if (field === "done") updates.doneAt = Date.now();
            return { ...order, ...updates };
          }

          // Deactivating just clears that one field
          const updates: Partial<StationOrder> = { [field]: false };
          if (field === "done") updates.doneAt = null;

          return { ...order, ...updates };
        })
      );

      // Send to server - API uses POST with { station, field, value }
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station: stationId,
            field,
            value: newValue,
          }),
        });

        if (!res.ok) {
          await fetchOrders();
        }
      } catch {
        await fetchOrders();
      }
    },
    [stationId, fetchOrders, orders]
  );

  const reorderOrders = useCallback(
    async (orderIds: string[]) => {
      // Optimistic update: reorder the local state immediately
      setOrders((prev) => {
        const orderMap = new Map(prev.map((o) => [o.id, o]));
        const reordered: StationOrder[] = [];
        for (const id of orderIds) {
          const order = orderMap.get(id);
          if (order) reordered.push(order);
        }
        // Append any orders not in the reorder list (safety net)
        for (const order of prev) {
          if (!orderIds.includes(order.id)) {
            reordered.push(order);
          }
        }
        return reordered;
      });

      // Persist to server
      try {
        const res = await fetch(`/api/stations/${stationId}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds }),
        });

        if (!res.ok) {
          // Revert on failure by re-fetching
          await fetchOrders();
        }
      } catch {
        await fetchOrders();
      }
    },
    [stationId, fetchOrders]
  );

  return {
    orders,
    stationLabel,
    stationDescription,
    stationSortOrder,
    loading,
    error,
    toggleStatus,
    reorderOrders,
    lastRefreshed,
    advanceDelayMs,
  };
}
