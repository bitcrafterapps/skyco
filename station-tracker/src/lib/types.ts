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
  // Timestamp when done was toggled on, used for fade-out timing
  doneAt: number | null;
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
