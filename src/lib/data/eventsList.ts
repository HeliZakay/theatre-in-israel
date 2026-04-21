import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { resolveDatePreset } from "../datePresets";
import {
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
  showSummary: string;
  showDescription: string | null;
  showDurationMinutes: number;
  showCast: string | null;
  showAvgRating: number | null;
  showReviewCount: number;
  venueName: string;
  venueCity: string;
}

interface EventsQuery {
  datePreset?: string;
  region?: string;
  city?: string;
  theatre?: string;
}

async function fetchEvents({
  region,
  city,
  theatre,
}: EventsQuery): Promise<EventListItem[]> {
  const { from, to } = resolveDatePreset('all');

  const venueWhere: Record<string, unknown> = {};
  if (region && region in REGION_SLUGS) {
    venueWhere.regions = { hasSome: [region] };
  } else if (city && city in CITY_SLUGS) {
    venueWhere.city = { in: CITY_SLUGS[city] };
  }

  const showWhere: Record<string, unknown> = {};
  if (theatre) {
    showWhere.theatre = theatre;
  }

  const events = await prisma.event.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(Object.keys(venueWhere).length > 0
        ? { venue: venueWhere }
        : {}),
      ...(Object.keys(showWhere).length > 0
        ? { show: showWhere }
        : {}),
    },
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
      venue: {
        select: { name: true, city: true, regions: true },
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
    showSummary: e.show.summary,
    showDescription: e.show.description,
    showDurationMinutes: e.show.durationMinutes,
    showCast: e.show.cast,
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

/**
 * Count events per region for the RegionChips badge numbers.
 *
 * Two-step approach: first groupBy venueId to count events (Prisma can't
 * groupBy a relation field), then resolve each venue's regions and aggregate.
 */
async function fetchRegionCounts(datePreset = 'all'): Promise<Record<string, number>> {
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
    select: { id: true, regions: true },
  });

  const venueRegionsMap = new Map(venues.map((v) => [v.id, v.regions]));

  // Build slug → count from the REGION_SLUGS keys
  const regionCounts: Record<string, number> = {};
  for (const slug of Object.keys(REGION_SLUGS)) {
    regionCounts[slug] = 0;
  }

  for (const row of counts) {
    const regions = venueRegionsMap.get(row.venueId) || [];
    for (const r of regions) {
      if (r in regionCounts) {
        regionCounts[r] += row._count;
      }
    }
  }

  return regionCounts;
}

export const getRegionCounts = unstable_cache(
  (datePreset?: string) => fetchRegionCounts(datePreset),
  ["events-region-counts"],
  { revalidate: 120, tags: ["events-list"] },
);
