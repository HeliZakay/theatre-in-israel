import { getAllCities } from "@/lib/data/cityDetail";
import ROUTES, { cityPath } from "@/constants/routes";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import CitiesSearchableList from "./CitiesSearchableList";
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
  const cities = await getAllCities();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ערים", path: ROUTES.CITIES },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: cities.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: toAbsoluteUrl(cityPath(c.slug)),
    })),
  };

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
      <CitiesSearchableList
        cities={cities.map((c) => ({
          name: c.name,
          slug: c.slug,
          upcomingEventCount: c.upcomingEventCount,
        }))}
      />
    </main>
  );
}
