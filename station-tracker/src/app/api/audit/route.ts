
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/audit?orderId=123&limit=50
 * Returns recent audit log entries (Skeptic Section 3.4).
 *
 * Query parameters:
 *   orderId - (optional) filter by order ID
 *   limit   - (optional) max rows to return, defaults to 50, max 500
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");
    const limitParam = searchParams.get("limit");

    const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 500);

    const where: any = {};
    if (orderIdParam) {
      const orderId = parseInt(orderIdParam, 10);
      if (isNaN(orderId)) {
        return NextResponse.json(
          { error: "Invalid orderId parameter" },
          { status: 400 }
        );
      }
      where.orderId = orderId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { changedAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    });

    // Flatten structure to match previous response
    const entries = logs.map((log: any) => ({
        ...log,
        order_number: log.order.orderNumber,
    }));

    return NextResponse.json({
      entries,
      count: entries.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
