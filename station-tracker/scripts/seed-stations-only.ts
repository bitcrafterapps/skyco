#!/usr/bin/env tsx

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seed only the stations table for production.
 * This allows the app to function even without any orders.
 */
async function seedStationsOnly() {
  console.log("🌱 Seeding stations...");

  const stations = [
    { id: "basket", label: "Basket", description: "Orders cleared for production", sortOrder: 0 },
    { id: "fabric-cut", label: "Fabric Cut", description: "Fabric Cut done or in process", sortOrder: 1 },
    { id: "extrusions", label: "Extrusions", description: "Metal Cutting coordination", sortOrder: 2 },
    { id: "welding", label: "Welding", description: "Welding done or in process", sortOrder: 3 },
    { id: "assembly", label: "Assembly", description: "Assembly done or in process", sortOrder: 4 },
    { id: "packing", label: "Packing", description: "Done but not yet boxed", sortOrder: 5 },
    { id: "will-call", label: "Will Call", description: "Done but not shipped", sortOrder: 6 },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: { id: station.id },
      update: {},
      create: station,
    });
    console.log(`  ✓ Created/verified station: ${station.label}`);
  }

  console.log("✅ Stations seeded successfully!");
}

seedStationsOnly()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding stations:", error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
