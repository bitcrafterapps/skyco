import { NextRequest, NextResponse } from "next/server";
import { toggleOrderStationStatus } from "@/lib/queries";
import type { StatusField } from "@/lib/types";
import { broadcast } from "@/lib/sse";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

const VALID_FIELDS: StatusField[] = ["done", "hold", "missing"];

/**
 * POST /api/orders/[orderId]/status
 * Toggle done/hold/missing for a specific order at a specific station.
 * Body: { station: string, field: "done" | "hold" | "missing", value: boolean, holdReason?: string, missingDetails?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { orderId } = await params;
    const id = parseInt(orderId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { data: null, error: "Invalid orderId" },
        { status: 400 }
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

    // Validate station
    if (!body.station || typeof body.station !== "string") {
      return NextResponse.json(
        { data: null, error: "Invalid or missing station" },
        { status: 400 }
      );
    }

    // Validate field
    if (!body.field || !VALID_FIELDS.includes(body.field)) {
      return NextResponse.json(
        {
          data: null,
          error: `Invalid or missing field. Valid fields: ${VALID_FIELDS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate value
    if (typeof body.value !== "boolean") {
      return NextResponse.json(
        { data: null, error: "value must be a boolean" },
        { status: 400 }
      );
    }

    const extra =
      body.field === "hold"
        ? body.holdReason ?? body.reason ?? ""
        : body.field === "missing"
          ? body.missingDetails ?? body.reason ?? ""
          : undefined;

    const updated = await toggleOrderStationStatus(
      id,
      body.station,
      body.field as StatusField,
      body.value,
      extra
    );

    if (!updated) {
      return NextResponse.json(
        { data: null, error: "Order not found" },
        { status: 404 }
      );
    }

    broadcast("order-status-changed", {
      order: updated,
      station: body.station,
      field: body.field,
      value: body.value,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[POST /api/orders/:id/status]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
