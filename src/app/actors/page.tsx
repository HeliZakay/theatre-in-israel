import { getAllActorStats } from "@/lib/data/actorDetail";
import { ACTORS } from "@/constants/actors";
import ROUTES, { actorPath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import ActorsContent from "./ActorsContent";
import styles from "./page.module.css";

import type { Metadata } from "next";

const pageTitle = "שחקנים — שחקני תיאטרון מובילים בישראל";
const pageDescription =
  "גלו את שחקני התיאטרון המובילים בישראל — כל ההצגות של כל שחקן.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: ROUTES.ACTORS },
  openGraph: {
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    url: toAbsoluteUrl(ROUTES.ACTORS),
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    images: ["/logo-img.png"],
  },
};

export const revalidate = 120;

export default async function ActorsPage() {
  const allStats = await getAllActorStats();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "שחקנים", path: ROUTES.ACTORS },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: ACTORS.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.name,
      url: toAbsoluteUrl(actorPath(a.slug)),
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
          { label: "שחקנים" },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageDescription}</p>
      </header>
      <ActorsContent actors={ACTORS} stats={allStats} />
    </main>
  );
}
