import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { parseShowsSearchParams } from "../../utils/showsQuery";
import { showListInclude, mapToShowListItem, excludeKidsWhere, KIDS_GENRE_NAME } from "../showHelpers";
import type { ShowListItem, ShowFilters } from "@/types";

export interface ShowsListData {
  shows: ShowListItem[];
  theatres: string[];
  genres: string[];
  availableGenres: string[];
  filters: ShowFilters;
}

/**
 * Build a Prisma `where` clause from parsed search params.
 */
export function buildWhereClause({
  theatre,
  query,
  genres,
}: {
  theatre: string;
  query: string;
  genres: string[];
}): Prisma.ShowWhereInput {
  const conditions: Prisma.ShowWhereInput[] = [];

  if (theatre) {
    conditions.push({ theatre });
  }

  if (query) {
    const q = query;
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { theatre: { contains: q, mode: "insensitive" as const } },
        {
          genres: {
            some: {
              genre: { name: { contains: q, mode: "insensitive" as const } },
            },
          },
        },
      ],
    });
  }

  if (genres.length > 0) {
    conditions.push({
      genres: {
        some: {
          genre: { name: { in: genres } },
        },
      },
    });
    // When filtering by non-kids genres, exclude kids shows
    if (!genres.includes(KIDS_GENRE_NAME)) {
      conditions.push(excludeKidsWhere);
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Map Prisma sort key to an orderBy clause.
 * Rating sort now uses the denormalized avgRating column — no raw SQL needed.
 */
export function buildOrderBy(sort: string): Prisma.ShowOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ avgRating: { sort: "desc", nulls: "last" } }, { reviewCount: "desc" }, { id: "asc" }];
    case "rating-asc":
      return [{ avgRating: { sort: "asc", nulls: "last" } }, { reviewCount: "desc" }, { id: "asc" }];
    case "reviews":
      return [
        { reviewCount: "desc" },
        { avgRating: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
    default:
      return [{ id: "asc" }];
  }
}

/**
 * Fetch a page of shows. Stats come from denormalized columns — no aggregation query needed.
 */
export async function fetchShowsPage(
  where: Prisma.ShowWhereInput,
  orderBy: Prisma.ShowOrderByWithRelationInput[],
  skip: number,
  take: number,
): Promise<ShowListItem[]> {
  const rawShows = await prisma.show.findMany({
    where,
    include: showListInclude,
    orderBy,
    skip,
    take,
  });

  return rawShows.map(mapToShowListItem);
}

/** Cached: distinct theatre names (stable data, revalidate every 60s). */
const getCachedTheatres = unstable_cache(
  async () => {
    const records = await prisma.show.findMany({
      select: { theatre: true },
      distinct: ["theatre"],
      orderBy: { theatre: "asc" },
    });
    return records.map((t) => t.theatre).filter(Boolean);
  },
  ["theatres"],
  { revalidate: 60 },
);

/** Cached: all genre names (stable data, revalidate every 60s). */
const getCachedGenres = unstable_cache(
  async () => {
    const records = await prisma.genre.findMany({
      orderBy: { name: "asc" },
    });
    return records.map((g) => g.name).filter(Boolean);
  },
  ["genres"],
  { revalidate: 60 },
);

/**
 * Core data fetcher — always hits the database.
 */
export async function fetchShowsForList(
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<ShowsListData> {
  const filters = parseShowsSearchParams(searchParams);
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);

  const perPage = 12;
  const page = filters.page ?? 1;

  // Step 1: count + cached dropdowns in parallel.
  const [total, theatres, genres] = await Promise.all([
    prisma.show.count({ where }),
    getCachedTheatres(),
    getCachedGenres(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const skip = (clampedPage - 1) * perPage;

  // Step 2: fetch shows page + available genres in parallel.
  const baseWhere = buildWhereClause({
    theatre: filters.theatre,
    query: filters.query,
    genres: [],
  });
  const hasBaseFilter = Object.keys(baseWhere).length > 0;

  const [shows, availableGenres] = await Promise.all([
    fetchShowsPage(where, orderBy, skip, perPage),
    hasBaseFilter
      ? prisma.genre
          .findMany({
            where: { shows: { some: { show: baseWhere } } },
            orderBy: { name: "asc" },
          })
          .then((records) => records.map((g) => g.name).filter(Boolean))
      : Promise.resolve(genres),
  ]);

  return {
    shows,
    theatres,
    genres,
    availableGenres,
    filters: { ...filters, page: clampedPage, perPage, total, totalPages },
  };
}

/**
 * Get shows for list page, filtered and sorted by search params.
 * Filter/sort/page combinations go through `unstable_cache`; free-text search
 * queries bypass the cache (unbounded key space, and ~300-row scans are fast).
 */
export async function getShowsForList(
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<ShowsListData> {
  const filters = parseShowsSearchParams(searchParams);

  // Skip cache for free-text search — the key space is unbounded and DB scans
  // on ~300 rows are instant.
  if (filters.query) {
    return fetchShowsForList(searchParams);
  }

  const cacheKey = [
    "shows-list",
    filters.genres.length > 0 ? filters.genres.slice().sort().join(",") : "all",
    filters.theatre || "all",
    filters.sort || "default",
    String(filters.page ?? 1),
  ];

  const cachedFetch = unstable_cache(
    () => fetchShowsForList(searchParams),
    cacheKey,
    { revalidate: 60, tags: ["shows-list"] },
  );

  return cachedFetch();
}
