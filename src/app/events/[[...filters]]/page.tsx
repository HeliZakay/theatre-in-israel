/**
 * Events calendar page using a Next.js catch-all route: /events/[[...filters]].
 *
 * URL segments are order-independent and map to three filter dimensions:
 *   - date preset  (e.g. "weekend", "week", "today")
 *   - region       (e.g. "center", "north")
 *   - city         (e.g. "tel-aviv", "haifa")
 *
 * Constraints enforced by parseFilters():
 *   - Region and city are mutually exclusive (can't combine both).
 *   - Duplicate date segments trigger a 404.
 *   - Unknown segments trigger a 404.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import ROUTES, { eventsPath, showPath, theatrePath } from "@/constants/routes";
import { THEATRE_BY_NAME } from "@/constants/theatres";
import { getEvents, getRegionCounts } from "@/lib/data/eventsList";
import { buildDateGroupsAndTabs } from "@/lib/data/eventsGroups";
import { getAllCities } from "@/lib/data/cityDetail";
import {
  CANONICAL_NAME_BY_ALIAS,
  cityNameToSlug,
  citySlugToName,
} from "@/constants/cities";
import {
  DATE_SLUGS,
  REGION_SLUGS,
  CITY_SLUGS,
  DEFAULT_DATE_PRESET,
} from "@/lib/eventsConstants";
import {
  SITE_NAME,
  toAbsoluteUrl,
  toJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import { getShowImagePath } from "@/utils/getShowImagePath";
import DateChips from "@/components/events/DateChips";
import RegionChips from "@/components/events/RegionChips";
import CityFilter from "@/components/events/CityFilter";
import TheatreFilter from "@/components/events/TheatreFilter";
import EventsClientView from "@/components/events/EventsClientView";
import EventsEmptyState from "@/components/events/EventsEmptyState";
import EventsFAQ from "@/components/events/EventsFAQ";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const revalidate = 120;
export const dynamicParams = true;

// ---------------------------------------------------------------------------
// Filter parsing
// ---------------------------------------------------------------------------

interface ParsedFilters {
  datePreset: string;
  region?: string;
  city?: string;
}

export function parseFilters(
  filters: string[] = [],
  hebrewCitySlugs?: Set<string>,
): ParsedFilters {
  let datePreset: string | undefined;
  let region: string | undefined;
  let city: string | undefined;

  for (const rawSegment of filters) {
    let segment = rawSegment;
    try {
      segment = decodeURIComponent(rawSegment);
    } catch {
      // ignore — malformed encoding, fall back to raw
    }
    if (segment in DATE_SLUGS) {
      if (datePreset !== undefined) notFound();
      datePreset = segment;
    } else if (segment in REGION_SLUGS) {
      if (region !== undefined || city !== undefined) notFound();
      region = segment;
    } else if (segment in CITY_SLUGS) {
      if (region !== undefined || city !== undefined) notFound();
      city = segment;
    } else if (hebrewCitySlugs?.has(segment)) {
      if (region !== undefined || city !== undefined) notFound();
      city = segment;
    } else {
      notFound();
    }
  }

  return {
    datePreset: datePreset ?? DEFAULT_DATE_PRESET,
    region,
    city,
  };
}

// ---------------------------------------------------------------------------
// Indexing rules
// ---------------------------------------------------------------------------

const INDEXED_DATE_SLUGS = new Set(["weekend", "nextweek"]);
const INDEXED_REGION_SLUGS = new Set(Object.keys(REGION_SLUGS));
const INDEXED_CITY_SLUGS = new Set(Object.keys(CITY_SLUGS));

export function shouldIndex(
  datePreset: string,
  region?: string,
  city?: string,
): boolean {
  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;
  const dateIndexed = isDefaultDate || INDEXED_DATE_SLUGS.has(datePreset);
  if (!dateIndexed) return false;

  // City pages: indexed only with default date
  if (city) return isDefaultDate && INDEXED_CITY_SLUGS.has(city);

  // No location filter: indexed if date is default or indexed date
  if (!region) return dateIndexed;

  // Region: indexed if region is indexed
  return INDEXED_REGION_SLUGS.has(region);
}

// ---------------------------------------------------------------------------
// Page title
// ---------------------------------------------------------------------------

const CITY_DISPLAY: Record<string, string> = {
  "tel-aviv": "תל אביב",
  haifa: "חיפה",
  "beer-sheva": "באר שבע",
};

/** Resolve a city URL segment (Latin or Hebrew slug) to its display name + DB aliases. */
function resolveCitySegment(
  slug: string,
  allCities: { slug: string; name: string; aliases: string[] }[],
): { name: string; aliases: string[] } | null {
  if (slug in CITY_SLUGS) {
    return {
      name: CITY_DISPLAY[slug] ?? slug,
      aliases: CITY_SLUGS[slug],
    };
  }
  const entry = allCities.find((c) => c.slug === slug);
  if (entry) return { name: entry.name, aliases: entry.aliases };

  // Fallback for unrecognized Hebrew slug — derive from slug itself.
  const name = citySlugToName(slug);
  const canonical = CANONICAL_NAME_BY_ALIAS.get(name) ?? name;
  return { name: canonical, aliases: [canonical] };
}

