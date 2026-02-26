"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StationOrder } from "@/lib/types";

export interface KanbanColumn {
  stationId: string;
  label: string;
  description: string;
  orders: StationOrder[];
}

interface UseKanbanOrdersReturn {
  columns: KanbanColumn[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  moveOrder: (orderId: string, fromStation: string, toStation: string) => void;
}

const POLL_INTERVAL = 10_000;

export function useKanbanOrders(): UseKanbanOrdersReturn {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const movingRef = useRef(false); // Suppress poll while move in-flight

  const fetchKanban = useCallback(async () => {
    // Skip poll if a move is in progress to avoid overwriting optimistic state
    if (movingRef.current) return;

    try {
      const res = await fetch("/api/stations/kanban");

      if (!res.ok) {
        throw new Error(`Failed to fetch kanban data: ${res.status}`);
      }

      const json = await res.json();

      if (!mountedRef.current) return;

      setColumns(json.data ?? []);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to fetch kanban data"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchKanban();

    const interval = setInterval(fetchKanban, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchKanban]);

  const moveOrder = useCallback(
    async (orderId: string, fromStation: string, toStation: string) => {
      if (fromStation === toStation) return;

      movingRef.current = true;

      // Optimistic update — move the order card between columns immediately
      setColumns((prev) => {
        const next = prev.map((col) => ({ ...col, orders: [...col.orders] }));

        const srcCol = next.find((c) => c.stationId === fromStation);
        const dstCol = next.find((c) => c.stationId === toStation);
        if (!srcCol || !dstCol) return prev;

        const orderIdx = srcCol.orders.findIndex((o) => o.id === orderId);
        if (orderIdx === -1) return prev;

        const [order] = srcCol.orders.splice(orderIdx, 1);
        // Reset done status when moving to new station
        dstCol.orders.push({ ...order, done: false, doneAt: null });

        return next;
      });

      // Persist the station change on the server
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentStation: toStation }),
        });

        if (!res.ok) {
          // Revert by re-fetching
          movingRef.current = false;
          await fetchKanban();
          return;
        }
      } catch {
        movingRef.current = false;
        await fetchKanban();
        return;
      }

      // Allow a short delay then re-enable polling and do a fresh fetch
      setTimeout(async () => {
        movingRef.current = false;
        if (mountedRef.current) {
          await fetchKanban();
        }
      }, 500);
    },
    [fetchKanban]
  );

  return { columns, loading, error, refresh: fetchKanban, moveOrder };
}
