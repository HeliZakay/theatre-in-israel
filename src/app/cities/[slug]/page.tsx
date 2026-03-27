import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityData } from "@/lib/data/cityDetail";
import { CITIES, CITY_BY_SLUG } from "@/constants/cities";
import { THEATRE_BY_NAME } from "@/constants/theatres";
import ROUTES, { cityPath, theatrePath, eventsPath } from "@/constants/routes";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const revalidate = 120;

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = CITY_BY_SLUG.get(slug);
  if (!city) {
    return { title: "עיר לא נמצאה", robots: { index: false } };
  }

  const { stats } = await getCityData(city.aliases);
  const canonicalPath = cityPath(slug);

  const title = `הצגות תיאטרון ב${city.name}`;
  const description =
    stats.upcomingEventCount > 0
      ? `${stats.upcomingEventCount} הופעות קרובות ב${city.name} ב-${stats.venueCount} אולמות. מצאו הצגות, ביקורות וכרטיסים.`
      : `הצגות תיאטרון ב${city.name} — תיאטראות, אולמות וביקורות צופים.`;

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
  const city = CITY_BY_SLUG.get(slug);
  if (!city) notFound();

  const { topShows, venues, stats } = await getCityData(city.aliases);
  const canonicalPath = cityPath(slug);

  // Resolve resident theatres that have a dedicated page
  const residentTheatres = city.residentTheatres
    .map((name) => ({ name, info: THEATRE_BY_NAME.get(name) }))
    .filter((t) => t.info);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ערים", path: ROUTES.CITIES },
    { name: city.name, path: canonicalPath },
  ]);

  const itemListJsonLd =
    topShows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `הצגות ב${city.name}`,
          itemListElement: topShows.map((show, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: show.title,
            url: toAbsoluteUrl(`/shows/${show.slug}`),
          })),
        }
      : null;

  // Events page link for this city (uses the existing city filter)
  const eventsLink = eventsPath([slug]);

  return (
    <main className={styles.page} id="main-content">
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
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "ערים", href: ROUTES.CITIES },
          { label: city.name },
        ]}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>הצגות תיאטרון ב{city.name}</h1>
        <p className={styles.description}>{city.description}</p>
        <div className={styles.statsRow}>
          {stats.upcomingEventCount > 0 && (
            <span>{stats.upcomingEventCount} הופעות קרובות</span>
          )}
          <span>{stats.upcomingShowCount} הצגות</span>
          <span>{stats.venueCount} אולמות</span>
        </div>
      </header>

      {residentTheatres.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>תיאטראות ב{city.name}</h2>
          <div className={styles.theatreList}>
            {residentTheatres.map((t) => (
              <Link
                key={t.name}
                href={theatrePath(t.info!.slug)}
                className={styles.theatreLink}
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {venues.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>אולמות ב{city.name}</h2>
          <div className={styles.venueGrid}>
            {venues.map((v) => (
              <div key={`${v.name}-${v.city}`} className={styles.venueCard}>
                <span className={styles.venueName}>{v.name}</span>
                <span className={styles.venueEvents}>
                  {v.upcomingEventCount} הופעות קרובות
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {topShows.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>הצגות מובילות ב{city.name}</h2>
          <div className={styles.showGrid}>
            {topShows.map((show, i) => (
              <ShowCard key={show.id} show={show} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      <div className={styles.linksRow}>
        <Link href={eventsLink} className={styles.ctaLink}>
          לוח הופעות ב{city.name}
        </Link>
        <Link href={ROUTES.CITIES} className={styles.backLink}>
          כל הערים
        </Link>
      </div>
    </main>
  );
}
