
import { prisma } from "./db";
import type { StationId, OrderStatus } from "./types";
import { STATIONS } from "./types";

interface SeedOrder {
  order_number: string;
  customer_name: string;
  department: string;
  current_station: StationId;
  status: OrderStatus;
  is_rush: boolean;
  ship_date: string | null;
  sale_amount: number;
  sidemark: string;
  notes: string;
  target: string;
  stationOverrides?: Partial<
    Record<
      StationId,
      {
        done?: boolean;
        hold?: boolean;
        hold_reason?: string;
        missing?: boolean;
        missing_details?: string;
      }
    >
  >;
}

const SEED_ORDERS: SeedOrder[] = [
  // ─── BASKET station orders ───────────────────────────────────
  {
    order_number: "200901",
    customer_name: "DESERT WINDOW TREATMENTS",
    department: "Roller Shade",
    current_station: "basket",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-18",
    sale_amount: 3245.0,
    sidemark: "SMITH RESIDENCE",
    notes: "Rush - customer needs by Friday",
    target: "2/18",
  },
  {
    order_number: "200850",
    customer_name: "IDEAL GLASS TINTING",
    department: "Exterior",
    current_station: "basket",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-20",
    sale_amount: 1580.0,
    sidemark: "JOHNSON APT 4B",
    notes: "",
    target: "2/20",
  },
  {
    order_number: "200777",
    customer_name: "COAST WINDOW FASHIONS",
    department: "Roller Shade",
    current_station: "basket",
    status: "Approved for Production",
    is_rush: false,
    ship_date: "2025-02-22",
    sale_amount: 2100.5,
    sidemark: "MILLER OFFICE",
    notes: "",
    target: "2/22",
  },
  {
    order_number: "200650",
    customer_name: "BRITE BLINDS INC",
    department: "Roller Shade",
    current_station: "basket",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-24",
    sale_amount: 890.0,
    sidemark: "GARCIA HOME",
    notes: "",
    target: "2/24",
  },
  {
    order_number: "200610",
    customer_name: "VISTA INTERIOR PRODUCTS",
    department: "Exterior",
    current_station: "basket",
    status: "Scheduling",
    is_rush: false,
    ship_date: "2025-02-25",
    sale_amount: 4320.0,
    sidemark: "PARK PLAZA HOTEL",
    notes: "Large commercial order",
    target: "2/25",
  },

  // ─── FABRIC CUT station orders ───────────────────────────────
  {
    order_number: "200540",
    customer_name: "BURRIS WINDOW SHADES",
    department: "Roller Shade",
    current_station: "fabric-cut",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-17",
    sale_amount: 2750.0,
    sidemark: "CHEN CONDO",
    notes: "Rush - expedite fabric cutting",
    target: "2/17",
  },
  {
    order_number: "200430",
    customer_name: "SMITH DRAPERY",
    department: "Roller Shade",
    current_station: "fabric-cut",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-19",
    sale_amount: 1200.0,
    sidemark: "TORRES HOUSE",
    notes: "",
    target: "2/19",
  },
  {
    order_number: "200320",
    customer_name: "BLU-ECO INC",
    department: "Exterior",
    current_station: "fabric-cut",
    status: "Missing Parts",
    is_rush: false,
    ship_date: "2025-02-21",
    sale_amount: 3400.0,
    sidemark: "RIVERSIDE MALL",
    notes: "Waiting on sunbrella fabric #4620",
    target: "2/21",
    stationOverrides: {
      "fabric-cut": {
        missing: true,
        missing_details: "Sunbrella fabric #4620 on backorder, ETA 2/19",
      },
    },
  },
  {
    order_number: "200280",
    customer_name: "WINDOW SHADES EAST",
    department: "Roller Shade",
    current_station: "fabric-cut",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-23",
    sale_amount: 670.0,
    sidemark: "WONG RESIDENCE",
    notes: "",
    target: "2/23",
  },
  {
    order_number: "200210",
    customer_name: "ASHLEY'S WINDOW COVERINGS",
    department: "Roller Shade",
    current_station: "fabric-cut",
    status: "Credit Hold",
    is_rush: false,
    ship_date: "2025-02-25",
    sale_amount: 1890.0,
    sidemark: "BAKER BUILDING",
    notes: "Credit hold - pending payment",
    target: "2/25",
    stationOverrides: {
      "fabric-cut": {
        hold: true,
        hold_reason: "Credit hold - awaiting payment",
      },
    },
  },

  // ─── EXTRUSIONS station orders ───────────────────────────────
  {
    order_number: "200100",
    customer_name: "EXPERT WINDOW",
    department: "Exterior",
    current_station: "extrusions",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-16",
    sale_amount: 5200.0,
    sidemark: "HILTON DOWNTOWN",
    notes: "Rush - hotel renovation deadline",
    target: "2/16",
  },
  {
    order_number: "199990",
    customer_name: "SESMA DRAPERY",
    department: "Roller Shade",
    current_station: "extrusions",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-18",
    sale_amount: 960.0,
    sidemark: "MARTINEZ HOME",
    notes: "",
    target: "2/18",
  },
  {
    order_number: "199880",
    customer_name: "DESERT WINDOW TREATMENTS",
    department: "Exterior",
    current_station: "extrusions",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-20",
    sale_amount: 2340.0,
    sidemark: "SUNRISE APTS",
    notes: "",
    target: "2/20",
  },
  {
    order_number: "199770",
    customer_name: "COAST WINDOW FASHIONS",
    department: "Roller Shade",
    current_station: "extrusions",
    status: "Missing Parts",
    is_rush: false,
    ship_date: "2025-02-22",
    sale_amount: 1450.0,
    sidemark: "LEE OFFICE PARK",
    notes: "Missing aluminum extrusion profile #AL-88",
    target: "2/22",
    stationOverrides: {
      extrusions: {
        missing: true,
        missing_details:
          "Aluminum extrusion profile #AL-88 - supplier delayed",
      },
    },
  },

  // ─── WELDING station orders ──────────────────────────────────
  {
    order_number: "199650",
    customer_name: "BRITE BLINDS INC",
    department: "Exterior",
    current_station: "welding",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-15",
    sale_amount: 7800.0,
    sidemark: "CITY HALL WEST",
    notes: "Rush - government project deadline",
    target: "2/15",
  },
  {
    order_number: "199544",
    customer_name: "IDEAL GLASS TINTING",
    department: "Roller Shade",
    current_station: "welding",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-17",
    sale_amount: 2100.0,
    sidemark: "PATEL RESIDENCE",
    notes: "",
    target: "2/17",
  },
  {
    order_number: "199430",
    customer_name: "BURRIS WINDOW SHADES",
    department: "Exterior",
    current_station: "welding",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-19",
    sale_amount: 3200.0,
    sidemark: "HARBOR VIEW",
    notes: "",
    target: "2/19",
  },
  {
    order_number: "199320",
    customer_name: "SMITH DRAPERY",
    department: "Roller Shade",
    current_station: "welding",
    status: "Complete But M/P",
    is_rush: false,
    ship_date: "2025-02-21",
    sale_amount: 1100.0,
    sidemark: "KIM TOWNHOUSE",
    notes: "Welding done but missing bracket kit",
    target: "2/21",
    stationOverrides: {
      welding: {
        done: true,
        missing: true,
        missing_details: "Bracket kit #BK-44 not received",
      },
    },
  },

  // ─── ASSEMBLY station orders ─────────────────────────────────
  {
    order_number: "199200",
    customer_name: "WINDOW SHADES EAST",
    department: "Roller Shade",
    current_station: "assembly",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-14",
    sale_amount: 4500.0,
    sidemark: "GRAND HOTEL",
    notes: "Rush - install date confirmed",
    target: "2/14",
  },
  {
    order_number: "199100",
    customer_name: "ASHLEY'S WINDOW COVERINGS",
    department: "Roller Shade",
    current_station: "assembly",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-16",
    sale_amount: 1650.0,
    sidemark: "DAVIS HOUSE",
    notes: "",
    target: "2/16",
  },
  {
    order_number: "198990",
    customer_name: "EXPERT WINDOW",
    department: "Exterior",
    current_station: "assembly",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-18",
    sale_amount: 2800.0,
    sidemark: "OCEAN TOWERS",
    notes: "",
    target: "2/18",
  },
  {
    order_number: "198880",
    customer_name: "SESMA DRAPERY",
    department: "Roller Shade",
    current_station: "assembly",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-20",
    sale_amount: 750.0,
    sidemark: "NGUYEN HOME",
    notes: "",
    target: "2/20",
    stationOverrides: {
      assembly: { hold: true, hold_reason: "Waiting for QC approval" },
    },
  },
  {
    order_number: "198770",
    customer_name: "VISTA INTERIOR PRODUCTS",
    department: "Exterior",
    current_station: "assembly",
    status: "Missing Parts",
    is_rush: false,
    ship_date: "2025-02-22",
    sale_amount: 3100.0,
    sidemark: "LAKEVIEW CONDOS",
    notes: "Missing motor assembly",
    target: "2/22",
    stationOverrides: {
      assembly: {
        missing: true,
        missing_details: "Motor assembly MA-200 on backorder",
      },
    },
  },

  // ─── PACKING station orders ──────────────────────────────────
  {
    order_number: "198650",
    customer_name: "DESERT WINDOW TREATMENTS",
    department: "Roller Shade",
    current_station: "packing",
    status: "Full Packed",
    is_rush: true,
    ship_date: "2025-02-14",
    sale_amount: 1800.0,
    sidemark: "BROWN APT",
    notes: "Rush - ship today",
    target: "2/14",
  },
  {
    order_number: "198540",
    customer_name: "COAST WINDOW FASHIONS",
    department: "Roller Shade",
    current_station: "packing",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-15",
    sale_amount: 2200.0,
    sidemark: "WILSON OFFICE",
    notes: "",
    target: "2/15",
  },
  {
    order_number: "198430",
    customer_name: "BLU-ECO INC",
    department: "Exterior",
    current_station: "packing",
    status: "Part Packed",
    is_rush: false,
    ship_date: "2025-02-17",
    sale_amount: 4100.0,
    sidemark: "TECH PARK BLDG A",
    notes: "Partial - 6 of 10 units packed",
    target: "2/17",
    stationOverrides: {
      packing: {
        missing: true,
        missing_details: "4 units still in assembly",
      },
    },
  },
  {
    order_number: "198320",
    customer_name: "BRITE BLINDS INC",
    department: "Roller Shade",
    current_station: "packing",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-19",
    sale_amount: 990.0,
    sidemark: "TAYLOR HOUSE",
    notes: "",
    target: "2/19",
  },

  // ─── WILL CALL station orders ────────────────────────────────
  {
    order_number: "198200",
    customer_name: "IDEAL GLASS TINTING",
    department: "Exterior",
    current_station: "will-call",
    status: "Will Call",
    is_rush: false,
    ship_date: "2025-02-13",
    sale_amount: 1350.0,
    sidemark: "SANCHEZ HOME",
    notes: "Customer picking up Friday AM",
    target: "2/13",
  },
  {
    order_number: "198100",
    customer_name: "BURRIS WINDOW SHADES",
    department: "Roller Shade",
    current_station: "will-call",
    status: "Will Call",
    is_rush: false,
    ship_date: "2025-02-12",
    sale_amount: 2400.0,
    sidemark: "CAMPBELL ESTATE",
    notes: "Will call - customer notified",
    target: "2/12",
  },
  {
    order_number: "197980",
    customer_name: "SMITH DRAPERY",
    department: "Exterior",
    current_station: "will-call",
    status: "Will Call",
    is_rush: false,
    ship_date: "2025-02-11",
    sale_amount: 5600.0,
    sidemark: "EMBASSY SUITES",
    notes: "Large order - needs freight pickup",
    target: "2/11",
  },
  {
    order_number: "194100",
    customer_name: "ASHLEY'S WINDOW COVERINGS",
    department: "Roller Shade",
    current_station: "will-call",
    status: "Will Call",
    is_rush: false,
    ship_date: "2025-02-10",
    sale_amount: 780.0,
    sidemark: "REEVES CONDO",
    notes: "Awaiting customer pickup",
    target: "2/10",
  },

  // ─── Additional orders for fuller data ───────────────────────
  {
    order_number: "200950",
    customer_name: "EXPERT WINDOW",
    department: "Roller Shade",
    current_station: "basket",
    status: "Producible",
    is_rush: true,
    ship_date: "2025-02-16",
    sale_amount: 6200.0,
    sidemark: "MARRIOTT RENOVATION",
    notes: "Rush - 48hr turnaround requested",
    target: "2/16",
  },
  {
    order_number: "200004",
    customer_name: "SESMA DRAPERY",
    department: "Exterior",
    current_station: "extrusions",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-24",
    sale_amount: 1780.0,
    sidemark: "ROSENBERG HOUSE",
    notes: "",
    target: "2/24",
  },
  {
    order_number: "199700",
    customer_name: "VISTA INTERIOR PRODUCTS",
    department: "Roller Shade",
    current_station: "welding",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-23",
    sale_amount: 3450.0,
    sidemark: "SUNSET PLAZA",
    notes: "",
    target: "2/23",
  },
  {
    order_number: "198900",
    customer_name: "WINDOW SHADES EAST",
    department: "Exterior",
    current_station: "assembly",
    status: "Producible",
    is_rush: false,
    ship_date: "2025-02-24",
    sale_amount: 2650.0,
    sidemark: "FEDERAL BLDG",
    notes: "",
    target: "2/24",
  },
];

