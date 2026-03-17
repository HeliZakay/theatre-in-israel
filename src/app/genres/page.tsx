import Link from "next/link";
import { getAllGenreStats } from "@/lib/data/genreDetail";
import { GENRES, GENRE_BY_NAME } from "@/constants/genres";
import ROUTES, { genrePath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

const pageTitle = "ז׳אנרים — הצגות תיאטרון לפי ז׳אנר";
const pageDescription =
  "גלו הצגות תיאטרון לפי ז׳אנר — דרמה, קומדיה, מחזמר, מותחן, ילדים ועוד. ביקורות ודירוגי קהל לכל ז׳אנר.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: ROUTES.GENRES },
  openGraph: {
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    url: toAbsoluteUrl(ROUTES.GENRES),
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    images: ["/logo-img.png"],
  },
};

export const revalidate = 120;

export default async function GenresPage() {
  const allStats = await getAllGenreStats();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ז׳אנרים", path: ROUTES.GENRES },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: GENRES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.name,
      url: toAbsoluteUrl(genrePath(g.slug)),
    })),
  };

  const statsMap = new Map(allStats.map((s) => [s.name, s]));

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
          { label: "ז׳אנרים" },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageDescription}</p>
      </header>
      <div className={styles.grid}>
        {GENRES.map((g) => {
          const stats = statsMap.get(g.name);
          return (
            <Link
              key={g.slug}
              href={genrePath(g.slug)}
              className={styles.card}
            >
              <h2 className={styles.cardTitle}>{g.name}</h2>
              <p className={styles.cardDescription}>{g.description}</p>
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
            </Link>
          );
        })}
      </div>
    </main>
  );
}
