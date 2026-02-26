
import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // earlyAccess: true,
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
      url: process.env.DATABASE_URL,
  },
});