/**
 * Seed the database with realistic sample data.
 * Inserts orders and creates station status rows for every station per order.
 */
export async function seedDatabase(): Promise<void> {
  const count = await prisma.order.count();
  if (count > 0) {
    console.log("[seed] Database already seeded.");
    return;
  }

  console.log("[seed] Seeding database...");

  // Default stations
  const defaultStations = [
    { id: "basket", label: "Basket", description: "Orders cleared for production", sortOrder: 0 },
    { id: "fabric-cut", label: "Fabric Cut", description: "Fabric Cut done or in process", sortOrder: 1 },
    { id: "extrusions", label: "Extrusions", description: "Metal Cutting coordination", sortOrder: 2 },
    { id: "welding", label: "Welding", description: "Welding done or in process", sortOrder: 3 },
    { id: "assembly", label: "Assembly", description: "Assembly done or in process", sortOrder: 4 },
    { id: "packing", label: "Packing", description: "Done but not yet boxed", sortOrder: 5 },
    { id: "will-call", label: "Will Call", description: "Done but not shipped", sortOrder: 6 },
  ];

  for (const s of defaultStations) {
    await prisma.station.upsert({
      where: { id: s.id },
      update: {},
      create: s
    });
  }

  for (const order of SEED_ORDERS) {
    await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
         data: {
             orderNumber: order.order_number,
             customerName: order.customer_name,
             department: order.department,
             currentStation: order.current_station,
             status: order.status,
             isRush: order.is_rush,
             shipDate: order.ship_date,
             saleAmount: order.sale_amount,
             sidemark: order.sidemark,
             notes: order.notes,
             target: order.target,
         }
      });

      // Statuses
      const statusData = STATIONS.map(station => {
          const overrides = order.stationOverrides?.[station] ?? {};
          return {
              orderId: createdOrder.id,
              station,
              done: overrides.done ?? false,
              doneAt: overrides.done ? new Date().toISOString() : null,
              hold: overrides.hold ?? false,
              holdReason: overrides.hold_reason ?? "",
              missing: overrides.missing ?? false,
              missingDetails: overrides.missing_details ?? ""
          };
      });

      await tx.orderStationStatus.createMany({
          data: statusData
      });
    });
  }

  console.log(`[seed] Inserted ${SEED_ORDERS.length} orders with station statuses.`);
}

// Allow running directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
