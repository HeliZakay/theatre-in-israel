import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
import type { ShowListItem } from "@/types";

export interface TheatreStats {
  showCount: number;
  avgRating: number | null;
  totalReviews: number;
  upcomingEventCount: number;
}

export interface TheatrePageData {
  shows: ShowListItem[];
  stats: TheatreStats;
}

async function fetchTheatreData(theatreName: string): Promise<TheatrePageData> {
  const today = new Date(new Date().toDateString());

  const [rawShows, eventCount] = await Promise.all([
    prisma.show.findMany({
      where: { theatre: theatreName },
      include: showListInclude,
      orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    }),
    prisma.event.count({
      where: {
        date: { gte: today },
        show: { theatre: theatreName },
      },
    }),
  ]);

  const shows: ShowListItem[] = rawShows.map((s) => {
    const { genres, ...rest } = s;
    return {
      ...rest,
      genre: genres?.map((sg) => sg.genre.name) ?? [],
    } satisfies ShowListItem;
  });

  const rated = shows.filter((s) => s.avgRating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, s) => sum + s.avgRating!, 0) / rated.length
      : null;
  const totalReviews = shows.reduce((sum, s) => sum + s.reviewCount, 0);

  return {
    shows,
    stats: {
      showCount: shows.length,
      avgRating,
      totalReviews,
      upcomingEventCount: eventCount,
    },
  };
}

export const getTheatreData = unstable_cache(
  (theatreName: string) => fetchTheatreData(theatreName),
  ["theatre-detail"],
  { revalidate: 120, tags: ["shows-list", "events-list"] },
);

/** Fetch summary stats for all theatres (for the index page). */
async function fetchAllTheatreStats(): Promise<
  { name: string; showCount: number; avgRating: number | null; totalReviews: number }[]
> {
  const theatres = await prisma.show.groupBy({
    by: ["theatre"],
    _count: true,
    _avg: { avgRating: true },
    _sum: { reviewCount: true },
    orderBy: { _count: { theatre: "desc" } },
  });

  return theatres.map((t) => ({
    name: t.theatre,
    showCount: t._count,
    avgRating: t._avg.avgRating,
    totalReviews: t._sum.reviewCount ?? 0,
  }));
}

export const getAllTheatreStats = unstable_cache(
  fetchAllTheatreStats,
  ["theatres-list"],
  { revalidate: 120, tags: ["shows-list"] },
);
