import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { normalize } from "../utils/normalize";
import { parseShowsSearchParams } from "../utils/showsQuery";
import { enrichShow } from "../utils/showStats";
import type { Show, EnrichedShow, Suggestions, ShowFilters } from "@/types";

interface PrismaShowGenre {
  genre: { name: string };
}

/** Standard include clause for fetching full show data. */
const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" as const } },
};

/**
 * Normalize a Prisma show into the flat shape components expect.
 * Converts `genres: ShowGenre[]` → `genre: string[]`.
 */
function normalizeShow(show: Record<string, unknown> | null): Show | null {
  if (!show) return null;
  const { genres, ...rest } = show as Record<string, unknown> & {
    genres?: PrismaShowGenre[];
  };
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
  } as Show;
}

interface HomePageData {
  suggestions: Suggestions;
  topRated: EnrichedShow[];
  latestReviewed: EnrichedShow[];
  comedies: EnrichedShow[];
  musicals: EnrichedShow[];
  israeli: EnrichedShow[];
  featuredShow: EnrichedShow | null;
}

/**
 * Get homepage data: suggestions, top rated, and latest reviewed shows.
 */
export async function getHomePageData(): Promise<HomePageData> {
  // Build autocomplete suggestions from distinct values, grouped by type.
  const [showFields, genreNames] = await Promise.all([
    prisma.show.findMany({ select: { title: true, theatre: true } }),
    prisma.genre.findMany({ select: { name: true } }),
  ]);

  const suggestions = {
    shows: Array.from(new Set(showFields.map((s) => s.title).filter(Boolean))),
    theatres: Array.from(
      new Set(showFields.map((s) => s.theatre).filter(Boolean)),
    ),
    genres: genreNames.map((g) => g.name).filter(Boolean),
  };

  // Top 5 by average rating — raw SQL because Prisma can't orderBy on
  // an aggregate of a relation.
  const topRatedIds = await prisma.$queryRaw<{ id: number }[]>`
    SELECT s.id
    FROM "Show" s
    LEFT JOIN "Review" r ON r."showId" = s.id
    GROUP BY s.id
    HAVING COUNT(r.id) > 0
    ORDER BY AVG(r.rating) DESC
    LIMIT 5
  `;

  const topRatedShows =
    topRatedIds.length > 0
      ? await prisma.show.findMany({
          where: { id: { in: topRatedIds.map((r) => r.id) } },
          include: showInclude,
        })
      : [];

  // Preserve the DB sort order.
  const topRatedMap = new Map(topRatedShows.map((s) => [s.id, s]));
  const topRated = topRatedIds
    .map((r) => topRatedMap.get(r.id))
    .filter(Boolean)
    .map((s) => normalizeShow(s as unknown as Record<string, unknown>))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);

  const featuredShow = topRated[0] ?? null;

  // Latest 6 by most recent review date.
  const latestReviewedIds = await prisma.$queryRaw<{ id: number }[]>`
    SELECT s.id
    FROM "Show" s
    INNER JOIN "Review" r ON r."showId" = s.id
    GROUP BY s.id
    ORDER BY MAX(r.date) DESC
    LIMIT 5
  `;

  const latestReviewedShows =
    latestReviewedIds.length > 0
      ? await prisma.show.findMany({
          where: { id: { in: latestReviewedIds.map((r) => r.id) } },
          include: showInclude,
        })
      : [];

  const latestMap = new Map(latestReviewedShows.map((s) => [s.id, s]));
  const latestReviewed = latestReviewedIds
    .map((r) => latestMap.get(r.id))
    .filter(Boolean)
    .map((s) => normalizeShow(s as unknown as Record<string, unknown>))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);

  const [comedies, musicals, israeli] = await Promise.all([
    getShowsByGenres(["קומדיה", "קומדיות"], 5),
    getShowsByGenres(["מוזיקלי"], 5),
    getShowsByGenres(["ישראלי"], 5),
  ]);

  return {
    suggestions,
    topRated,
    latestReviewed,
    comedies,
    musicals,
    israeli,
    featuredShow,
  };
}

async function getShowsByGenres(
  genreNames: string[],
  limit = 5,
): Promise<EnrichedShow[]> {
  const rawShows = await prisma.show.findMany({
    where: {
      genres: {
        some: {
          genre: { name: { in: genreNames } },
        },
      },
    },
    include: showInclude,
  });

  return rawShows
    .map((s) => normalizeShow(s as unknown as Record<string, unknown>))
    .filter((s): s is Show => s !== null)
    .map(enrichShow)
    .filter((show) => (show.reviews?.length ?? 0) > 0)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, limit);
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

interface ShowsListData {
  shows: EnrichedShow[];
  theatres: string[];
  genres: string[];
  filters: ShowFilters;
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

    // Build WHERE conditions for raw SQL.
    // We need to get the filtered + sorted IDs, then fetch full data.
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
        .map((s) => normalizeShow(s as unknown as Record<string, unknown>))
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
      .map((s) => normalizeShow(s as unknown as Record<string, unknown>))
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
  const sorted = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `
    SELECT s.id
    FROM "Show" s
    LEFT JOIN "Review" r ON r."showId" = s.id
    WHERE s.id = ANY($1)
    GROUP BY s.id
    ORDER BY COALESCE(AVG(r.rating), 0) ${direction === "ASC" ? "ASC" : "DESC"}
    LIMIT $2 OFFSET $3
    `,
    ids,
    take,
    skip,
  );

  return sorted.map((r) => r.id);
}

/**
 * Get a single show by its ID.
 */
export async function getShowById(
  showId: string | number,
): Promise<Show | null> {
  const show = await prisma.show.findUnique({
    where: { id: Number(showId) },
    include: showInclude,
  });
  return normalizeShow(show);
}
