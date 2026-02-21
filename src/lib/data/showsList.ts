import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { parseShowsSearchParams } from "../../utils/showsQuery";
import { fetchShowListItems, showListInclude } from "../showHelpers";
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
function buildWhereClause({
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
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Get filtered show IDs sorted by average rating using raw SQL,
 * then apply pagination.
 */
async function getFilteredSortedIds(
  where: Prisma.ShowWhereInput,
  direction: string,
  skip: number,
  take: number,
): Promise<number[]> {
  // Get matching IDs via Prisma (for consistent relation filtering),
  // then sort by avg rating via raw SQL.
  const matchingShows = await prisma.show.findMany({
    where,
    select: { id: true },
  });

  if (matchingShows.length === 0) return [];

  const ids = matchingShows.map((s) => s.id);

  const sortDirection =
    direction === "ASC" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const sorted = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
    SELECT s.id
    FROM "Show" s
    LEFT JOIN "Review" r ON r."showId" = s.id
    WHERE s.id = ANY(${ids})
    GROUP BY s.id
    ORDER BY COALESCE(AVG(r.rating), 0) ${sortDirection}, s.id ASC
    LIMIT ${take} OFFSET ${skip}
    `,
  );

  return sorted.map((r) => r.id);
}

/**
 * Fetch a page of shows without loading reviews.
 * Computes avgRating and reviewCount via a single raw SQL aggregation.
 */
async function fetchShowsPage(
  where: Prisma.ShowWhereInput,
  skip: number,
  take: number,
): Promise<ShowListItem[]> {
  const rawShows = await prisma.show.findMany({
    where,
    include: showListInclude,
    orderBy: { id: "asc" },
    skip,
    take,
  });

  if (rawShows.length === 0) return [];

  const ids = rawShows.map((s) => s.id);

  const stats = await prisma.$queryRawUnsafe<
    { showId: number; avgRating: number; reviewCount: number }[]
  >(
    `SELECT "showId", AVG(rating)::float AS "avgRating", COUNT(*)::int AS "reviewCount" FROM "Review" WHERE "showId" = ANY($1) GROUP BY "showId"`,
    ids,
  );

  const statsMap = new Map(stats.map((s) => [s.showId, s]));

  return rawShows.map((s) => {
    const { genres, ...rest } = s;
    const stat = statsMap.get(s.id);
    return {
      ...rest,
      genre: genres?.map((sg) => sg.genre.name) ?? [],
      avgRating: stat?.avgRating ?? null,
      reviewCount: stat?.reviewCount ?? 0,
    } as ShowListItem;
  });
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
 * Get shows for list page, filtered and sorted by search params.
 */
export async function getShowsForList(
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<ShowsListData> {
  const filters = parseShowsSearchParams(searchParams);
  const where = buildWhereClause(filters);

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
  const needsRatingSort =
    filters.sort === "rating" || filters.sort === "rating-asc";

  const baseWhere = buildWhereClause({
    theatre: filters.theatre,
    query: filters.query,
    genres: [],
  });
  const hasBaseFilter = Object.keys(baseWhere).length > 0;

  const [shows, availableGenres] = await Promise.all([
    needsRatingSort
      ? getFilteredSortedIds(
          where,
          filters.sort === "rating-asc" ? "ASC" : "DESC",
          skip,
          perPage,
        ).then((ids) => fetchShowListItems(ids))
      : fetchShowsPage(where, skip, perPage),
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
