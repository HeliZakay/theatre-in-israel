import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { resolveDatePreset } from "../datePresets";
import {
  DEFAULT_DATE_PRESET,
  REGION_SLUGS,
  CITY_SLUGS,
} from "../eventsConstants";

export interface EventListItem {
  id: number;
  date: string;
  hour: string;
  showTitle: string;
  showSlug: string;
  showTheatre: string;
  showAvgRating: number | null;
  showReviewCount: number;
  venueName: string;
  venueCity: string;
}

interface EventsQuery {
  datePreset?: string;
  region?: string;
  city?: string;
}

async function fetchEvents({
  datePreset = DEFAULT_DATE_PRESET,
  region,
  city,
}: EventsQuery): Promise<EventListItem[]> {
  const { from, to } = resolveDatePreset(datePreset);

  const venueWhere: Record<string, unknown> = {};
  if (region && region in REGION_SLUGS) {
    venueWhere.region = region;
  } else if (city && city in CITY_SLUGS) {
    venueWhere.city = { in: CITY_SLUGS[city] };
  }

  const events = await prisma.event.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(Object.keys(venueWhere).length > 0
        ? { venue: venueWhere }
        : {}),
    },
    include: {
      show: {
        select: {
          title: true,
          slug: true,
          theatre: true,
          avgRating: true,
          reviewCount: true,
        },
      },
      venue: {
        select: { name: true, city: true, region: true },
      },
    },
    orderBy: [{ date: "asc" }, { hour: "asc" }],
  });

  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    hour: e.hour,
    showTitle: e.show.title,
    showSlug: e.show.slug,
    showTheatre: e.show.theatre,
    showAvgRating: e.show.avgRating,
    showReviewCount: e.show.reviewCount,
    venueName: e.venue.name,
    venueCity: e.venue.city,
  }));
}

export const getEvents = unstable_cache(
  (query: EventsQuery) => fetchEvents(query),
  ["events-list"],
  { revalidate: 120, tags: ["events-list"] },
);

async function fetchRegionCounts(
  datePreset: string = DEFAULT_DATE_PRESET,
): Promise<Record<string, number>> {
  const { from, to } = resolveDatePreset(datePreset);

  const counts = await prisma.event.groupBy({
    by: ["venueId"],
    where: { date: { gte: from, lte: to } },
    _count: true,
  });

  // We need region info from venues — fetch venue regions for matched venueIds
  const venueIds = counts.map((c) => c.venueId);
  const venues = await prisma.venue.findMany({
    where: { id: { in: venueIds } },
    select: { id: true, region: true },
  });

  const venueRegionMap = new Map(venues.map((v) => [v.id, v.region]));

  // Build slug → count from the REGION_SLUGS keys
  const regionCounts: Record<string, number> = {};
  for (const slug of Object.keys(REGION_SLUGS)) {
    regionCounts[slug] = 0;
  }

  for (const row of counts) {
    const region = venueRegionMap.get(row.venueId);
    if (region && region in regionCounts) {
      regionCounts[region] += row._count;
    }
  }

  return regionCounts;
}

export const getRegionCounts = unstable_cache(
  (datePreset?: string) => fetchRegionCounts(datePreset),
  ["events-region-counts"],
  { revalidate: 120, tags: ["events-list"] },
);
