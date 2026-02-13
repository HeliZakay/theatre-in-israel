import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { enrichShow } from "../../utils/showStats";
import { normalizeShow, showInclude } from "../showHelpers";
import type { Show, EnrichedShow, Suggestions } from "@/types";

export interface HomePageData {
  suggestions: Suggestions;
  topRated: EnrichedShow[];
  dramas: EnrichedShow[];
  comedies: EnrichedShow[];
  musicals: EnrichedShow[];
  israeli: EnrichedShow[];
  featuredShow: EnrichedShow | null;
}

/**
 * Build autocomplete suggestions from distinct show values.
 */
async function getSuggestions(): Promise<Suggestions> {
  const [showFields, genreNames] = await Promise.all([
    prisma.show.findMany({ select: { title: true, theatre: true } }),
    prisma.genre.findMany({ select: { name: true } }),
  ]);

  return {
    shows: Array.from(new Set(showFields.map((s) => s.title).filter(Boolean))),
    theatres: Array.from(
      new Set(showFields.map((s) => s.theatre).filter(Boolean)),
    ),
    genres: genreNames.map((g) => g.name).filter(Boolean),
  };
}

/**
 * Top-rated shows by average review rating (raw SQL for ORDER BY aggregate).
 */
async function getTopRated(): Promise<EnrichedShow[]> {
  const topRatedIds = await prisma.$queryRaw<{ id: number }[]>`
    SELECT s.id
    FROM "Show" s
    LEFT JOIN "Review" r ON r."showId" = s.id
    GROUP BY s.id
    HAVING COUNT(r.id) > 0
    ORDER BY AVG(r.rating) DESC
    LIMIT 10
  `;

  if (topRatedIds.length === 0) return [];

  const topRatedShows = await prisma.show.findMany({
    where: { id: { in: topRatedIds.map((r) => r.id) } },
    include: showInclude,
  });

  // Preserve the DB sort order.
  const topRatedMap = new Map(topRatedShows.map((s) => [s.id, s]));
  return topRatedIds
    .map((r) => topRatedMap.get(r.id))
    .filter(Boolean)
    .map((s) => normalizeShow(s!))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);
}

/**
 * Fetch shows matching any of the given genre names, sorted by average
 * rating at the DB level and limited to `limit` results.
 */
async function getShowsByGenres(
  genreNames: string[],
  limit = 5,
): Promise<EnrichedShow[]> {
  // Sort + limit at the DB level using raw SQL.
  const topIds = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT s.id
      FROM "Show" s
      JOIN "ShowGenre" sg ON sg."showId" = s.id
      JOIN "Genre" g ON g.id = sg."genreId"
      LEFT JOIN "Review" r ON r."showId" = s.id
      WHERE g.name = ANY(${genreNames})
      GROUP BY s.id
      HAVING COUNT(r.id) > 0
      ORDER BY AVG(r.rating) DESC
      LIMIT ${limit}
    `,
  );

  if (topIds.length === 0) return [];

  const rawShows = await prisma.show.findMany({
    where: { id: { in: topIds.map((r) => r.id) } },
    include: showInclude,
  });

  // Preserve DB sort order.
  const showMap = new Map(rawShows.map((s) => [s.id, s]));
  return topIds
    .map((r) => showMap.get(r.id))
    .filter(Boolean)
    .map((s) => normalizeShow(s!))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Get homepage data: suggestions and curated show groups.
 * Uses Promise.allSettled so a single section failure doesn't break the page.
 */
export async function getHomePageData(): Promise<HomePageData> {
  const [
    suggestionsResult,
    topRatedResult,
    dramasResult,
    comediesResult,
    musicalsResult,
    israeliResult,
  ] = await Promise.allSettled([
    getSuggestions(),
    getTopRated(),
    getShowsByGenres(["דרמה", "דרמה קומית", "רגשי"], 10),
    getShowsByGenres(["קומדיה", "קומדיות"], 10),
    getShowsByGenres(["מוזיקלי"], 10),
    getShowsByGenres(["ישראלי"], 10),
  ]);

  const emptySuggestions: Suggestions = { shows: [], theatres: [], genres: [] };

  const suggestions = settled(suggestionsResult, emptySuggestions);
  const topRated = settled(topRatedResult, [] as EnrichedShow[]);
  const dramas = settled(dramasResult, [] as EnrichedShow[]);
  const comedies = settled(comediesResult, [] as EnrichedShow[]);
  const musicals = settled(musicalsResult, [] as EnrichedShow[]);
  const israeli = settled(israeliResult, [] as EnrichedShow[]);

  const featuredShow = topRated[0] ?? null;

  return {
    suggestions,
    topRated,
    dramas,
    comedies,
    musicals,
    israeli,
    featuredShow,
  };
}
