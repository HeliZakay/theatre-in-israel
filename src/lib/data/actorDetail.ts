import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
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
    const rated = shows.filter((s) => s.avgRating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, s) => sum + s.avgRating!, 0) / rated.length
        : null;
    return {
      name: a.name,
      showCount: shows.length,
      avgRating,
      totalReviews: shows.reduce((sum, s) => sum + s.reviewCount, 0),
    };
  });
}

export const getAllActorStats = unstable_cache(
  fetchAllActorStats,
  ["actors-list"],
  { revalidate: 120, tags: ["shows-list"] },
);
