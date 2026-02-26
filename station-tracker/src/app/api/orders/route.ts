import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAllOrders, createOrder } from "@/lib/queries";
import { broadcast } from "@/lib/sse";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders
 * List all orders, optionally filtered by ?station=xxx
 * Returns orders sorted by priority (rush first, then ship_date).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const station = searchParams.get("station") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const sort = (searchParams.get("sort") === "recent" ? "recent" : "priority") as "recent" | "priority";

    const orders = await getAllOrders({ station, search, limit, sort });
    return NextResponse.json({ data: orders });
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order.
 * Body: { orderNumber, customerName, department?, currentStation?, status?, isRush?, shipDate?, saleAmount?, sidemark?, notes?, target? }
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

    // Validate required fields
    if (!body.orderNumber || typeof body.orderNumber !== "string") {
      return NextResponse.json(
        { data: null, error: "orderNumber is required and must be a string" },
        { status: 400 }
      );
    }
    if (!body.customerName || typeof body.customerName !== "string") {
      return NextResponse.json(
        { data: null, error: "customerName is required and must be a string" },
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

    const order = await createOrder({
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

    broadcast("order-created", order);

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/orders]", err);

    // Handle unique constraint violation (duplicate order number)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { data: null, error: "An order with this orderNumber already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
