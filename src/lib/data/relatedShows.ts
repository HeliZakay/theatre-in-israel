import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
import type { ShowListItem } from "@/types";

const RELATED_LIMIT = 10;

/**
 * Map a Prisma show (with genres relation via showListInclude) to ShowListItem.
 */
function mapToShowListItem(
  show: Awaited<
    ReturnType<typeof prisma.show.findMany<{ include: typeof showListInclude }>>
  >[number],
): ShowListItem {
  const { genres, ...rest } = show;
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
  } satisfies ShowListItem;
}

/**
 * Fetch other shows from the same theatre, excluding the current show.
 * Sorted by average rating (highest first) so the carousel leads with quality.
 */
async function fetchShowsByTheatre(
  theatre: string,
  excludeId: number,
  limit = RELATED_LIMIT,
): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: {
      theatre,
      id: { not: excludeId },
    },
    include: showListInclude,
    orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: limit,
  });

  return shows.map(mapToShowListItem);
}

/**
 * Fetch shows that share at least one genre with the current show,
 * excluding the current show itself.
 * Sorted by average rating (highest first).
 */
async function fetchSimilarShowsByGenres(
  genreNames: string[],
  excludeId: number,
  limit = RELATED_LIMIT,
): Promise<ShowListItem[]> {
  if (genreNames.length === 0) return [];

  const shows = await prisma.show.findMany({
    where: {
      id: { not: excludeId },
      genres: {
        some: {
          genre: { name: { in: genreNames } },
        },
      },
    },
    include: showListInclude,
    orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: limit,
  });

  return shows.map(mapToShowListItem);
}

/**
 * Cached wrapper: shows from the same theatre.
 * Cache key includes theatre name and excluded show ID.
 */
export const getRelatedByTheatre = unstable_cache(
  fetchShowsByTheatre,
  ["related-theatre"],
  { revalidate: 120, tags: ["shows"] },
);

/**
 * Cached wrapper: shows with shared genres.
 * Cache key includes genre names and excluded show ID.
 */
export const getRelatedByGenres = unstable_cache(
  fetchSimilarShowsByGenres,
  ["related-genres"],
  { revalidate: 120, tags: ["shows"] },
);
