import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import {
  showListInclude,
  mapToShowListItem,
  excludeKidsWhere,
  KIDS_GENRE_NAME,
} from "../showHelpers";
import type { ShowListItem, Suggestions, LatestReviewItem } from "@/types";
import type { EventListItem } from "./eventsList";
import { GENRE_SECTIONS } from "@/constants/genreGroups";
import { FEATURED_SHOW_SLUG } from "@/constants/featuredShow";
import { NEW_SHOW_MAX_REVIEWS } from "@/constants/newShows";
import { getNewShowCutoffDate } from "@/lib/shows/isNew";
import { getSuggestions } from "./suggestions";

const DISPLAY_LIMIT = 10;
// Over-fetch to have enough candidates after deduplication across sections
// (e.g., a show in "top rated" is excluded from genre carousels).
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
  kids: ShowListItem[];
  newShows: ShowListItem[];
  featuredShowId: number | null;
}

const NEW_SHOWS_DISPLAY_LIMIT = 12;

/**
 * Top shows by review count (most-reviewed first).
 * Ties on review count are broken by avg rating (higher wins),
 * then by id for deterministic ordering.
 * Uses denormalized columns — no raw SQL aggregation needed.
 */
async function getTopRated(): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: { avgRating: { not: null }, reviewCount: { gte: 15 }, ...excludeKidsWhere },
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
 * names, sorted by review count (most-reviewed first), then avg rating,
 * and limited to `limit` results.
 * Uses denormalized columns — no raw SQL aggregation needed.
 */
async function getShowsByGenres(
  genreNames: string[],
  limit = 5,
): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: {
      AND: [
        { genres: { some: { genre: { name: { in: genreNames } } } } },
        excludeKidsWhere,
      ],
    },
    include: showListInclude,
    orderBy: [{ reviewCount: "desc" }, { avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: limit,
  });

  return shows.map(mapToShowListItem);
}

/**
 * Fetch kids shows — deliberately omits excludeKidsWhere since we *want* kids.
 */
/**
 * Recently added shows that haven't yet earned their first reviews.
 * Mirrors the isShowNew() rule used by the per-card badge.
 */
async function getNewShows(
  limit = NEW_SHOWS_DISPLAY_LIMIT,
): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: {
      createdAt: { gte: getNewShowCutoffDate() },
      reviewCount: { lt: NEW_SHOW_MAX_REVIEWS },
      ...excludeKidsWhere,
    },
    include: showListInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return shows.map(mapToShowListItem);
}

async function getKidsShows(limit = 5): Promise<ShowListItem[]> {
  const shows = await prisma.show.findMany({
    where: {
      genres: {
        some: { genre: { name: KIDS_GENRE_NAME } },
      },
    },
    include: showListInclude,
    orderBy: [{ reviewCount: "desc" }, { avgRating: { sort: "desc", nulls: "last" } }, { id: "asc" }],
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

export function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * If a manual featured-show slug is configured, fetch that specific show.
 * Returns `null` when no override is set or the slug doesn't match a valid show.
 */
async function getManualFeaturedShow(): Promise<ShowListItem | null> {
  if (!FEATURED_SHOW_SLUG) return null;

  const show = await prisma.show.findUnique({
    where: { slug: FEATURED_SHOW_SLUG },
    include: showListInclude,
  });

  if (!show) return null;
  return mapToShowListItem(show);
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

  const manualFeatured = await getManualFeaturedShow();
  const featuredShow = manualFeatured ?? topRated[0] ?? null;

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
    kidsResult,
    newShowsResult,
  ] = await Promise.allSettled([
    getTopRated(),
    getShowsByGenres([...GENRE_SECTIONS.dramas.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.comedies.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.musicals.genres], FETCH_LIMIT),
    getShowsByGenres([...GENRE_SECTIONS.israeli.genres], FETCH_LIMIT),
    getKidsShows(FETCH_LIMIT),
    getNewShows(),
  ]);

  const topRated = settled(topRatedResult, [] as ShowListItem[]);
  const dramas = settled(dramasResult, [] as ShowListItem[]);
  const comedies = settled(comediesResult, [] as ShowListItem[]);
  const musicals = settled(musicalsResult, [] as ShowListItem[]);
  const israeli = settled(israeliResult, [] as ShowListItem[]);
  const kids = settled(kidsResult, [] as ShowListItem[]);
  const newShows = settled(newShowsResult, [] as ShowListItem[]);

  const manualFeatured = await getManualFeaturedShow();
  const featuredShow = manualFeatured ?? topRated[0] ?? null;
  const featuredShowId = featuredShow?.id ?? null;

  const deduped = deduplicateSections(
    [
      { key: "topRated", shows: topRated },
      { key: "musicals", shows: musicals },
      { key: "dramas", shows: dramas },
      { key: "comedies", shows: comedies },
      { key: "israeli", shows: israeli },
      { key: "kids", shows: kids },
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
    kids: deduped.kids,
    newShows,
    featuredShowId,
  };
}

export const getSectionsData = unstable_cache(
  fetchSectionsData,
  ["homepage-sections"],
  { revalidate: 120, tags: ["homepage"] },
);

export interface ExploreBannerShow {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  genre: string[];
  avgRating: number | null;
  reviewCount: number;
}

/**
 * Fetch up to 50 random shows for the ExploreBanner shuffle grid.
 * Results are cached for 300s so the "random" pick rotates every ~5 minutes.
 */
async function fetchExploreBannerShows(): Promise<ExploreBannerShow[]> {
  const rows = await prisma.show.findMany({
    where: excludeKidsWhere,
    take: 200,
    select: {
      id: true,
      slug: true,
      title: true,
      theatre: true,
      avgRating: true,
      reviewCount: true,
      genres: { select: { genre: { select: { name: true } } } },
    },
  });

  const all: ExploreBannerShow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    theatre: r.theatre,
    avgRating: r.avgRating,
    reviewCount: r.reviewCount,
    genre: r.genres.map((g) => g.genre.name),
  }));

  // Shuffle using Fisher-Yates
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.slice(0, 50);
}

