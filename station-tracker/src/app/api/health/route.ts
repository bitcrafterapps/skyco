
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/health
 * Health check endpoint (Skeptic Section 1.3).
 * Returns server status, timestamp, and order count.
 */
export async function GET() {
  try {
    const count = await prisma.order.count();
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      orderCount: count,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}
