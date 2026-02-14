import prisma from "./prisma";
import type { WatchlistItem } from "@/types";

/**
 * Get all watchlist items for a user, ordered by createdAt desc.
 * Include show id, title, and theatre.
 */
export async function getWatchlistByUser(
  userId: string,
): Promise<WatchlistItem[]> {
  return prisma.watchlist.findMany({
    where: { userId },
    include: {
      show: {
        select: {
          id: true,
          title: true,
          theatre: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Add a show to user's watchlist.
 * Let Prisma throw P2002 (duplicate) or P2003 (show not found).
 */
export async function addToWatchlist(
  userId: string,
  showId: number,
): Promise<void> {
  await prisma.watchlist.create({
    data: { userId, showId },
  });
}

/**
 * Remove a show from user's watchlist.
 * Use deleteMany for safe "not found" (returns count).
 * Return true if deleted, false if not found.
 */
export async function removeFromWatchlist(
  userId: string,
  showId: number,
): Promise<boolean> {
  const result = await prisma.watchlist.deleteMany({
    where: { userId, showId },
  });
  return result.count > 0;
}

/**
 * Check if a show is in user's watchlist.
 */
export async function isShowInWatchlist(
  userId: string,
  showId: number,
): Promise<boolean> {
  const item = await prisma.watchlist.findUnique({
    where: {
      userId_showId: { userId, showId },
    },
  });
  return item !== null;
}

/**
 * Get just the showIds in a user's watchlist (lightweight).
 */
export async function getWatchlistShowIds(userId: string): Promise<number[]> {
  const items = await prisma.watchlist.findMany({
    where: { userId },
    select: { showId: true },
  });
  return items.map((item) => item.showId);
}
