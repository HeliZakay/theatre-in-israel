import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
import type { ShowListItem, Suggestions } from "@/types";

export interface FeaturedReview {
  text: string;
  author: string;
}

export interface HomePageData {
  suggestions: Suggestions;
  topRated: ShowListItem[];
  dramas: ShowListItem[];
  comedies: ShowListItem[];
  musicals: ShowListItem[];
  israeli: ShowListItem[];
  featuredShow: ShowListItem | null;
  featuredReview: FeaturedReview | null;
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
  } as ShowListItem;
}

/**
 * Top-rated shows by average review rating.
 * Uses the denormalized avgRating column — no raw SQL aggregation needed.
 */
async function getTopRated(): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: { avgRating: { not: null } },
    include: showListInclude,
    orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: 10,
  });

  return shows.map(mapToShowListItem);
}

/**
 * Fetch shows whose **first** (principal) genre matches any of the given
 * names, sorted by average rating and limited to `limit` results.
 * Uses denormalized avgRating column — no raw SQL aggregation needed.
 */
async function getShowsByGenres(
  genreNames: string[],
  limit = 5,
): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: {
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

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Get homepage data: suggestions and curated show groups.
 * Uses Promise.allSettled so a single section failure doesn't break the page.
 */
async function fetchHomePageData(): Promise<HomePageData> {
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
    getShowsByGenres(["דרמה", "דרמה קומית", "מרגש"], 10),
    getShowsByGenres(["קומדיה", "קומדיה שחורה", "סאטירה"], 10),
    getShowsByGenres(["מוזיקלי", "מחזמר"], 10),
    getShowsByGenres(["ישראלי"], 10),
  ]);

  const emptySuggestions: Suggestions = { shows: [], theatres: [], genres: [] };

  const suggestions = settled(suggestionsResult, emptySuggestions);
  const topRated = settled(topRatedResult, [] as ShowListItem[]);
  const dramas = settled(dramasResult, [] as ShowListItem[]);
  const comedies = settled(comediesResult, [] as ShowListItem[]);
  const musicals = settled(musicalsResult, [] as ShowListItem[]);
  const israeli = settled(israeliResult, [] as ShowListItem[]);

  const featuredShow = topRated[0] ?? null;

  // Fetch the best review for the featured show (single targeted query).
  let featuredReview: FeaturedReview | null = null;
  if (featuredShow) {
    const bestReview = await prisma.review.findFirst({
      where: { showId: featuredShow.id },
      orderBy: { rating: "desc" },
      select: { text: true, author: true },
    });
    if (bestReview) {
      featuredReview = { text: bestReview.text, author: bestReview.author };
    }
  }

  return {
    suggestions,
    topRated,
    dramas,
    comedies,
    musicals,
    israeli,
    featuredShow,
    featuredReview,
  };
}

export const getHomePageData = unstable_cache(
  fetchHomePageData,
  ["homepage-data"],
  { revalidate: 120, tags: ["homepage"] },
);
