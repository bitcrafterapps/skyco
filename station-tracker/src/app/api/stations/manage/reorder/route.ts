import { NextRequest, NextResponse } from "next/server";
import { reorderStations } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/stations/manage/reorder
 * Reorder stations by ID sequence.
 * Body: { stationIds: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const stationIds = body?.stationIds;

    if (!Array.isArray(stationIds) || stationIds.length === 0) {
      return NextResponse.json(
        { data: null, error: "stationIds must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    const uniqueStationIds = Array.from(new Set(stationIds.filter((id: unknown) => typeof id === "string")));
    if (uniqueStationIds.length !== stationIds.length) {
      return NextResponse.json(
        { data: null, error: "stationIds must be unique strings" },
        { status: 400 }
      );
    }

    await reorderStations(uniqueStationIds);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    console.error("[PATCH /api/stations/manage/reorder]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
