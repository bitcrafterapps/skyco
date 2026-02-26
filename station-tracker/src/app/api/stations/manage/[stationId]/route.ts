import { NextRequest, NextResponse } from "next/server";
import {
  getStationById,
  updateStation,
  deleteStation,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ stationId: string }> };

/**
 * GET /api/stations/manage/[stationId]
 * Get a single station by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { stationId } = await params;
    const station = await getStationById(stationId);

    if (!station) {
      return NextResponse.json(
        { data: null, error: "Station not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: station });
  } catch (err) {
    console.error("[GET /api/stations/manage/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stations/manage/[stationId]
 * Update a station.
 * Body: partial { label?, description?, sort_order?, is_active? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { stationId } = await params;

    // Check station exists
    const existing = await getStationById(stationId);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: "Station not found" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const updated = await updateStation(stationId, {
      label: body.label,
      description: body.description,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/stations/manage/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stations/manage/[stationId]
 * Delete a station. Returns error if orders reference it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { stationId } = await params;

    // Check station exists
    const existing = await getStationById(stationId);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: "Station not found" },
        { status: 404 }
      );
    }

    const result = await deleteStation(stationId);

    if (!result.deleted) {
      return NextResponse.json(
        { data: null, error: result.error ?? "Failed to delete station" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      data: { id: stationId, deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/stations/manage/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
