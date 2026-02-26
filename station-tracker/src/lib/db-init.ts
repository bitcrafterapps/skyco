import { initDb, isDbEmpty } from "./db";
import { seedDatabase } from "./seed";

let initialized = false;

/**
 * Ensure the database is initialized and seeded (called once on first access).
 * Safe to call multiple times -- only runs once per process.
 */
export async function ensureDbReady(): Promise<void> {
  if (initialized) return;

  initDb();

  if (await isDbEmpty()) {
    console.log("[db-init] Database is empty, seeding with sample data...");
    await seedDatabase();
  } else {
    console.log("[db-init] Database already has data, skipping seed.");
  }

  initialized = true;
}
