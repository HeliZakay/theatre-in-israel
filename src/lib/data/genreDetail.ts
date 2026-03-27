import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude, mapToShowListItem, calculateShowsStats, excludeKidsWhere, KIDS_GENRE_NAME } from "../showHelpers";
import type { ShowListItem } from "@/types";

export interface GenreStats {
  showCount: number;
  avgRating: number | null;
  totalReviews: number;
}

export interface GenrePageData {
  shows: ShowListItem[];
  stats: GenreStats;
}

async function fetchGenreData(genreName: string): Promise<GenrePageData> {
  const rawShows = await prisma.show.findMany({
    where: {
      AND: [
        { genres: { some: { genre: { name: genreName } } } },
        ...(genreName !== KIDS_GENRE_NAME ? [excludeKidsWhere] : []),
      ],
    },
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

export const getGenreData = unstable_cache(
  (genreName: string) => fetchGenreData(genreName),
  ["genre-detail"],
  { revalidate: 120, tags: ["shows-list"] },
);

/** Fetch summary stats for all genres (for the index page). */
async function fetchAllGenreStats(): Promise<
  { name: string; showCount: number; avgRating: number | null; totalReviews: number }[]
> {
  const genres = await prisma.genre.findMany({
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

  return genres.map((g) => {
    const shows = g.shows.map((sg) => sg.show);
    const { avgRating, totalReviews } = calculateShowsStats(shows);
    return {
      name: g.name,
      showCount: shows.length,
      avgRating,
      totalReviews,
    };
  });
}

export const getAllGenreStats = unstable_cache(
  fetchAllGenreStats,
  ["genres-list"],
  { revalidate: 120, tags: ["shows-list"] },
);
