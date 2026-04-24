import { PrismaClient } from "@prisma/client";

if (
  !process.env.DATABASE_URL &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/** True when the DATABASE_URL points to a Neon serverless database. */
function isNeonUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!globalForPrisma.prisma) {
  if (isNeonUrl(process.env.DATABASE_URL)) {
    // Lazy-import Neon deps only when actually needed (serverless deploy)
     
    const { neonConfig } = require("@neondatabase/serverless");
     
    const { PrismaNeon } = require("@prisma/adapter-neon");
     
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;

    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  } else {
    // Local / standard PostgreSQL — use the pg driver adapter
     
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
}

const prisma = globalForPrisma.prisma;

export default prisma;