export const getExploreBannerShows = unstable_cache(
  fetchExploreBannerShows,
  ["explore-banner-shows"],
  { revalidate: 300, tags: ["homepage"] },
);

// ---------------------------------------------------------------------------
// Upcoming events (homepage teaser)
// ---------------------------------------------------------------------------

export type UpcomingEventItem = EventListItem & { dateLabel: string };

const UPCOMING_FETCH_LIMIT = 30;
const UPCOMING_TARGET = 6;
const UPCOMING_MIN = 3;

const TZ = "Asia/Jerusalem";

const hebrewShortDay = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  timeZone: TZ,
});

export function buildDateLabel(
  dateKey: string,
  todayKey: string,
  tomorrowKey: string,
): string {
  if (dateKey === todayKey) return "היום";
  if (dateKey === tomorrowKey) return "מחר";
  const d = new Date(dateKey + "T00:00:00Z");
  return hebrewShortDay.format(d);
}

async function fetchUpcomingEventsVaried(): Promise<UpcomingEventItem[]> {
  // Today in Jerusalem
  const now = new Date();
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const todayKey = todayParts; // YYYY-MM-DD
  const todayDate = new Date(todayKey + "T00:00:00Z");

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  // Current hour in Jerusalem for filtering past events today
  const currentHour = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  const currentHourNum = Number(currentHour);

  const events = await prisma.event.findMany({
    where: { date: { gte: todayDate }, show: excludeKidsWhere },
    include: {
      show: {
        select: {
          title: true,
          slug: true,
          theatre: true,
          summary: true,
          description: true,
          durationMinutes: true,
          cast: true,
          avgRating: true,
          reviewCount: true,
        },
      },
      venue: { select: { name: true, city: true, regions: true } },
    },
    orderBy: [{ date: "asc" }, { hour: "asc" }],
    take: UPCOMING_FETCH_LIMIT,
  });

  // Map to EventListItem + filter past events for today
  const candidates: (EventListItem & { regions: string[] })[] = [];
  for (const e of events) {
    const dateKey = e.date.toISOString().slice(0, 10);
    const hourNum = Number(e.hour.split(":")[0]);
    if (dateKey === todayKey && hourNum <= currentHourNum) continue;

    candidates.push({
      id: e.id,
      date: e.date.toISOString(),
      hour: e.hour,
      showTitle: e.show.title,
      showSlug: e.show.slug,
      showTheatre: e.show.theatre,
      showSummary: e.show.summary,
      showDescription: e.show.description,
      showDurationMinutes: e.show.durationMinutes,
      showCast: e.show.cast,
      showAvgRating: e.show.avgRating,
      showReviewCount: e.show.reviewCount,
      venueName: e.venue.name,
      venueCity: e.venue.city,
      regions: e.venue.regions,
    });
  }

  // Greedy diversity pick: avoid more than 2 consecutive events from the same
  // region so the homepage carousel represents geographic variety.
  const picked: (EventListItem & { regions: string[] })[] = [];
  const seenSlugs = new Set<string>();
  const lastTwoRegions: string[] = [];

  for (const c of candidates) {
    if (picked.length >= UPCOMING_TARGET) break;
    if (seenSlugs.has(c.showSlug)) continue;
    const region = c.regions[0] ?? "";
    if (
      lastTwoRegions.length >= 2 &&
      lastTwoRegions[0] === region &&
      lastTwoRegions[1] === region
    ) {
      continue;
    }
    seenSlugs.add(c.showSlug);
    picked.push(c);
    lastTwoRegions.unshift(region);
    if (lastTwoRegions.length > 2) lastTwoRegions.pop();
  }

  // Second pass: relax region constraint if we didn't get enough
  if (picked.length < UPCOMING_TARGET) {
    for (const c of candidates) {
      if (picked.length >= UPCOMING_TARGET) break;
      if (seenSlugs.has(c.showSlug)) continue;
      seenSlugs.add(c.showSlug);
      picked.push(c);
    }
  }

  if (picked.length < UPCOMING_MIN) return [];

  return picked.map((e) => ({
    id: e.id,
    date: e.date,
    hour: e.hour,
    showTitle: e.showTitle,
    showSlug: e.showSlug,
    showTheatre: e.showTheatre,
    showSummary: e.showSummary,
    showDescription: e.showDescription,
    showDurationMinutes: e.showDurationMinutes,
    showCast: e.showCast,
    showAvgRating: e.showAvgRating,
    showReviewCount: e.showReviewCount,
    venueName: e.venueName,
    venueCity: e.venueCity,
    dateLabel: buildDateLabel(e.date.slice(0, 10), todayKey, tomorrowKey),
  }));
}

