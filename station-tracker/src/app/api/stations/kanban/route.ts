
import { NextResponse } from "next/server";
import { getStationOrders, getAllStations } from "@/lib/queries";
import { STATIONS, STATION_LABELS, STATION_DESCRIPTIONS } from "@/lib/types";
import type { StationId, StationOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface KanbanColumn {
  stationId: string;
  label: string;
  description: string;
  orders: StationOrder[];
}

/**
 * GET /api/stations/kanban
 * Returns all stations with their orders, optimized for Kanban board view.
 */
export async function GET() {
  try {
    // Prefer DB stations, fall back to hardcoded list
    const dbStations = await getAllStations();
    const stationList: Array<{ id: string; label: string; description: string }> =
      dbStations.length > 0
        ? dbStations.map((s) => ({ id: s.id, label: s.label, description: s.description }))
        : STATIONS.map((s) => ({
            id: s,
            label: STATION_LABELS[s],
            description: STATION_DESCRIPTIONS[s],
          }));

    const columns: KanbanColumn[] = await Promise.all(
      stationList.map(async (station) => {
        const orders = await getStationOrders(station.id as StationId);
        return {
          stationId: station.id,
          label: station.label,
          description: station.description,
          orders,
        };
      })
    );

    return NextResponse.json({ data: columns, error: null });
  } catch (err) {
    console.error("[GET /api/stations/kanban]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
