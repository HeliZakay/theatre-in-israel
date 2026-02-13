import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { parseShowsSearchParams } from "../../utils/showsQuery";
import { enrichShow } from "../../utils/showStats";
import { normalizeShow, showInclude } from "../showHelpers";
import type { Show, EnrichedShow, ShowFilters } from "@/types";

export interface ShowsListData {
  shows: EnrichedShow[];
  theatres: string[];
  genres: string[];
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
  // First get all matching IDs via Prisma (for consistent filtering),
  // then sort them by avg rating via raw SQL.
  const matchingShows = await prisma.show.findMany({
    where,
    select: { id: true },
  });

  if (matchingShows.length === 0) return [];

  const ids = matchingShows.map((s) => s.id);

  // Sort by avg rating using raw query. Shows without reviews get
  // NULL avg which sorts last (via COALESCE).
  const sortDirection =
    direction === "ASC" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const sorted = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
    SELECT s.id
    FROM "Show" s
    LEFT JOIN "Review" r ON r."showId" = s.id
    WHERE s.id = ANY(${ids})
    GROUP BY s.id
    ORDER BY COALESCE(AVG(r.rating), 0) ${sortDirection}
    LIMIT ${take} OFFSET ${skip}
    `,
  );

  return sorted.map((r) => r.id);
}

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

  // Get total count for pagination.
  const total = await prisma.show.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const skip = (clampedPage - 1) * perPage;

  let shows: EnrichedShow[];
  const needsRatingSort =
    filters.sort === "rating" || filters.sort === "rating-asc";

  if (needsRatingSort) {
    // Use raw SQL to sort by average rating.
    const direction = filters.sort === "rating-asc" ? "ASC" : "DESC";

    const filteredIds = await getFilteredSortedIds(
      where,
      direction,
      skip,
      perPage,
    );

    if (filteredIds.length > 0) {
      const rawShows = await prisma.show.findMany({
        where: { id: { in: filteredIds } },
        include: showInclude,
      });
      // Preserve sort order from raw query.
      const showMap = new Map(rawShows.map((s) => [s.id, s]));
      shows = filteredIds
        .map((id) => showMap.get(id))
        .filter(Boolean)
        .map((s) => normalizeShow(s!))
        .filter((s): s is Show => s !== null)
        .map(enrichShow);
    } else {
      shows = [];
    }
  } else {
    const rawShows = await prisma.show.findMany({
      where,
      include: showInclude,
      skip,
      take: perPage,
    });
    shows = rawShows
      .map((s) => normalizeShow(s))
      .filter((s): s is Show => s !== null)
      .map(enrichShow);
  }

  // Get distinct theatres and genres for filter dropdowns.
  const [theatreRecords, genreRecords] = await Promise.all([
    prisma.show.findMany({
      select: { theatre: true },
      distinct: ["theatre"],
      orderBy: { theatre: "asc" },
    }),
    prisma.genre.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const theatres = theatreRecords.map((t) => t.theatre).filter(Boolean);
  const genres = genreRecords.map((g) => g.name).filter(Boolean);

  return {
    shows,
    theatres,
    genres,
    filters: { ...filters, page: clampedPage, perPage, total, totalPages },
  };
}
