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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;

    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  } else {
    // Local / standard PostgreSQL — use the default driver
    globalForPrisma.prisma = new PrismaClient();
  }
}

const prisma = globalForPrisma.prisma;

export default prisma;
