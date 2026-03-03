// Station identifiers matching the production flow order
export const STATIONS = [
  "basket",
  "fabric-cut",
  "extrusions",
  "welding",
  "assembly",
  "packing",
  "will-call",
] as const;

export type StationId = (typeof STATIONS)[number];

// Human-readable station names
export const STATION_LABELS: Record<StationId, string> = {
  basket: "Basket",
  "fabric-cut": "Fabric Cut",
  extrusions: "Extrusions",
  welding: "Welding",
  assembly: "Assembly",
  packing: "Packing",
  "will-call": "Will Call",
};

// Station descriptions from the spec
export const STATION_DESCRIPTIONS: Record<StationId, string> = {
  basket: "Orders cleared for production",
  "fabric-cut": "Fabric Cut done or in process",
  extrusions: "Metal Cutting coordination",
  welding: "Welding done or in process",
  assembly: "Assembly done or in process",
  packing: "Done but not yet boxed",
  "will-call": "Done but not shipped",
};

// Order status values from the production sheet
export type OrderStatus =
  | "Producible"
  | "Missing Parts"
  | "Complete"
  | "Complete But M/P"
  | "Scheduling"
  | "Credit Hold"
  | "Sch + M/P"
  | "Tag Team"
  | "Sale Order"
  | "Production Order"
  | "Approved for Production"
  | "Print Hold"
  | "Production Order Printed"
  | "Production Label"
  | "Will Call"
  | "Full Packed"
  | "Part Packed"
  | "Invoiced"
  | "Invoiced (Balance Due)";

// Status at a specific station for an order
export interface OrderStationStatus {
  done: boolean;
  hold: boolean;
  holdReason: string;
  missing: boolean;
  missingDetails: string;
}

// Full order record
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  department: string;
  currentStation: StationId;
  status: OrderStatus;
  isRush: boolean;
  shipDate: string | null;
  saleAmount: number;
  sidemark: string;
  notes: string;
  target: string;
  stationStatuses: Record<StationId, OrderStationStatus>;
  createdAt: string;
  updatedAt: string;
}

// Order as displayed in a station view (flattened for convenience)
export interface StationOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  department: string;
  isRush: boolean;
  shipDate: string | null;
  sidemark: string;
  notes: string;
  done: boolean;
  hold: boolean;
  holdReason: string;
  missing: boolean;
  missingDetails: string;
  // Timestamp when done was toggled on, used for countdown timing
  doneAt: number | null;
  // Station ID this order was auto-advanced from (null if manually placed or never advanced)
  autoAdvancedFrom: string | null;
  // Timestamp when the order was auto-advanced (used to time out the "NEW" pill)
  autoAdvancedAt: number | null;
}

// Station summary for the dashboard
export interface StationSummary {
  stationId: string;
  label: string;
  description: string;
  sortOrder: number;
  totalOrders: number;
  doneCount: number;
  holdCount: number;
  missingCount: number;
  rushCount: number;
}

export interface DbStation {
  id: string;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Toggle field for status updates
export type StatusField = "done" | "hold" | "missing";

// ─── Shared Notes Logic ─────────────────────────────────────────

export interface OrderNoteEntry {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export function formatNoteTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function parseOrderNotes(
  order: Pick<Order, "id" | "notes" | "createdAt" | "updatedAt">
): OrderNoteEntry[] {
  const raw = (order.notes ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as {
      version?: number;
      entries?: Array<{
        id?: string;
        text?: string;
        createdAt?: string;
        updatedAt?: string;
      }>;
    };

    if (Array.isArray(parsed.entries)) {
      return parsed.entries
        .filter((entry) => typeof entry.text === "string" && entry.text.trim().length > 0)
        .map((entry, index) => ({
          id: entry.id && entry.id.trim() ? entry.id : `note-${index}`,
          text: entry.text!.trim(),
          createdAt:
            entry.createdAt && !Number.isNaN(Date.parse(entry.createdAt))
              ? entry.createdAt
              : order.createdAt,
          updatedAt:
            entry.updatedAt && !Number.isNaN(Date.parse(entry.updatedAt))
              ? entry.updatedAt
              : undefined,
        }));
    }
  } catch {
    // Legacy plain-text notes fallback
  }

  return [
    {
      id: `legacy-${order.id}`,
      text: raw,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  ];
}

export function serializeOrderNotes(entries: OrderNoteEntry[]): string {
  return JSON.stringify({
    version: 1,
    entries,
  });
}
