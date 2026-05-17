import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const excluded = [
  "tatyanaa@walla.com",
  "tzurit4@gmail.com",
  "amit-d-e@013.net",
  "guyholl1@gmail.com",
  "irisshahaf77@gmail.com",
  "yoholo51@gmail.com",
];

const users = await prisma.user.findMany({
  where: { email: { not: null, notIn: excluded }, reviews: { some: {} } },
  select: { email: true },
  orderBy: { email: "asc" },
});

console.log(users.map((u) => u.email).join("\n"));
console.log("---");
console.log("Total:", users.length);

await prisma.$disconnect();
