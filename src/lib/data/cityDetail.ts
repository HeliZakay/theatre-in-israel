import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { showListInclude, mapToShowListItem } from "../showHelpers";
import type { ShowListItem } from "@/types";
import {
  CITIES,
  CANONICAL_NAME_BY_ALIAS,
  cityNameToSlug,
} from "@/constants/cities";

export interface CityVenue {
  name: string;
  city: string;
  upcomingEventCount: number;
}

export interface CityStats {
  upcomingEventCount: number;
  upcomingShowCount: number;
  venueCount: number;
}

export interface CityPageData {
  topShows: ShowListItem[];
  venues: CityVenue[];
  stats: CityStats;
}

async function fetchCityData(aliases: string[]): Promise<CityPageData> {
  const today = new Date(new Date().toDateString());

  // Venues in this city with upcoming event counts
  const venuesRaw: { name: string; city: string; event_count: number }[] =
    await prisma.$queryRaw`
      SELECT v.name, v.city, COUNT(e.id)::int AS event_count
      FROM "Venue" v
      LEFT JOIN "Event" e ON e."venueId" = v.id AND e.date >= ${today}
      WHERE v.city = ANY(${aliases})
      GROUP BY v.id, v.name, v.city
      ORDER BY event_count DESC, v.name ASC`;

  const venues: CityVenue[] = venuesRaw.map((v) => ({
    name: v.name,
    city: v.city,
    upcomingEventCount: v.event_count,
  }));

  // Top-rated shows with upcoming events in this city (limit 12)
  const topShowIds: { id: number }[] = await prisma.$queryRaw`
    SELECT DISTINCT s.id
    FROM "Show" s
    JOIN "Event" e ON e."showId" = s.id
    JOIN "Venue" v ON e."venueId" = v.id
    WHERE v.city = ANY(${aliases}) AND e.date >= ${today}
    ORDER BY s.id ASC`;

  const ids = topShowIds.map((r) => r.id);

  const rawShows = ids.length > 0
    ? await prisma.show.findMany({
        where: { id: { in: ids } },
        include: showListInclude,
        orderBy: [{ reviewCount: "desc" }, { avgRating: { sort: "desc", nulls: "last" } }],
      })
    : [];

  const topShows: ShowListItem[] = rawShows.map(mapToShowListItem);

  // Aggregate stats
  const upcomingEventCount = venues.reduce((sum, v) => sum + v.upcomingEventCount, 0);

  return {
    topShows,
    venues: venues.filter((v) => v.upcomingEventCount > 0),
    stats: {
      upcomingEventCount,
      upcomingShowCount: ids.length,
      venueCount: venues.filter((v) => v.upcomingEventCount > 0).length,
    },
  };
}

export const getCityData = unstable_cache(
  (aliases: string[]) => fetchCityData(aliases),
  ["city-detail"],
  { revalidate: 120, tags: ["events-list"] },
);

/** Fetch summary stats for all cities (for the index page). */
async function fetchAllCityStats(
  cityList: { slug: string; name: string; aliases: string[] }[],
): Promise<
  { slug: string; name: string; upcomingEventCount: number; venueCount: number; showCount: number }[]
> {
  const today = new Date(new Date().toDateString());

  const results = await Promise.all(
    cityList.map(async (city) => {
      const row: { event_count: number; venue_count: number; show_count: number }[] =
        await prisma.$queryRaw`
          SELECT
            COUNT(e.id)::int AS event_count,
            COUNT(DISTINCT e."venueId")::int AS venue_count,
            COUNT(DISTINCT e."showId")::int AS show_count
          FROM "Event" e
          JOIN "Venue" v ON e."venueId" = v.id
          WHERE v.city = ANY(${city.aliases}) AND e.date >= ${today}`;
      const r = row[0];
      return {
        slug: city.slug,
        name: city.name,
        upcomingEventCount: r.event_count,
        venueCount: r.venue_count,
        showCount: r.show_count,
      };
    }),
  );

  return results.sort((a, b) => b.upcomingEventCount - a.upcomingEventCount);
}

export const getAllCityStats = unstable_cache(
  (cityList: { slug: string; name: string; aliases: string[] }[]) =>
    fetchAllCityStats(cityList),
  ["cities-list"],
  { revalidate: 120, tags: ["events-list"] },
);

export interface CityListEntry {
  /** Canonical Hebrew name. */
  name: string;
  /** URL slug (Hebrew, spaces → hyphens). */
  slug: string;
  /** DB venue-city values that belong to this city. */
  aliases: string[];
  /** Count of upcoming events across all venues in this city. */
  upcomingEventCount: number;
}

/**
 * Returns every city that has at least one venue in the DB, merging alias
 * groups (e.g. "תל אביב" + "תל אביב-יפו") into a single canonical city.
 * The list is fully derived from DB state — adding a new venue in a new city
 * is enough for that city to appear on /cities without any code change.
 */
async function fetchAllCities(): Promise<CityListEntry[]> {
  const today = new Date(new Date().toDateString());

  const rows: { city: string; event_count: number }[] = await prisma.$queryRaw`
    SELECT v.city, COUNT(e.id)::int AS event_count
    FROM "Venue" v
    LEFT JOIN "Event" e ON e."venueId" = v.id AND e.date >= ${today}
    WHERE v.city IS NOT NULL AND v.city <> ''
    GROUP BY v.city`;

  // Fold each DB city into its canonical name (curated aliases collapse).
  const byCanonical = new Map<string, { aliases: Set<string>; events: number }>();
  for (const row of rows) {
    const canonical = CANONICAL_NAME_BY_ALIAS.get(row.city) ?? row.city;
    const entry = byCanonical.get(canonical) ?? {
      aliases: new Set<string>(),
      events: 0,
    };
    entry.aliases.add(row.city);
    entry.events += row.event_count;
    byCanonical.set(canonical, entry);
  }

  // Make sure every curated city appears even if its DB rows have 0 events.
  for (const c of CITIES) {
    if (!byCanonical.has(c.name)) {
      byCanonical.set(c.name, { aliases: new Set(c.aliases), events: 0 });
    }
  }

  const list: CityListEntry[] = Array.from(byCanonical.entries()).map(
    ([name, { aliases, events }]) => ({
      name,
      slug: cityNameToSlug(name),
      aliases: Array.from(aliases),
      upcomingEventCount: events,
    }),
  );

  // Hebrew alphabetical, stable.
  list.sort((a, b) => a.name.localeCompare(b.name, "he"));
  return list;
}

export const getAllCities = unstable_cache(
  () => fetchAllCities(),
  ["cities-all"],
  { revalidate: 120, tags: ["events-list"] },
);
