import { NextResponse } from "next/server";
import { getStationSummaries } from "@/lib/queries";

/**
 * GET /api/stations
 * Get summary of all stations (count of orders, holds, missing, etc.)
 */
export async function GET() {
  try {
    const summaries = await getStationSummaries();
    return NextResponse.json({ data: summaries, error: null });
  } catch (err) {
    console.error("[GET /api/stations]", err);
    const message = err instanceof Error ? err.message : "Failed to load station data";
    return NextResponse.json(
      { data: [], error: message },
      { status: 500 }
    );
  }
}
