import prisma from "./prisma";
import { LOTTERY_CONFIG } from "@/constants/lottery";

/**
 * Returns the number of lottery entries (authenticated reviews since campaign start)
 * for a given user.
 */
export async function getLotteryEntriesCount(userId: string): Promise<number> {
  return prisma.review.count({
    where: {
      userId,
      createdAt: { gte: LOTTERY_CONFIG.startDate },
    },
  });
}

/**
 * Returns all participants with their entry counts, ordered by count descending.
 * Used for the admin draw script.
 */
export async function getLotteryLeaderboard(): Promise<
  {
    userId: string;
    name: string | null;
    email: string | null;
    entries: number;
  }[]
> {
  const rows = await prisma.review.groupBy({
    by: ["userId"],
    where: {
      userId: { not: null },
      createdAt: { gte: LOTTERY_CONFIG.startDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  if (rows.length === 0) return [];

  const userIds = rows.map((r) => r.userId).filter(Boolean) as string[];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows
    .filter((r) => r.userId !== null)
    .map((r) => {
      const user = userMap.get(r.userId!);
      return {
        userId: r.userId!,
        name: user?.name ?? null,
        email: user?.email ?? null,
        entries: r._count.id,
      };
    });
}
