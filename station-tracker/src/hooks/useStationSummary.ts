"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StationSummary } from "@/lib/types";

interface UseStationSummaryReturn {
  stations: StationSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL = 10_000;

export function useStationSummary(): UseStationSummaryReturn {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/stations");

      if (!res.ok) {
        throw new Error(`Failed to fetch station summary: ${res.status}`);
      }

      const data = await res.json();

      if (!mountedRef.current) return;

      const rows = (data.data ?? data) as StationSummary[];
      setStations(
        [...rows].sort((a, b) => {
          const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
          const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder;
        })
      );
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to fetch station summary"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchSummary();

    const interval = setInterval(fetchSummary, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchSummary]);

  return { stations, loading, error, refresh: fetchSummary };
}
