
import { prisma } from "./db";
import {
  STATIONS,
  STATION_LABELS,
  STATION_DESCRIPTIONS,
} from "./types";
import type {
  Order,
  OrderStationStatus,
  StationId,
  StationOrder,
  StationSummary,
  DbStation,
  OrderStatus
} from "./types";

// ─── Mappers ─────────────────────────────────────────────────────

function mapStationStatuses(rows: any[]): Record<StationId, OrderStationStatus> {
  const statuses = {} as Record<StationId, OrderStationStatus>;
  for (const station of STATIONS) {
    statuses[station] = {
      done: false,
      hold: false,
      holdReason: "",
      missing: false,
      missingDetails: "",
    };
  }
  for (const row of rows) {
    const s = row.station as StationId;
    statuses[s] = {
      done: row.done,
      hold: row.hold,
      holdReason: row.holdReason,
      missing: row.missing,
      missingDetails: row.missingDetails,
    };
  }
  return statuses;
}

function mapOrder(order: any): Order {
  return {
    id: String(order.id),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    department: order.department,
    currentStation: order.currentStation as StationId,
    status: order.status as Order["status"],
    isRush: order.isRush,
    shipDate: order.shipDate,
    saleAmount: order.saleAmount,
    sidemark: order.sidemark,
    notes: order.notes,
    target: order.target,
    stationStatuses: mapStationStatuses(order.stationStatuses || []),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function mapStationOrder(order: any, stationStatus?: any): StationOrder {
  const status = stationStatus ?? {
    done: false,
    hold: false,
    holdReason: "",
    missing: false,
    missingDetails: "",
    doneAt: null,
  };

  return {
    id: String(order.id),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    department: order.department,
    isRush: order.isRush,
    shipDate: order.shipDate,
    sidemark: order.sidemark,
    notes: order.notes,
    done: status.done,
    hold: status.hold,
    holdReason: status.holdReason,
    missing: status.missing,
    missingDetails: status.missingDetails,
    doneAt: status.doneAt ? new Date(status.doneAt).getTime() : null,
    autoAdvancedFrom: order.autoAdvancedFrom ?? null,
    autoAdvancedAt: order.autoAdvancedAt ? new Date(order.autoAdvancedAt).getTime() : null,
  };
}

function mapDbStation(station: any): DbStation {
  return {
    id: station.id,
    label: station.label,
    description: station.description,
    sortOrder: station.sortOrder,
    isActive: station.isActive,
    createdAt: station.createdAt.toISOString(),
    updatedAt: station.updatedAt.toISOString(),
  };
}

// ─── Station Query Functions ─────────────────────────────────────

export async function getAllStations(): Promise<DbStation[]> {
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return stations.map(mapDbStation);
}

export async function getAllStationsIncludingInactive(): Promise<DbStation[]> {
  const stations = await prisma.station.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return stations.map(mapDbStation);
}

export async function getStationById(id: string): Promise<DbStation | null> {
  const station = await prisma.station.findUnique({
    where: { id },
  });
  return station ? mapDbStation(station) : null;
}

export async function createStation(data: {
  id: string;
  label: string;
  description?: string;
}): Promise<DbStation> {
  const maxOrder = await prisma.station.aggregate({
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const station = await prisma.station.create({
    data: {
      id: data.id,
      label: data.label,
      description: data.description ?? "",
      sortOrder: nextOrder,
    },
  });

  return mapDbStation(station);
}

export async function updateStation(
  id: string,
  data: Partial<{
    label: string;
    description: string;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<DbStation | null> {
  const updateData: any = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;
  if (data.is_active !== undefined) updateData.isActive = data.is_active;

  if (Object.keys(updateData).length === 0) {
    return getStationById(id);
  }

  try {
    const station = await prisma.station.update({
      where: { id },
      data: updateData,
    });
    return mapDbStation(station);
  } catch (e) {
    return null;
  }
}

export async function deleteStation(id: string): Promise<{ deleted: boolean; error?: string }> {
  // Check if active orders reference this station
  const count = await prisma.order.count({
    where: {
      currentStation: id,
    },
  });

  if (count > 0) {
    return {
      deleted: false,
      error: `Cannot delete station: ${count} order(s) are currently assigned to it`,
    };
  }

  try {
    await prisma.station.delete({ where: { id } });
    return { deleted: true };
  } catch (e) {
    return { deleted: false };
  }
}

export async function getStationOrderCount(stationId: string): Promise<number> {
  return await prisma.order.count({
    where: {
      currentStation: stationId,
    },
  });
}

export async function reorderStations(stationIds: string[]): Promise<void> {
  const updates = stationIds.map((id, index) =>
    prisma.station.update({
      where: { id },
      data: { sortOrder: index },
    })
  );
  await prisma.$transaction(updates);
}

// ─── Order Query Functions ───────────────────────────────────────

export async function getAllOrders(options?: string | {
  station?: string;
  search?: string;
  limit?: number;
  sort?: "recent" | "priority";
}): Promise<Order[]> {
  // Support legacy string argument (station only)
  const station = typeof options === "string" ? options : options?.station;
  const search = typeof options === "object" ? options?.search : undefined;
  const limit = typeof options === "object" ? options?.limit : undefined;
  const sort = typeof options === "object" ? (options?.sort ?? "priority") : "priority";

  const where: any = {};
  if (station) {
    where.currentStation = station;
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { stationStatuses: true },
    orderBy: sort === "recent"
      ? [{ updatedAt: "desc" }]
      : [{ isRush: "desc" }, { shipDate: "asc" }, { orderNumber: "asc" }],
    take: limit,
  });

  return orders.map(mapOrder);
}

export async function getOrderById(id: number): Promise<Order | null> {
  const order = await prisma.order.findFirst({
    where: { id },
    include: { stationStatuses: true },
  });

  return order ? mapOrder(order) : null;
}

export async function createOrder(data: {
  orderNumber: string;
  customerName: string;
  department?: string;
  currentStation?: StationId;
  status?: string;
  isRush?: boolean;
  shipDate?: string | null;
  saleAmount?: number;
  sidemark?: string;
  notes?: string;
  target?: string;
}): Promise<Order> {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        customerName: data.customerName ?? "",
        department: data.department ?? "",
        currentStation: data.currentStation ?? "basket",
        status: data.status ?? "Producible",
        isRush: data.isRush ?? false,
        shipDate: data.shipDate ?? null,
        saleAmount: data.saleAmount ?? 0,
        sidemark: data.sidemark ?? "",
        notes: data.notes ?? "",
        target: data.target ?? "",
      },
    });

    // Create station statuses
    await tx.orderStationStatus.createMany({
      data: STATIONS.map((station) => ({
        orderId: order.id,
        station,
        done: false,
        hold: false,
        missing: false,
      })),
    });

    return await tx.order.findUnique({
      where: { id: order.id },
      include: { stationStatuses: true },
    });
  });

  return mapOrder(result!);
}

