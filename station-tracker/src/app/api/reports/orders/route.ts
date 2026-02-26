import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: number;
  orderNumber: string;
  customerName: string;
  department: string;
  currentStation: string;
  status: string;
  isRush: boolean;
  shipDate: string | null;
  saleAmount: number;
  sidemark: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  hasHold: boolean;
  hasMissing: boolean;
  isDoneAtCurrentStation: boolean;
};

function parseDateBoundary(raw: string | null, mode: "start" | "end"): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (mode === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function toCsv(rows: ReportRow[]): string {
  const header = [
    "id",
    "orderNumber",
    "customerName",
    "department",
    "currentStation",
    "status",
    "isRush",
    "shipDate",
    "saleAmount",
    "sidemark",
    "target",
    "createdAt",
    "updatedAt",
    "hasHold",
    "hasMissing",
    "isDoneAtCurrentStation",
  ];

  const escapeCsv = (value: string | number | boolean | null): string => {
    if (value === null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
      return `"${str.replaceAll("\"", "\"\"")}"`;
    }
    return str;
  };

  const body = rows.map((row) =>
    [
      row.id,
      row.orderNumber,
      row.customerName,
      row.department,
      row.currentStation,
      row.status,
      row.isRush,
      row.shipDate,
      row.saleAmount,
      row.sidemark,
      row.target,
      row.createdAt,
      row.updatedAt,
      row.hasHold,
      row.hasMissing,
      row.isDoneAtCurrentStation,
    ]
      .map((value) => escapeCsv(value))
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const station = searchParams.get("station")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const rush = searchParams.get("rush")?.trim() ?? "all";
    const startDate = parseDateBoundary(searchParams.get("startDate"), "start");
    const endDate = parseDateBoundary(searchParams.get("endDate"), "end");
    const format = searchParams.get("format")?.trim() ?? "json";

    const where: Record<string, unknown> = {};
    if (station) where.currentStation = station;
    if (status) where.status = status;
    if (rush === "true") where.isRush = true;
    if (rush === "false") where.isRush = false;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { sidemark: { contains: search, mode: "insensitive" } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { stationStatuses: true },
      orderBy: [{ shipDate: "desc" }, { createdAt: "desc" }],
      take: 2000,
    });

    const rows: ReportRow[] = orders.map((order) => {
      const hasHold = order.stationStatuses.some((s) => s.hold);
      const hasMissing = order.stationStatuses.some((s) => s.missing);
      const currentStatus = order.stationStatuses.find(
        (s) => s.station === order.currentStation
      );
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        department: order.department,
        currentStation: order.currentStation,
        status: order.status,
        isRush: order.isRush,
        shipDate: order.shipDate,
        saleAmount: order.saleAmount,
        sidemark: order.sidemark,
        target: order.target,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        hasHold,
        hasMissing,
        isDoneAtCurrentStation: Boolean(currentStatus?.done),
      };
    });

    if (format === "csv") {
      const csv = toCsv(rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="orders-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const totalOrders = rows.length;
    const rushOrders = rows.filter((row) => row.isRush).length;
    const holdOrders = rows.filter((row) => row.hasHold).length;
    const missingOrders = rows.filter((row) => row.hasMissing).length;
    const doneAtCurrentStation = rows.filter(
      (row) => row.isDoneAtCurrentStation
    ).length;
    const totalSaleAmount = rows.reduce((sum, row) => sum + row.saleAmount, 0);
    const avgSaleAmount = totalOrders > 0 ? totalSaleAmount / totalOrders : 0;

    const statusCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    const stationCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.currentStation] = (acc[row.currentStation] ?? 0) + 1;
      return acc;
    }, {});

    const dailyCounts = rows.reduce<Record<string, number>>((acc, row) => {
      const day = row.createdAt.slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      data: {
        filters: {
          search,
          station,
          status,
          rush,
          startDate: startDate?.toISOString() ?? null,
          endDate: endDate?.toISOString() ?? null,
        },
        metrics: {
          totalOrders,
          rushOrders,
          holdOrders,
          missingOrders,
          doneAtCurrentStation,
          totalSaleAmount,
          avgSaleAmount,
        },
        charts: {
          statusCounts,
          stationCounts,
          dailyCounts,
        },
        rows,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/reports/orders]", err);
    return NextResponse.json(
      { data: null, error: "Failed to build report data" },
      { status: 500 }
    );
  }
}
