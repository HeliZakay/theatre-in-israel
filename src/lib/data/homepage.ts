import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude } from "../showHelpers";
import type { ShowListItem, Suggestions } from "@/types";
import { GENRE_SECTIONS } from "@/constants/genreGroups";

const DISPLAY_LIMIT = 10;
const FETCH_LIMIT = 40;

export interface FeaturedReview {
  text: string;
  author: string;
}

export interface HeroData {
  suggestions: Suggestions;
  featuredShow: ShowListItem | null;
  featuredReview: FeaturedReview | null;
}

export interface SectionsData {
  topRated: ShowListItem[];
  dramas: ShowListItem[];
  comedies: ShowListItem[];
  musicals: ShowListItem[];
  israeli: ShowListItem[];
  featuredShowId: number | null;
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
  } satisfies ShowListItem;
}

/**
 * Top-rated shows by average review rating.
 * Ties on avg rating are broken by review count (higher wins),
 * then by id for deterministic ordering.
 * Uses the denormalized avgRating column — no raw SQL aggregation needed.
 */
async function getTopRated(): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: { avgRating: { not: null } },
    include: showListInclude,
    orderBy: [
      { avgRating: { sort: "desc", nulls: "last" } },
      { reviewCount: "desc" },
      { id: "asc" },
    ],
    take: FETCH_LIMIT,
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

/**
 * Deduplicate shows across homepage sections so each show appears in at most
 * one section. Sections are processed in priority order. When a section has
 * fewer than `displayLimit` unique shows, it is back-filled from its original
 * list (allowing duplicates across sections) to avoid empty-looking rows.
 */
export function deduplicateSections(
  sections: { key: string; shows: ShowListItem[] }[],
  displayLimit = DISPLAY_LIMIT,
  initialSeenIds: number[] = [],
): Record<string, ShowListItem[]> {
  const seen = new Set<number>(initialSeenIds);
  const result: Record<string, ShowListItem[]> = {};

  for (const { key, shows } of sections) {
    // 1. Collect unique shows (not yet seen) up to displayLimit
    const unique: ShowListItem[] = [];
    for (const show of shows) {
      if (unique.length >= displayLimit) break;
      if (!seen.has(show.id)) {
        unique.push(show);
      }
    }

    // 2. If fewer than displayLimit unique shows, fill from originals
    let selected: ShowListItem[];
    if (unique.length < displayLimit) {
      const uniqueIds = new Set(unique.map((s) => s.id));
      const filler: ShowListItem[] = [];
      for (const show of shows) {
        if (filler.length >= displayLimit - unique.length) break;
        if (!uniqueIds.has(show.id)) {
          filler.push(show);
        }
      }
      selected = [...unique, ...filler];
    } else {
      selected = unique;
    }

    // 3. Mark all selected IDs as seen
    for (const show of selected) {
      seen.add(show.id);
    }

    result[key] = selected;
  }

  return result;
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Lightweight hero data: suggestions + featured show + featured review.
 * Only 3-4 DB queries — fast enough to block initial HTML without hurting TTFB.
 */
async function fetchHeroData(): Promise<HeroData> {
  const [suggestionsResult, topRatedResult] = await Promise.allSettled([
    getSuggestions(),
    getTopRated(),
  ]);

  const emptySuggestions: Suggestions = { shows: [], theatres: [], genres: [] };
  const suggestions = settled(suggestionsResult, emptySuggestions);
  const topRated = settled(topRatedResult, [] as ShowListItem[]);

  const featuredShow = topRated[0] ?? null;

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

  return { suggestions, featuredShow, featuredReview };
}

export const getHeroData = unstable_cache(fetchHeroData, ["homepage-hero"], {
  revalidate: 120,
  tags: ["homepage"],
});

/**
 * Heavier section data: 5 genre/category queries + deduplication.
 * Designed to be called inside a Suspense boundary so it doesn't block initial HTML.
 */
async function fetchSectionsData(): Promise<SectionsData> {
  const [
    topRatedResult,
    dramasResult,
    comediesResult,
    musicalsResult,
    israeliResult,
  ] = await Promise.allSettled([
    getTopRated(),
    getShowsByGenres([...GENRE_SECTIONS.dramas.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.comedies.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.musicals.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.israeli.genres], FETCH_LIMIT),
  ]);

  const topRated = settled(topRatedResult, [] as ShowListItem[]);
  const dramas = settled(dramasResult, [] as ShowListItem[]);
  const comedies = settled(comediesResult, [] as ShowListItem[]);
  const musicals = settled(musicalsResult, [] as ShowListItem[]);
  const israeli = settled(israeliResult, [] as ShowListItem[]);

  const featuredShow = topRated[0] ?? null;
  const featuredShowId = featuredShow?.id ?? null;

  const deduped = deduplicateSections(
    [
      { key: "topRated", shows: topRated },
      { key: "dramas", shows: dramas },
      { key: "comedies", shows: comedies },
      { key: "musicals", shows: musicals },
      { key: "israeli", shows: israeli },
    ],
    DISPLAY_LIMIT,
    featuredShowId ? [featuredShowId] : [],
  );

  return {
    topRated: deduped.topRated,
    dramas: deduped.dramas,
    comedies: deduped.comedies,
    musicals: deduped.musicals,
    israeli: deduped.israeli,
    featuredShowId,
  };
}

export const getSectionsData = unstable_cache(
  fetchSectionsData,
  ["homepage-sections"],
  { revalidate: 120, tags: ["homepage"] },
);

export interface CommunityBannerShow {
  id: number;
  slug: string;
  title: string;
  theatre: string;
}

/**
 * Fetch up to 50 random shows for the CommunityBanner shuffle grid.
 * Results are cached for 300s so the "random" pick rotates every ~5 minutes.
 */
async function fetchCommunityBannerShows(): Promise<CommunityBannerShow[]> {
  const theatres = ["תיאטרון הבימה", "תיאטרון הקאמרי", "תיאטרון בית ליסין"];

  const perTheatre = await Promise.all(
    theatres.map((theatre) =>
      prisma.show.findMany({
        where: { theatre },
        select: { id: true, slug: true, title: true, theatre: true },
      }),
    ),
  );

  const all = perTheatre.flat();

  // Shuffle using Fisher-Yates
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.slice(0, 50);
}

export const getCommunityBannerShows = unstable_cache(
  fetchCommunityBannerShows,
  ["community-banner-shows"],
  { revalidate: 300, tags: ["homepage"] },
);
