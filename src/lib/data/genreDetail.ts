import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
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
    where: { genres: { some: { genre: { name: genreName } } } },
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
    const rated = shows.filter((s) => s.avgRating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, s) => sum + s.avgRating!, 0) / rated.length
        : null;
    return {
      name: g.name,
      showCount: shows.length,
      avgRating,
      totalReviews: shows.reduce((sum, s) => sum + s.reviewCount, 0),
    };
  });
}

export const getAllGenreStats = unstable_cache(
  fetchAllGenreStats,
  ["genres-list"],
  { revalidate: 120, tags: ["shows-list"] },
);
