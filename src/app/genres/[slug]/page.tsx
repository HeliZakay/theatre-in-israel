import { notFound } from "next/navigation";
import Link from "next/link";
import { getGenreData } from "@/lib/data/genreDetail";
import { GENRES, GENRE_BY_SLUG } from "@/constants/genres";
import ROUTES, { genrePath, showPath } from "@/constants/routes";
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
  return GENRES.map((g) => ({ slug: g.slug }));
}

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = GENRE_BY_SLUG.get(slug);
  if (!genre) {
    return { title: "ז׳אנר לא נמצא", robots: { index: false } };
  }

  const { stats } = await getGenreData(genre.name);
  const canonicalPath = genrePath(slug);

  const ratingText =
    stats.avgRating !== null
      ? ` ★ ${stats.avgRating.toFixed(1)}/5 על בסיס ${stats.totalReviews} ביקורות.`
      : "";

  const title = `הצגות ${genre.name} — ביקורות ודירוגים`;
  const description = `${stats.showCount} הצגות ${genre.name} על הבמה הישראלית.${ratingText} ${genre.description}`;

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

export default async function GenreDetailPage({ params }: GenrePageProps) {
  const { slug } = await params;
  const genre = GENRE_BY_SLUG.get(slug);
  if (!genre) notFound();

  const { shows, stats } = await getGenreData(genre.name);
  const canonicalPath = genrePath(slug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "ז׳אנרים", path: ROUTES.GENRES },
    { name: genre.name, path: canonicalPath },
  ]);

  const itemListJsonLd =
    shows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `הצגות ${genre.name}`,
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
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "ז׳אנרים", href: ROUTES.GENRES },
          { label: genre.name },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>הצגות {genre.name}</h1>
        <p className={styles.description}>{genre.description}</p>
        <div className={styles.statsRow}>
          <span>{stats.showCount} הצגות</span>
          {stats.avgRating !== null && (
            <span>★ {stats.avgRating.toFixed(1)} ממוצע</span>
          )}
          <span>{stats.totalReviews} ביקורות</span>
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
        <p className={styles.empty}>אין כרגע הצגות בז׳אנר זה.</p>
      )}

      <div className={styles.linksRow}>
        <Link href={ROUTES.GENRES} className={styles.backLink}>
          כל הז׳אנרים
        </Link>
        <Link
          href={`${ROUTES.SHOWS}?genre=${encodeURIComponent(genre.name)}`}
          className={styles.backLink}
        >
          חיפוש הצגות {genre.name}
        </Link>
      </div>
    </main>
  );
}
