import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, deleteOrder } from "@/lib/queries";
import { broadcast } from "@/lib/sse";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

function parseOrderId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/orders/[orderId]
 * Get a single order with all station statuses.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { orderId } = await params;
    const id = parseOrderId(orderId);
    if (id === null) {
      return NextResponse.json(
        { data: null, error: "Invalid orderId" },
        { status: 400 }
      );
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { data: null, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: order });
  } catch (err) {
    console.error("[GET /api/orders/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[orderId]
 * Update order fields.
 * Body: any subset of { orderNumber, customerName, department, currentStation, status, isRush, shipDate, saleAmount, sidemark, notes, target }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { orderId } = await params;
    const id = parseOrderId(orderId);
    if (id === null) {
      return NextResponse.json(
        { data: null, error: "Invalid orderId" },
        { status: 400 }
      );
    }

    // Check order exists
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: "Order not found" },
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

    // Validate currentStation type if provided
    if (body.currentStation && typeof body.currentStation !== "string") {
      return NextResponse.json(
        { data: null, error: "currentStation must be a string" },
        { status: 400 }
      );
    }

    const updated = await updateOrder(id, {
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      department: body.department,
      currentStation: body.currentStation,
      status: body.status,
      isRush: body.isRush,
      shipDate: body.shipDate,
      saleAmount: body.saleAmount,
      sidemark: body.sidemark,
      notes: body.notes,
      target: body.target,
    });

    broadcast("order-updated", updated);

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/orders/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[orderId]
 * Remove an order.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { orderId } = await params;
    const id = parseOrderId(orderId);
    if (id === null) {
      return NextResponse.json(
        { data: null, error: "Invalid orderId" },
        { status: 400 }
      );
    }

    const deleted = await deleteOrder(id);
    if (!deleted) {
      return NextResponse.json(
        { data: null, error: "Order not found" },
        { status: 404 }
      );
    }

    broadcast("order-deleted", { id: String(id) });

    return NextResponse.json({
      data: { id: String(id), deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/orders/:id]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
