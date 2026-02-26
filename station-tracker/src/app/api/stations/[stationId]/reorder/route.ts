import { NextRequest, NextResponse } from "next/server";
import { reorderStationOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/stations/[stationId]/reorder
 * Reorder orders within a station.
 * Body: { orderIds: string[] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    await params;

    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { data: null, error: "orderIds must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    await reorderStationOrders(orderIds);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    console.error("[PATCH /api/stations/:id/reorder]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
