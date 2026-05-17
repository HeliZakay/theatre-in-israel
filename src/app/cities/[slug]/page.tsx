import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityData, getAllCities } from "@/lib/data/cityDetail";
import { getEvents } from "@/lib/data/eventsList";
import { buildDateGroupsAndTabs } from "@/lib/data/eventsGroups";
import {
  CITY_BY_NAME,
  CANONICAL_NAME_BY_ALIAS,
  citySlugToName,
  cityNameToSlug,
} from "@/constants/cities";
import { CITY_SLUGS } from "@/lib/eventsConstants";
import ROUTES, { cityPath, eventsPath } from "@/constants/routes";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import EventsClientView from "@/components/events/EventsClientView";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((c) => ({ slug: c.slug }));
}

/**
 * Resolve a URL slug to the canonical city entry + aliases. Returns null when
 * the slug doesn't map to any known city (page should 404).
 */
async function resolveCity(slug: string) {
  // Defensive decode — Next normally hands us decoded params, but accept
  // percent-encoded forms too. Then turn URL hyphens back into spaces.
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // ignore — malformed encoding, fall back to raw
  }
  const name = citySlugToName(decoded);

  // First check curated cities (handles "תל אביב-יפו" → "תל אביב" aliasing).
  const canonical = CANONICAL_NAME_BY_ALIAS.get(name) ?? name;

  const all = await getAllCities();
  const entry = all.find((c) => c.name === canonical);
  if (!entry) return null;

  return { entry, curated: CITY_BY_NAME.get(entry.name) };
}

/**
 * Build the slug used by the /events filter for this city. Returns the Latin
 * SEO slug for the 3 indexed cities, otherwise the Hebrew slug derived from
 * the canonical name — every city has a working events filter URL.
 */
function findEventsCitySlug(aliases: string[], canonicalName: string): string {
  for (const [slug, slugAliases] of Object.entries(CITY_SLUGS)) {
    if (slugAliases.some((a) => aliases.includes(a))) return slug;
  }
  return cityNameToSlug(canonicalName);
}

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveCity(slug);
  if (!resolved) {
    return { title: "עיר לא נמצאה", robots: { index: false } };
  }

  const { entry } = resolved;
  const { stats } = await getCityData(entry.aliases);
  const canonicalPath = cityPath(entry.slug);

  const title = `הצגות תיאטרון ב${entry.name}`;
  const description =
    stats.upcomingEventCount > 0
      ? `${stats.upcomingEventCount} הופעות קרובות ב${entry.name} ב-${stats.venueCount} אולמות. מצאו הצגות, ביקורות וכרטיסים.`
      : `הצגות תיאטרון ב${entry.name} — תיאטראות, אולמות וביקורות צופים.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: toAbsoluteUrl(canonicalPath),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ["/logo-img.png"],
    },
  };
}

export default async function CityDetailPage({ params }: CityPageProps) {
  const { slug } = await params;
  const resolved = await resolveCity(slug);
  if (!resolved) notFound();

  const { entry, curated } = resolved;
  const [{ venues, stats }, events] = await Promise.all([
    getCityData(entry.aliases),
    getEvents({ cityAliases: entry.aliases }),
  ]);
  const canonicalPath = cityPath(entry.slug);
  const { dateGroupsFormatted, dateTabs } = buildDateGroupsAndTabs(events);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ערים", path: ROUTES.CITIES },
    { name: entry.name, path: canonicalPath },
  ]);

  const eventsCitySlug = findEventsCitySlug(entry.aliases, entry.name);
  const eventsLink = eventsPath([eventsCitySlug]);
  const hasUpcoming = stats.upcomingEventCount > 0;

  return (
    <main className={styles.page} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "ערים", href: ROUTES.CITIES },
          { label: entry.name },
        ]}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>הצגות תיאטרון ב{entry.name}</h1>
        {curated?.description && (
          <p className={styles.description}>{curated.description}</p>
        )}
        {hasUpcoming ? (
          <div className={styles.statsRow}>
            <span>{stats.upcomingEventCount} הופעות קרובות</span>
            <span>{stats.upcomingShowCount} הצגות</span>
            <span>{stats.venueCount} אולמות</span>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              אין הופעות קרובות ב{entry.name} כרגע
            </p>
            <p className={styles.emptyText}>
              ייתכן שטרם נקבעו תאריכים, או שההופעות הקרובות התקיימו לאחרונה.
              בינתיים אפשר לעיין בלוח ההופעות הכללי או לבחור עיר אחרת.
            </p>
            <div className={styles.emptyActions}>
              <Link href={ROUTES.EVENTS} className={styles.heroCta}>
                לוח ההופעות הכללי
                <span aria-hidden="true" className={styles.heroCtaArrow}>←</span>
              </Link>
              <Link href={ROUTES.CITIES} className={styles.secondaryCta}>
                כל הערים
              </Link>
            </div>
          </div>
        )}
      </header>

      {venues.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>אולמות ב{entry.name}</h2>
          <div className={styles.venueGrid}>
            {venues.map((v) => (
              <Link
                key={`${v.name}-${v.city}`}
                href={`${eventsLink}?venue=${encodeURIComponent(v.name)}`}
                className={styles.venueCard}
              >
                <span className={styles.venueName}>{v.name}</span>
                <span className={styles.venueEvents}>
                  {v.upcomingEventCount} הופעות קרובות
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasUpcoming && events.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>לוח הופעות ב{entry.name}</h2>
          <EventsClientView
            groups={dateGroupsFormatted}
            dateTabs={dateTabs}
            datePreset="all"
          />
        </section>
      )}

      {hasUpcoming && (
        <div className={styles.linksRow}>
          <Link href={ROUTES.CITIES} className={styles.backLink}>
            כל הערים
          </Link>
        </div>
      )}
    </main>
  );
}
