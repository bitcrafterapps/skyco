import { NextRequest, NextResponse } from "next/server";
import {
  getAllStationsIncludingInactive,
  createStation,
  getStationById,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/stations/manage
 * List all stations including inactive ones.
 */
export async function GET() {
  try {
    const stations = await getAllStationsIncludingInactive();
    return NextResponse.json({ data: stations, error: null });
  } catch (err) {
    console.error("[GET /api/stations/manage]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stations/manage
 * Create a new station.
 * Body: { id?: string, label: string, description?: string }
 * If id is not provided, it is auto-generated from the label as a slug.
 */
export async function POST(request: NextRequest) {
  try {
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

    if (!body.label || typeof body.label !== "string") {
      return NextResponse.json(
        { data: null, error: "label is required and must be a string" },
        { status: 400 }
      );
    }

    // Auto-generate slug from label if id not provided
    const id: string =
      body.id && typeof body.id === "string"
        ? body.id
        : body.label
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

    if (!id) {
      return NextResponse.json(
        { data: null, error: "Could not generate a valid ID from the label" },
        { status: 400 }
      );
    }

    // Check if station already exists
    const existing = await getStationById(id);
    if (existing) {
      return NextResponse.json(
        { data: null, error: `A station with id "${id}" already exists` },
        { status: 409 }
      );
    }

    const station = await createStation({
      id,
      label: body.label,
      description: body.description,
    });

    return NextResponse.json({ data: station }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/stations/manage]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