export async function updateOrder(
  id: number,
  data: Partial<{
    orderNumber: string;
    customerName: string;
    department: string;
    currentStation: StationId;
    status: string;
    isRush: boolean;
    shipDate: string | null;
    saleAmount: number;
    sidemark: string;
    notes: string;
    target: string;
  }>
): Promise<Order | null> {
  const updateData: any = {};
  if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.currentStation !== undefined) {
    updateData.currentStation = data.currentStation;
    // Clear the auto-advance marker when an admin manually changes the station
    // so the "arrived from" pill doesn't persist after a manual move.
    updateData.autoAdvancedFrom = null;
    updateData.autoAdvancedAt = null;
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isRush !== undefined) updateData.isRush = data.isRush;
  if (data.shipDate !== undefined) updateData.shipDate = data.shipDate;
  if (data.saleAmount !== undefined) updateData.saleAmount = data.saleAmount;
  if (data.sidemark !== undefined) updateData.sidemark = data.sidemark;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.target !== undefined) updateData.target = data.target;

  if (Object.keys(updateData).length === 0) return getOrderById(id);

  try {
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { stationStatuses: true },
    });
    return mapOrder(order);
  } catch (e) {
    return null;
  }
}

export async function deleteOrder(id: number): Promise<boolean> {
  try {
    await prisma.order.delete({
      where: { id },
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function toggleOrderStationStatus(
  orderId: number,
  station: string,
  field: "done" | "hold" | "missing",
  value: boolean,
  extra?: string
): Promise<Order | null> {
  const orderExists = await prisma.order.findUnique({ where: { id: orderId } });
  if (!orderExists) return null;

  await prisma.$transaction(async (tx) => {
    // Audit logging
    const currentStatus = await tx.orderStationStatus.findUnique({
      where: {
        orderId_station: {
          orderId,
          station,
        },
      },
    });

    const oldValue = currentStatus ? (currentStatus as any)[field] : false;

    const data: any = {};
    if (field === "done") {
      data.done = value;
      data.doneAt = value ? new Date().toISOString() : null;
    } else if (field === "hold") {
      data.hold = value;
      data.holdReason = extra ?? "";
    } else if (field === "missing") {
      data.missing = value;
      data.missingDetails = extra ?? "";
    }

    await tx.orderStationStatus.upsert({
      where: {
        orderId_station: {
          orderId,
          station,
        },
      },
      create: {
        orderId,
        station,
        done: field === "done" ? value : false,
        hold: field === "hold" ? value : false,
        holdReason: field === "hold" ? (extra ?? "") : "",
        missing: field === "missing" ? value : false,
        missingDetails: field === "missing" ? (extra ?? "") : "",
        doneAt: field === "done" && value ? new Date().toISOString() : null,
      },
      update: data,
    });

    // Touch order timestamp
    await tx.order.update({
      where: { id: orderId },
      data: { updatedAt: new Date() },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        orderId,
        station,
        fieldChanged: field,
        oldValue: String(oldValue),
        newValue: String(value),
        changedBy: station, // pseudo-user
      },
    });
  });

  return getOrderById(orderId);
}

export async function getStationOrders(station: string): Promise<StationOrder[]> {
  /*
   Logic:
   - Order must be AT this current_station
   - Not deleted
   - If 'done' is true, done_at should be within last 30 seconds (fade out effect)
     OR done_at is null (legacy?) OR done is false
   */

  // 30 seconds ago
  // We'll filter the done_at in JS or raw query, but Prisma findMany is cleaner if possible.
  // Since doneAt is a String in our schema (from SQLite legacy string format), we can comparing strings ISO format works mostly.
  // But safest is to fetch relevant orders and filter JS side or use raw query.
  // Let's use Prisma Relations.

  // NOTE: Schema defined doneAt as String? to match existing SQLite logic, but ideal Prisma is DateTime.
  // I kept it String? in schema.prisma.

  // We need orders where currentStation == station
  const orders = await prisma.order.findMany({
      where: {
          currentStation: station,
      },
      include: {
          stationStatuses: {
              where: { station },
          }
      },
      orderBy: [
          { sortOrder: 'asc' },
          { isRush: 'desc' },
          { shipDate: 'asc' },
          { orderNumber: 'asc' },
      ]
  });

  // Return all orders at this station — done orders stay visible until
  // autoAdvanceDoneOrders moves them to the next station.
  return orders.map(o => mapStationOrder(o, o.stationStatuses[0]));
}

/**
 * autoAdvanceDoneOrders
 *
 * Server-side auto-advance check. Called on every station GET request.
 * Finds orders at `stationId` that have been marked Done for longer than
 * the configured `done_advance_delay_minutes` setting (default 5 min) and
 * moves them to the next station in DB sort-order sequence.
 *
 * No-ops gracefully if:
 *   - The station is the last in sequence
 *   - No done orders have exceeded the delay
 *   - The setting is missing or invalid (falls back to 5 min default)
 */
export async function autoAdvanceDoneOrders(stationId: string): Promise<void> {
  // Read the delay setting (in minutes)
  const delayStr = await getSetting("done_advance_delay_minutes");
  const delayMinutes = delayStr ? parseFloat(delayStr) : 5;
  if (isNaN(delayMinutes) || delayMinutes <= 0) return;

  const delayMs = delayMinutes * 60_000;
  const cutoff = new Date(Date.now() - delayMs).toISOString();

  // Find OrderStationStatus rows at this station where:
  //   done=true AND doneAt is set AND doneAt <= cutoff
  //   AND the order is still at this station (hasn't already been moved)
  const overdueStatuses = await prisma.orderStationStatus.findMany({
    where: {
      station: stationId,
      done: true,
      doneAt: { not: null, lte: cutoff },
      order: { currentStation: stationId },
    },
    select: { orderId: true },
  });

  if (overdueStatuses.length === 0) return;

  // Determine the next station by DB sortOrder
  const stations = await getAllStations(); // active stations, sorted ascending
  const currentIdx = stations.findIndex((s) => s.id === stationId);
  if (currentIdx === -1 || currentIdx === stations.length - 1) return; // not found or last station
  const nextStationId = stations[currentIdx + 1].id;

  const orderIds = overdueStatuses.map((s) => s.orderId);

  // Fetch old-station hold/missing so we can carry them to the new station
  const oldStatuses = await prisma.orderStationStatus.findMany({
    where: { orderId: { in: orderIds }, station: stationId },
    select: { orderId: true, hold: true, holdReason: true, missing: true, missingDetails: true },
  });

  // 1. Move orders to next station AND record which station they came from
  await prisma.$transaction(
    orderIds.map((id) =>
      prisma.order.update({
        where: { id },
        data: {
          currentStation: nextStationId,
          autoAdvancedFrom: stationId,
          autoAdvancedAt: new Date(),
        },
      })
    )
  );

  // 2. Reset done/doneAt at the OLD station (hold/missing stay intact there)
  await prisma.orderStationStatus.updateMany({
    where: { orderId: { in: orderIds }, station: stationId },
    data: { done: false, doneAt: null },
  });

  // 3. Carry hold/missing across to the NEW station so they don't disappear
  for (const os of oldStatuses) {
    if (!os.hold && !os.missing) continue; // nothing to carry
    await prisma.orderStationStatus.upsert({
      where: { orderId_station: { orderId: os.orderId, station: nextStationId } },
      create: {
        orderId: os.orderId,
        station: nextStationId,
        hold: os.hold,
        holdReason: os.holdReason,
        missing: os.missing,
        missingDetails: os.missingDetails,
        done: false,
      },
      update: {
        hold: os.hold,
        holdReason: os.holdReason,
        missing: os.missing,
        missingDetails: os.missingDetails,
      },
    });
  }

  console.log(
    `[autoAdvanceDoneOrders] Advanced ${orderIds.length} order(s) from "${stationId}" → "${nextStationId}"`
  );
}

export async function reorderStationOrders(orderIds: string[]): Promise<void> {
  const updates = orderIds.map((id, index) =>
    prisma.order.update({
      where: { id: Number(id) },
      data: { sortOrder: index },
    })
  );
  await prisma.$transaction(updates);
}

// ─── Settings Functions ─────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key },
  });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getSettings(prefix?: string): Promise<Record<string, string>> {
  const where: any = {};
  if (prefix) {
    where.key = { startsWith: prefix };
  }
  const rows = await prisma.settings.findMany({ where });
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function deleteSetting(key: string): Promise<void> {
  try {
    await prisma.settings.delete({ where: { key } });
  } catch (e) {
    // ignore
  }
}

// ─── Station Summaries ──────────────────────────────────────────

export async function getStationSummaries(): Promise<StationSummary[]> {
  const cutoff = new Date(Date.now() - 30 * 1000).toISOString();

  // Get all stations from DB + fallback
  let dbStations = await getAllStations();
  if (dbStations.length === 0) {
     dbStations = STATIONS.map((s, index) => ({
         id: s,
         label: STATION_LABELS[s],
         description: STATION_DESCRIPTIONS[s],
         sortOrder: index,
         isActive: true,
         createdAt: "",
         updatedAt: ""
     }));
  }

  const summaries: StationSummary[] = [];

  for (const station of dbStations) {
      try {
          // Aggregate via Prisma is tricky with complex conditionals + relations
          // Easier to use groupBy or count or raw query.
          // Let's use simple counts for reliability

          // We need counts of orders AT this station that are NOT deleted
          // And filter out "done > 30s ago"

          // Ideally we'd use a single raw query for performance, but let's stick to Prisma API for safety first.
          // But we can do a Raw query for aggregation speed.

          const result = await prisma.$queryRaw<any[]>`
              SELECT
                 COUNT(*) as total_orders,
                 COALESCE(SUM(CASE WHEN oss.done = true THEN 1 ELSE 0 END), 0) as done_count,
                 COALESCE(SUM(CASE WHEN oss.hold = true THEN 1 ELSE 0 END), 0) as hold_count,
                 COALESCE(SUM(CASE WHEN oss.missing = true THEN 1 ELSE 0 END), 0) as missing_count,
                 COALESCE(SUM(CASE WHEN o.is_rush = true THEN 1 ELSE 0 END), 0) as rush_count
              FROM orders o
              LEFT JOIN order_station_status oss ON o.id = oss.order_id AND oss.station = ${station.id}
              WHERE o.current_station = ${station.id}
                AND (oss.order_id IS NULL OR oss.done = false OR oss.done_at IS NULL OR oss.done_at > ${cutoff})
          `;

          // BigInt handling if return is BigInt
          const row = result[0];

          summaries.push({
              stationId: station.id,
              label: station.label,
              description: station.description,
              sortOrder: station.sortOrder,
              totalOrders: Number(row.total_orders || 0),
              doneCount: Number(row.done_count || 0),
              holdCount: Number(row.hold_count || 0),
              missingCount: Number(row.missing_count || 0),
              rushCount: Number(row.rush_count || 0),
          });
      } catch (error) {
          // If query fails (e.g., empty tables), return zero counts for this station
          console.error(`[getStationSummaries] Error for station ${station.id}:`, error);
          summaries.push({
              stationId: station.id,
              label: station.label,
              description: station.description,
              sortOrder: station.sortOrder,
              totalOrders: 0,
              doneCount: 0,
              holdCount: 0,
              missingCount: 0,
              rushCount: 0,
          });
      }
  }

  return summaries;
}
