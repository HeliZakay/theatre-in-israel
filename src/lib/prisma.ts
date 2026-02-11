import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  __prismaPool?: Pool;
  prisma?: PrismaClient;
};

if (!globalForPrisma.__prismaPool) {
  globalForPrisma.__prismaPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

const adapter = new PrismaPg(globalForPrisma.__prismaPool);

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma;

export default prisma;
