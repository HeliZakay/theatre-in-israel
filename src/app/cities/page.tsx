import Link from "next/link";
import Image from "next/image";
import { getAllCityStats } from "@/lib/data/cityDetail";
import { CITIES } from "@/constants/cities";
import ROUTES, { cityPath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

const pageTitle = "תיאטרון לפי עיר";
const pageDescription =
  "מצאו הצגות תיאטרון לפי עיר — תל אביב, חיפה, ירושלים, באר שבע ועוד. אולמות, תיאטראות והופעות קרובות בכל עיר בישראל.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: ROUTES.CITIES },
  openGraph: {
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    url: toAbsoluteUrl(ROUTES.CITIES),
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    images: ["/logo-img.png"],
  },
};

export const revalidate = 120;

export default async function CitiesPage() {
  const allStats = await getAllCityStats(
    CITIES.map((c) => ({ slug: c.slug, name: c.name, aliases: c.aliases })),
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ערים", path: ROUTES.CITIES },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: CITIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: toAbsoluteUrl(cityPath(c.slug)),
    })),
  };

  const statsMap = new Map(allStats.map((s) => [s.slug, s]));

  return (
    <main className={styles.page} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "ערים" },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageDescription}</p>
      </header>
      <div className={styles.grid}>
        {CITIES.map((c) => {
          const stats = statsMap.get(c.slug);
          return (
            <Link
              key={c.slug}
              href={cityPath(c.slug)}
              className={styles.card}
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={styles.cardImage}
              />
              <div className={styles.cardOverlay}>
                <h2 className={styles.cardTitle}>{c.name}</h2>
                {stats ? (
                  <div className={styles.cardStats}>
                    <span>{stats.upcomingEventCount} הופעות קרובות</span>
                    <span>{stats.showCount} הצגות</span>
                    <span>{stats.venueCount} אולמות</span>
                  </div>
                ) : (
                  <span className={styles.cardStats}>אין הופעות קרובות</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
