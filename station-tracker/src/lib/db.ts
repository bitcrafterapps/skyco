
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.DATABASE_URL}`;

// Initialize global connection (singleton) for Next.js hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma Client with PG adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * @deprecated - Use `prisma` directly instead.
 */
export function getDb() {
  throw new Error("getDb() has been replaced by Prisma client. Do not use.");
}

/**
 * @deprecated - Do not use. Prisma initializes itself.
 */
export function initDb() {
  // No-op
}

/**
 * @deprecated - Use Prisma count queries instead.
 */
export async function isDbEmpty() {
  const count = await prisma.order.count();
  return count === 0;
}
