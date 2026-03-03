"use client";

/**
 * useDoneAutoAdvance
 *
 * Utility to trigger automatic station advancement for an order when the
 * "Done" status is set. Reads the configured delay from the server setting
 * `done_advance_delay_minutes` (default: 5 minutes) and schedules a PATCH
 * to move the order to the next station in sorted order after. the delay.
 *
 * Returns a function `scheduleAdvance(orderId, currentStationId)` that,
 * when called, will fetch the ordered stations list, determine the next
 * station, and set a timer to advance the order.
 *
 * Also returns `cancelAdvance(orderId)` to cancel a pending advance
 * (e.g. if "Done" is toggled back off).
 */

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_DELAY_MINUTES = 5;
const SETTING_KEY = "done_advance_delay_minutes";

/** Fetch the configured delay in milliseconds */
async function fetchDelayMs(): Promise<number> {
  try {
    const res = await fetch(`/api/settings?prefix=${SETTING_KEY}`, {
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_DELAY_MINUTES * 60_000;
    const json = await res.json();
    const raw = json?.data?.[SETTING_KEY];
    const minutes = raw !== undefined ? parseFloat(raw) : NaN;
    if (!isNaN(minutes) && minutes > 0) return minutes * 60_000;
  } catch {
    // ignore
  }
  return DEFAULT_DELAY_MINUTES * 60_000;
}

/** Fetch the ordered stations list and return the next station after `currentStationId` */
async function fetchNextStation(
  currentStationId: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/stations", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const stations: Array<{ stationId: string; sortOrder: number }> =
      json?.data ?? [];
    const sorted = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((s) => s.stationId === currentStationId);
    if (idx === -1 || idx === sorted.length - 1) return null; // last or not found
    return sorted[idx + 1].stationId;
  } catch {
    return null;
  }
}

/** PATCH order to the next station and reset the done flag */
async function advanceOrder(
  orderId: string,
  nextStationId: string
): Promise<void> {
  try {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStation: nextStationId }),
    });
  } catch {
    // ignore
  }
}

export interface DoneAutoAdvance {
  scheduleAdvance: (orderId: string, currentStationId: string) => void;
  cancelAdvance: (orderId: string) => void;
}

export function useDoneAutoAdvance(
  onAdvanced?: (...args: unknown[]) => void
): DoneAutoAdvance {
  // Map of orderId -> timeout handle
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Stable ref for the callback so scheduleAdvance deps stay minimal
  const onAdvancedRef = useRef(onAdvanced);
  useEffect(() => {
    onAdvancedRef.current = onAdvanced;
  });

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      for (const handle of timers.current.values()) {
        clearTimeout(handle);
      }
      timers.current.clear();
    };
  }, []);

  const cancelAdvance = useCallback((orderId: string) => {
    const handle = timers.current.get(orderId);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.current.delete(orderId);
    }
  }, []);

  const scheduleAdvance = useCallback(
    (orderId: string, currentStationId: string) => {
      // Cancel any existing timer for this order
      cancelAdvance(orderId);

      // Kick off an async sequence: fetch delay, then set timer
      (async () => {
        const delayMs = await fetchDelayMs();

        // Set the timer
        const handle = setTimeout(async () => {
          timers.current.delete(orderId);
          const nextStation = await fetchNextStation(currentStationId);
          if (!nextStation) return; // Already at last station
          await advanceOrder(orderId, nextStation);
          onAdvancedRef.current?.(orderId, nextStation);
        }, delayMs);

        timers.current.set(orderId, handle);
      })();
    },
    [cancelAdvance]
  );

  return { scheduleAdvance, cancelAdvance };
}
