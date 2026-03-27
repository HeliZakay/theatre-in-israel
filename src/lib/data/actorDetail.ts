import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude, mapToShowListItem, calculateShowsStats } from "../showHelpers";
import type { ShowListItem } from "@/types";

export interface ActorStats {
  showCount: number;
  avgRating: number | null;
  totalReviews: number;
}

export interface ActorPageData {
  shows: ShowListItem[];
  stats: ActorStats;
}

async function fetchActorData(actorName: string): Promise<ActorPageData> {
  const rawShows = await prisma.show.findMany({
    where: { actors: { some: { actor: { name: actorName } } } },
    include: showListInclude,
    orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
  });

  const shows: ShowListItem[] = rawShows.map(mapToShowListItem);
  const { avgRating, totalReviews } = calculateShowsStats(shows);

  return {
    shows,
    stats: {
      showCount: shows.length,
      avgRating,
      totalReviews,
    },
  };
}

export const getActorData = unstable_cache(
  (actorName: string) => fetchActorData(actorName),
  ["actor-detail"],
  { revalidate: 120, tags: ["shows-list"] },
);

/** Fetch summary stats for all actors (for the index page). */
async function fetchAllActorStats(): Promise<
  { name: string; showCount: number; avgRating: number | null; totalReviews: number }[]
> {
  const actors = await prisma.actor.findMany({
    select: {
      name: true,
      shows: {
        select: {
          show: {
            select: { avgRating: true, reviewCount: true },
          },
        },
      },
    },
  });

  return actors.map((a) => {
    const shows = a.shows.map((sa) => sa.show);
    const { avgRating, totalReviews } = calculateShowsStats(shows);
    return {
      name: a.name,
      showCount: shows.length,
      avgRating,
      totalReviews,
    };
  });
}

export const getAllActorStats = unstable_cache(
  fetchAllActorStats,
  ["actors-list"],
  { revalidate: 120, tags: ["shows-list"] },
);
