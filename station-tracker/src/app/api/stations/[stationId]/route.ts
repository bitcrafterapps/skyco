import { NextRequest, NextResponse } from "next/server";
import { getStationById, getStationOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/stations/[stationId]
 * Get all orders for a specific station.
 * Sort by: rush orders first, then by ship_date ascending, then by order_number.
 * Filters out orders where done_at is more than 30 seconds ago (auto-dismiss).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId: rawId } = await params;
    const station = await getStationById(rawId);
    if (!station) {
      return NextResponse.json(
        { data: null, error: `Station "${rawId}" not found` },
        { status: 404 }
      );
    }

    const orders = await getStationOrders(station.id);

    return NextResponse.json({
      data: {
        stationId: station.id,
        label: station.label,
        description: station.description,
        sortOrder: station.sortOrder,
        orders,
      },
    });
  } catch (err) {
    console.error("[GET /api/stations/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
