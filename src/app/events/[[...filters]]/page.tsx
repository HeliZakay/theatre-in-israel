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
import ROUTES, { eventsPath, showPath } from "@/constants/routes";
import { getEvents, getRegionCounts } from "@/lib/data/eventsList";
import type { EventListItem } from "@/lib/data/eventsList";
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
import EventsClientView from "@/components/events/EventsClientView";
import EventsEmptyState from "@/components/events/EventsEmptyState";
import EventsFAQ from "@/components/events/EventsFAQ";
import type { DateGroup } from "@/components/events/EventsList";
import type { DateTab } from "@/components/events/DateStrip";
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

export function parseFilters(filters: string[] = []): ParsedFilters {
  let datePreset: string | undefined;
  let region: string | undefined;
  let city: string | undefined;

  for (const segment of filters) {
    if (segment in DATE_SLUGS) {
      if (datePreset !== undefined) notFound();
      datePreset = segment;
    } else if (segment in REGION_SLUGS) {
      if (region !== undefined || city !== undefined) notFound();
      region = segment;
    } else if (segment in CITY_SLUGS) {
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
): string {
  if (city) {
    return `הצגות תיאטרון ב${CITY_DISPLAY[city] ?? city}`;
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
  searchParams: Promise<{ theatre?: string }>;
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
): string {
  if (city) {
    return `לוח הצגות תיאטרון ב${CITY_DISPLAY[city] ?? city} — מועדים קרובים, דירוגים וביקורות צופים.`;
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
  const { theatre } = await searchParams;
  const { datePreset, region, city } = parseFilters(filters);
  const title = theatre
    ? `לוח הופעות ${theatre}`
    : buildPageTitle(datePreset, region, city);
  const description = theatre
    ? `כל ההופעות הקרובות של ${theatre} — מועדים, מיקומים וקישורי רכישה.`
    : buildDescription(datePreset, region, city);
  const canonical = eventsPath(filters ?? []);
  const indexed = shouldIndex(datePreset, region, city);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    robots: { index: indexed && !theatre, follow: true },
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
// Helpers
// ---------------------------------------------------------------------------

function groupByDate(events: EventListItem[]) {
  const groups: Map<string, EventListItem[]> = new Map();
  for (const event of events) {
    const dateKey = event.date.slice(0, 10);
    const group = groups.get(dateKey);
    if (group) {
      group.push(event);
    } else {
      groups.set(dateKey, [event]);
    }
  }
  return groups;
}

const hebrewDayFormatter = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jerusalem",
});

const hebrewWeekdayFormatter = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  timeZone: "Asia/Jerusalem",
});

const hebrewDayNumFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  timeZone: "Asia/Jerusalem",
});

const hebrewMonthFormatter = new Intl.DateTimeFormat("he-IL", {
  month: "short",
  timeZone: "Asia/Jerusalem",
});

function buildDateTab(
  dateKey: string,
  count: number,
  todayKey: string,
  tomorrowKey: string,
): DateTab {
  const d = new Date(dateKey + "T00:00:00Z");
  const label = "";

  return {
    dateKey,
    dayName: hebrewWeekdayFormatter.format(d),
    dayNum: hebrewDayNumFormatter.format(d),
    monthName: hebrewMonthFormatter.format(d),
    label,
    count,
  };
}

function formatDateHeader(dateKey: string, todayKey: string, tomorrowKey: string, count: number): string {
  const d = new Date(dateKey + "T00:00:00Z");
  const formatted = hebrewDayFormatter.format(d);

  let prefix = "";
  if (dateKey === todayKey) prefix = "היום · ";
  else if (dateKey === tomorrowKey) prefix = "מחר · ";

  const countLabel = count === 1 ? "הופעה אחת" : `${count} הופעות`;
  return `${prefix}${formatted} · ${countLabel}`;
}

function getTodayTomorrowKeys(): { todayKey: string; tomorrowKey: string } {
  const now = new Date();
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const todayKey = todayParts; // YYYY-MM-DD
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
  return { todayKey, tomorrowKey };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { filters } = await params;
  const { theatre } = await searchParams;
  const { datePreset, region, city } = parseFilters(filters);
  const locationSlug = region ?? city;

  const [events, regionCounts] = await Promise.all([
    getEvents({ region, city, theatre }),
    getRegionCounts(datePreset),
  ]);

  const title = theatre
    ? `לוח הופעות ${theatre}`
    : buildPageTitle(datePreset, region, city);
  const canonical = eventsPath(filters ?? []);
  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;
  const hasNonDefaultFilter = !isDefaultDate || !!region || !!city || !!theatre;

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
      name: CITY_DISPLAY[city] ?? city,
      path: eventsPath([city]),
    });
  }
  if (theatre) {
    breadcrumbItems.push({
      name: theatre,
      path: `${ROUTES.EVENTS}?theatre=${encodeURIComponent(theatre)}`,
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
          itemListElement: events.slice(0, 20).map((event, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Event",
              name: event.showTitle,
              startDate: `${event.date.slice(0, 10)}T${event.hour}:00+03:00`,
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
              },
              offers: {
                "@type": "Offer",
                url: toAbsoluteUrl(showPath(event.showSlug)),
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }
      : null;

  // Group events by date and format for EventsList + DateStrip
  const dateGroups = groupByDate(events);
  const { todayKey, tomorrowKey } = getTodayTomorrowKeys();

  const dateGroupsFormatted: DateGroup[] = Array.from(dateGroups.entries()).map(
    ([dateKey, dayEvents]) => ({
      dateKey,
      label: formatDateHeader(dateKey, todayKey, tomorrowKey, dayEvents.length),
      events: dayEvents.map((event) => ({
        hour: event.hour,
        showTitle: event.showTitle,
        showSlug: event.showSlug,
        showTheatre: event.showTheatre,
        showAvgRating: event.showAvgRating,
        showReviewCount: event.showReviewCount,
        venueName: event.venueName,
        venueCity: event.venueCity,
      })),
    }),
  );

  const dateTabs: DateTab[] = Array.from(dateGroups.entries()).map(
    ([dateKey, dayEvents]) =>
      buildDateTab(dateKey, dayEvents.length, todayKey, tomorrowKey),
  );

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
        <p className={styles.subtitle}>
          מצאו הצגות תיאטרון קרובות לפי תאריך ואזור
        </p>
      </header>

      <DateChips datePreset={datePreset} locationSlug={locationSlug} theatre={theatre} />
      <RegionChips
        region={region}
        city={city}
        datePreset={datePreset}
        regionCounts={regionCounts}
        theatre={theatre}
      />

      <div className={styles.clearRow}>
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
