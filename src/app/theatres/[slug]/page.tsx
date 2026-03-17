import { notFound } from "next/navigation";
import Link from "next/link";
import { getTheatreData } from "@/lib/data/theatreDetail";
import { THEATRES, THEATRE_BY_SLUG } from "@/constants/theatres";
import ROUTES, { theatrePath, showPath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import ShowCard from "@/components/ShowCard/ShowCard";
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
  return THEATRES.map((t) => ({ slug: t.slug }));
}

interface TheatrePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TheatrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const theatre = THEATRE_BY_SLUG.get(slug);
  if (!theatre) {
    return { title: "תיאטרון לא נמצא", robots: { index: false } };
  }

  const { stats } = await getTheatreData(theatre.name);
  const canonicalPath = theatrePath(slug);

  const ratingText =
    stats.avgRating !== null
      ? ` ★ ${stats.avgRating.toFixed(1)}/5 על בסיס ${stats.totalReviews} ביקורות.`
      : "";

  const title = `${theatre.name} - הצגות וביקורות`;
  const description = `${stats.showCount} הצגות בתיאטרון ${theatre.name}.${ratingText} קראו ביקורות צופים, צפו בדירוגים ומצאו את ההצגה הבאה שלכם.`;

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

export default async function TheatreDetailPage({ params }: TheatrePageProps) {
  const { slug } = await params;
  const theatre = THEATRE_BY_SLUG.get(slug);
  if (!theatre) notFound();

  const { shows, stats } = await getTheatreData(theatre.name);
  const canonicalPath = theatrePath(slug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "תיאטראות", path: ROUTES.THEATRES },
    { name: theatre.name, path: canonicalPath },
  ]);

  const organizationJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TheaterGroup",
    name: theatre.name,
    url: toAbsoluteUrl(canonicalPath),
  };
  if (stats.avgRating !== null && stats.totalReviews > 0) {
    organizationJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(stats.avgRating.toFixed(1)),
      reviewCount: stats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const itemListJsonLd =
    shows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `הצגות תיאטרון ${theatre.name}`,
          itemListElement: shows.map((show, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: show.title,
            url: toAbsoluteUrl(showPath(show.slug)),
          })),
        }
      : null;

  return (
    <main className={styles.page} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(organizationJsonLd) }}
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
          { label: "תיאטראות", href: ROUTES.THEATRES },
          { label: theatre.name },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{theatre.name}</h1>
        <div className={styles.statsRow}>
          <span>{stats.showCount} הצגות</span>
          {stats.avgRating !== null && (
            <span>★ {stats.avgRating.toFixed(1)} ממוצע</span>
          )}
          <span>{stats.totalReviews} ביקורות</span>
          {stats.upcomingEventCount > 0 && (
            <span>{stats.upcomingEventCount} הופעות קרובות</span>
          )}
        </div>
      </header>

      {shows.length > 0 ? (
        <>
          <h2 className={styles.sectionTitle}>כל ההצגות</h2>
          <div className={styles.grid}>
            {shows.map((show, i) => (
              <ShowCard key={show.id} show={show} priority={i < 4} />
            ))}
          </div>
        </>
      ) : (
        <p className={styles.empty}>אין כרגע הצגות בתיאטרון זה.</p>
      )}

      <div className={styles.linksRow}>
        <Link href={ROUTES.THEATRES} className={styles.backLink}>
          כל התיאטראות
        </Link>
        <Link
          href={`${ROUTES.EVENTS}?theatre=${encodeURIComponent(theatre.name)}`}
          className={styles.backLink}
        >
          לוח הופעות {theatre.name}
        </Link>
      </div>
    </main>
  );
}