/** How each date preset appears in the page title (with correct ב/no-ב). */
const DATE_TITLE_FORM: Record<string, string> = {
  today: "היום",
  tomorrow: "מחר",
  weekend: "בסוף השבוע",

  nextweek: "בשבוע הבא",
  all: "",
};

export function buildPageTitle(
  datePreset: string,
  region?: string,
  city?: string,
  cityName?: string,
): string {
  if (city) {
    return `הצגות תיאטרון ב${cityName ?? CITY_DISPLAY[city] ?? citySlugToName(city)}`;
  }

  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;
  const datePart = DATE_TITLE_FORM[datePreset] ?? '';
  const regionPart = region ? `ב${REGION_SLUGS[region]}` : '';

  if (!isDefaultDate && datePart && regionPart) {
    return `הופעות תיאטרון ${datePart} ${regionPart}`;
  }
  if (!isDefaultDate && datePart) {
    return `הופעות תיאטרון ${datePart}`;
  }
  if (regionPart) {
    return `הופעות תיאטרון ${regionPart}`;
  }

  return "לוח הופעות תיאטרון";
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  const params: { filters: string[] }[] = [{ filters: [] }];

  // Regions
  for (const region of Object.keys(REGION_SLUGS)) {
    params.push({ filters: [region] });
  }

  // Indexed date presets
  for (const date of INDEXED_DATE_SLUGS) {
    params.push({ filters: [date] });
  }

  // Cities
  for (const city of Object.keys(CITY_SLUGS)) {
    params.push({ filters: [city] });
  }

  // Indexed date+region combos
  for (const date of INDEXED_DATE_SLUGS) {
    for (const region of Object.keys(REGION_SLUGS)) {
      params.push({ filters: [date, region] });
    }
  }

  return params;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface EventsPageProps {
  params: Promise<{ filters?: string[] }>;
  searchParams: Promise<{ theatre?: string; venue?: string }>;
}

const DATE_DESCRIPTION: Record<string, string> = {
  weekend:
    "מה הולך בתיאטרון בסוף השבוע? כל ההצגות והמופעים הקרובים — דירוגים, ביקורות צופים ולוח מועדים מעודכן.",

  nextweek:
    "תכננו את השבוע הבא — כל הצגות התיאטרון, דירוגי צופים ולוח מועדים מעודכן.",
};

function buildDescription(
  datePreset: string,
  region?: string,
  city?: string,
  cityName?: string,
): string {
  if (city) {
    return `לוח הצגות תיאטרון ב${cityName ?? CITY_DISPLAY[city] ?? citySlugToName(city)} — מועדים קרובים, דירוגים וביקורות צופים.`;
  }
  if (region) {
    return `הופעות תיאטרון ב${REGION_SLUGS[region]} — לוח מועדים, דירוגים וביקורות צופים.`;
  }
  if (DATE_DESCRIPTION[datePreset]) {
    return DATE_DESCRIPTION[datePreset];
  }
  if (datePreset !== DEFAULT_DATE_PRESET) {
    const datePart = DATE_TITLE_FORM[datePreset] ?? DATE_SLUGS[datePreset];
    return `הצגות תיאטרון ${datePart} — כל המופעים הקרובים, דירוגים וביקורות צופים.`;
  }
  return "מצאו הצגות תיאטרון קרובות לפי תאריך ואזור — לוח מועדים מעודכן יומית עם דירוגי צופים.";
}

export async function generateMetadata({
  params,
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const { filters } = await params;
  const { theatre, venue } = await searchParams;
  const allCities = await getAllCities();
  const hebrewCitySlugs = new Set(allCities.map((c) => c.slug));
  const { datePreset, region, city } = parseFilters(filters, hebrewCitySlugs);
  const cityName = city
    ? resolveCitySegment(city, allCities)?.name
    : undefined;
  const title = venue
    ? `לוח הופעות ב${venue}`
    : theatre
      ? `לוח הופעות ${theatre}`
      : buildPageTitle(datePreset, region, city, cityName);
  const description = venue
    ? `כל ההופעות הקרובות ב${venue} — מועדים וקישורי רכישה.`
    : theatre
      ? `כל ההופעות הקרובות של ${theatre} — מועדים, מיקומים וקישורי רכישה.`
      : buildDescription(datePreset, region, city, cityName);
  const canonical = eventsPath(filters ?? []);
  const indexed = shouldIndex(datePreset, region, city);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    robots: { index: indexed && !theatre && !venue, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: toAbsoluteUrl(canonical),
      siteName: SITE_NAME,
      images: [{ url: "/logo-img.png", alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ["/logo-img.png"],
    },
    alternates: { canonical },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { filters } = await params;
  const { theatre, venue } = await searchParams;
  const allCities = await getAllCities();
  const hebrewCitySlugs = new Set(allCities.map((c) => c.slug));
  const { datePreset, region, city } = parseFilters(filters, hebrewCitySlugs);
  const locationSlug = region ?? city;
  const cityResolved = city ? resolveCitySegment(city, allCities) : null;
  const cityName = cityResolved?.name;

  const [events, regionCounts] = await Promise.all([
    getEvents({ region, cityAliases: cityResolved?.aliases, theatre, venueName: venue }),
    getRegionCounts(datePreset),
  ]);

  const title = venue
    ? `לוח הופעות ב${venue}`
    : theatre
      ? `לוח הופעות ${theatre}`
      : buildPageTitle(datePreset, region, city, cityName);
  const canonical = eventsPath(filters ?? []);
  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;
  const hasNonDefaultFilter = !isDefaultDate || !!region || !!city || !!theatre || !!venue;

  // Breadcrumb
  const breadcrumbItems: { name: string; path: string }[] = [
    { name: "דף הבית", path: ROUTES.HOME },
    { name: "לוח הופעות", path: ROUTES.EVENTS },
  ];
  if (region) {
    breadcrumbItems.push({
      name: REGION_SLUGS[region],
      path: eventsPath([region]),
    });
  } else if (city) {
    breadcrumbItems.push({
      name: cityName ?? CITY_DISPLAY[city] ?? city,
      path: eventsPath([city]),
    });
  }
  if (theatre) {
    breadcrumbItems.push({
      name: theatre,
      path: `${ROUTES.EVENTS}?theatre=${encodeURIComponent(theatre)}`,
    });
  }
  if (venue) {
    const venueBase = city ? eventsPath([city]) : ROUTES.EVENTS;
    breadcrumbItems.push({
      name: venue,
      path: `${venueBase}?venue=${encodeURIComponent(venue)}`,
    });
  }
  if (!isDefaultDate) {
    breadcrumbItems.push({
      name: DATE_SLUGS[datePreset],
      path: canonical,
    });
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);
  const breadcrumbUiItems = breadcrumbItems.map((item, i) =>
    i < breadcrumbItems.length - 1
      ? { label: item.name, href: item.path }
      : { label: item.name },
  );

  // Event JSON-LD (ItemList with Event items, capped at 20)
  const itemListJsonLd =
    events.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: events.slice(0, 20).map((event, index) => {
            const startIso = `${event.date.slice(0, 10)}T${event.hour}:00+03:00`;
            const endUtcMs = new Date(startIso).getTime() + event.showDurationMinutes * 60000;
            const endLocal = new Date(endUtcMs + 3 * 3600000);
            const endIso = endLocal.toISOString().slice(0, 19) + "+03:00";
            const theatreInfo = THEATRE_BY_NAME.get(event.showTheatre);
            const organizerUrl = theatreInfo
              ? toAbsoluteUrl(theatrePath(theatreInfo.slug))
              : undefined;
            const performers = event.showCast
              ? event.showCast.split(",").map((name) => ({
                  "@type": "Person" as const,
                  name: name.trim(),
                }))
              : [{ "@type": "PerformingGroup" as const, name: event.showTheatre }];
            return {
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Event",
                name: event.showTitle,
                description: event.showDescription || event.showSummary,
                startDate: startIso,
                endDate: endIso,
                eventAttendanceMode:
                  "https://schema.org/OfflineEventAttendanceMode",
                eventStatus: "https://schema.org/EventScheduled",
                url: toAbsoluteUrl(showPath(event.showSlug)),
                image: toAbsoluteUrl(getShowImagePath(event.showTitle)),
                location: {
                  "@type": "PerformingArtsTheater",
                  name: event.venueName,
                  address: { "@type": "PostalAddress", addressLocality: event.venueCity },
                },
                organizer: {
                  "@type": "Organization",
                  name: event.showTheatre,
                  ...(organizerUrl && { url: organizerUrl }),
                },
                performer: performers,
              },
            };
          }),
        }
      : null;

  // Group events by date and format for EventsList + DateStrip
  const { dateGroupsFormatted, dateTabs } = buildDateGroupsAndTabs(events);

  // Empty-state fallback: find the region with the most events to suggest
  // as an alternative when the current filter combination yields no results.
  let nearestRegion: { slug: string; label: string; count: number } | null = null;
  if (events.length === 0 && hasNonDefaultFilter && !theatre) {
    let maxCount = 0;
    for (const [slug, count] of Object.entries(regionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        nearestRegion = { slug, label: REGION_SLUGS[slug], count };
      }
    }
  }

  return (
    <main className={styles.page} id="main-content">
      <a href="#events-list" className="skipLink">
        דלגו לרשימת ההופעות
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}

      <Breadcrumb items={breadcrumbUiItems} />
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>

      <div className={styles.filterPanel}>
        <section className={styles.filterGroup} aria-label="סינון לפי תאריך">
          <span className={styles.filterLabel}>מתי</span>
          <DateChips datePreset={datePreset} locationSlug={locationSlug} theatre={theatre} venue={venue} />
        </section>

        <section className={styles.filterGroup} aria-label="סינון לפי מיקום">
          <span className={styles.filterLabel}>איפה</span>
          <RegionChips
            region={region}
            city={city}
            datePreset={datePreset}
            regionCounts={regionCounts}
            theatre={theatre}
          />
          <CityFilter
            allCities={allCities.map((c) => ({ slug: c.slug, name: c.name }))}
            citySlug={city}
            datePreset={datePreset}
            theatre={theatre}
          />
        </section>

        <section className={styles.filterGroup} aria-label="סינון לפי תיאטרון">
          <span className={styles.filterLabel}>איזה תיאטרון</span>
          <TheatreFilter
            datePreset={datePreset}
            locationSlug={locationSlug}
            venue={venue}
            theatre={theatre}
          />
        </section>
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultCount}>
          {events.length === 0
            ? "אין הופעות תואמות"
            : events.length === 1
              ? "הופעה אחת"
              : `${events.length} הופעות`}
        </span>
        {hasNonDefaultFilter && (
          <Link href={ROUTES.EVENTS} className={styles.clearLink}>
            נקו סינון
          </Link>
        )}
      </div>

      <div id="events-list">
        {events.length === 0 ? (
          <EventsEmptyState
            datePreset={datePreset}
            region={region}
            city={city}
            cityName={cityName}
            theatre={theatre}
            nearestRegion={nearestRegion}
          />
        ) : (
          <EventsClientView
            groups={dateGroupsFormatted}
            dateTabs={dateTabs}
            datePreset={datePreset}
          />
        )}
      </div>

      <EventsFAQ />
    </main>
  );
}