export const getUpcomingEventsVaried = unstable_cache(
  fetchUpcomingEventsVaried,
  ["homepage-upcoming"],
  { revalidate: 120, tags: ["homepage"] },
);

// ---------------------------------------------------------------------------
// Latest reviews (homepage section)
// ---------------------------------------------------------------------------

const LATEST_REVIEWS_DISPLAY = 6;

async function fetchLatestReviews(): Promise<LatestReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { show: excludeKidsWhere },
    orderBy: { createdAt: "desc" },
    take: LATEST_REVIEWS_DISPLAY * 3,
    select: {
      id: true,
      author: true,
      title: true,
      text: true,
      rating: true,
      createdAt: true,
      show: {
        select: {
          id: true,
          slug: true,
          title: true,
          theatre: true,
        },
      },
    },
  });

  const seenShows = new Set<number>();
  const result: LatestReviewItem[] = [];

  for (const r of reviews) {
    if (result.length >= LATEST_REVIEWS_DISPLAY) break;
    if (seenShows.has(r.show.id)) continue;

    seenShows.add(r.show.id);
    result.push({
      id: r.id,
      author: r.author,
      title: r.title,
      text: r.text,
      rating: r.rating,
      createdAt: r.createdAt,
      showId: r.show.id,
      showSlug: r.show.slug,
      showTitle: r.show.title,
      showTheatre: r.show.theatre,
    });
  }

  return result;
}

export const getLatestReviews = unstable_cache(
  fetchLatestReviews,
  ["homepage-latest-reviews"],
  { revalidate: 120, tags: ["homepage"] },
);

// ---------------------------------------------------------------------------
// Total review count (social proof)
// ---------------------------------------------------------------------------

async function fetchTotalReviewCount(): Promise<number> {
  return prisma.review.count();
}

export const getTotalReviewCount = unstable_cache(
  fetchTotalReviewCount,
  ["homepage-total-reviews"],
  { revalidate: 120, tags: ["homepage"] },
);

// ---------------------------------------------------------------------------
// Platform stats (hero strip)
// ---------------------------------------------------------------------------

export interface PlatformStats {
  upcomingEvents: number;
  theatres: number;
  venues: number;
  cities: number;
  reviews: number;
}

async function fetchPlatformStats(): Promise<PlatformStats> {
  const [upcomingEvents, theatreRows, venueRows, reviews] = await Promise.all([
    prisma.event.count({ where: { date: { gte: new Date() } } }),
    prisma.show.findMany({ distinct: ["theatre"], select: { theatre: true } }),
    prisma.venue.findMany({ select: { city: true } }),
    prisma.review.count(),
  ]);

  const cities = new Set(
    venueRows.map((v) => v.city).filter((c): c is string => Boolean(c)),
  ).size;

  return {
    upcomingEvents,
    theatres: theatreRows.length,
    venues: venueRows.length,
    cities,
    reviews,
  };
}

export const getPlatformStats = unstable_cache(
  fetchPlatformStats,
  ["homepage-platform-stats"],
  { revalidate: 600, tags: ["homepage"] },
);
