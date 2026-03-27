import Link from "next/link";
import Image from "next/image";
import { getAllTheatreStats } from "@/lib/data/theatreDetail";
import { THEATRES, THEATRE_BY_NAME } from "@/constants/theatres";
import ROUTES, { theatrePath } from "@/constants/routes";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

const pageTitle = "תיאטראות בישראל";
const pageDescription =
  "כל התיאטראות בישראל במקום אחד — הקאמרי, הבימה, גשר, חיפה, באר שבע, החאן ועוד. צפו בהצגות, ביקורות ודירוגי קהל לכל תיאטרון.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: ROUTES.THEATRES },
  openGraph: {
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    url: toAbsoluteUrl(ROUTES.THEATRES),
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    images: ["/logo-img.png"],
  },
};

export const revalidate = 120;

export default async function TheatresPage() {
  const allStats = await getAllTheatreStats();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "תיאטראות", path: ROUTES.THEATRES },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: THEATRES.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: toAbsoluteUrl(theatrePath(t.slug)),
    })),
  };

  // Build a lookup from the DB stats
  const statsMap = new Map(allStats.map((s) => [s.name, s]));

  // Order by THEATRES constant, then append any DB theatres not in the constant
  const ordered = THEATRES.map((t) => ({
    ...t,
    stats: statsMap.get(t.name),
  }));
  const extra = allStats
    .filter((s) => !THEATRE_BY_NAME.has(s.name))
    .map((s) => ({
      slug: "",
      name: s.name,
      image: "",
      stats: s,
    }));

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
          { label: "תיאטראות" },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageDescription}</p>
      </header>
      <div className={styles.grid}>
        {ordered.map((t) => {
          const stats = t.stats;
          return (
            <Link
              key={t.slug}
              href={theatrePath(t.slug)}
              className={styles.card}
            >
              <Image
                src={t.image}
                alt={t.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={styles.cardImage}
              />
              <div className={styles.cardOverlay}>
                <h2 className={styles.cardTitle}>{t.name}</h2>
                {stats ? (
                  <div className={styles.cardStats}>
                    <span>{stats.showCount} הצגות</span>
                    {stats.avgRating !== null && (
                      <span>★ {stats.avgRating.toFixed(1)}</span>
                    )}
                    <span>{stats.totalReviews} ביקורות</span>
                  </div>
                ) : (
                  <span className={styles.cardStats}>אין הצגות כרגע</span>
                )}
              </div>
            </Link>
          );
        })}
        {extra.map((t) => (
          <div
            key={t.name}
            className={`${styles.card} ${styles.cardFallback}`}
          >
            <div className={styles.cardOverlay}>
              <h2 className={styles.cardTitle}>{t.name}</h2>
              {t.stats && (
                <div className={styles.cardStats}>
                  <span>{t.stats.showCount} הצגות</span>
                  {t.stats.avgRating !== null && (
                    <span>★ {t.stats.avgRating.toFixed(1)}</span>
                  )}
                  <span>{t.stats.totalReviews} ביקורות</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
