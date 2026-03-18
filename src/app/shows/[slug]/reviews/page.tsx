import { notFound } from "next/navigation";
import Link from "next/link";
import { getShowBySlug } from "@/lib/data/showDetail";
import { getShowStats } from "@/utils/showStats";
import { getShowImagePath } from "@/utils/getShowImagePath";
import ROUTES, { showPath, showReviewsPath } from "@/constants/routes";
import { THEATRE_BY_NAME } from "@/constants/theatres";
import { theatrePath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import {
  SITE_NAME,
  toJsonLd,
  toAbsoluteUrl,
  buildBreadcrumbJsonLd,
  getShowImageAlt,
} from "@/lib/seo";
import prisma from "@/lib/prisma";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const revalidate = 120;

const MIN_REVIEWS = 5;

interface ReviewsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const shows = await prisma.show.findMany({
    where: { reviewCount: { gte: MIN_REVIEWS } },
    select: { slug: true },
    orderBy: { id: "asc" },
  });
  return shows.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: ReviewsPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const show = await getShowBySlug(slug);

  if (!show || show.reviews.length < MIN_REVIEWS) {
    return {
      title: "ביקורות לא נמצאו",
      robots: { index: false, follow: false },
    };
  }

  const { reviewCount, avgRating } = getShowStats(show);
  const canonicalPath = showReviewsPath(show.slug);

  const ratingText =
    avgRating !== null
      ? `דירוג ממוצע ${avgRating.toFixed(1)}/5 על בסיס ${reviewCount} ביקורות.`
      : "";

  const description = [
    `${reviewCount} ביקורות צופים על ${show.title} ב${show.theatre}.`,
    ratingText,
    "קראו חוויות אמיתיות של קהל והחליטו אם שווה לראות.",
  ]
    .filter(Boolean)
    .join(" ");

  const imagePath = getShowImagePath(show.title);
  const absoluteImageUrl = toAbsoluteUrl(
    `/${encodeURIComponent(imagePath.slice(1))}`,
  );

  return {
    title: `ביקורות על ${show.title} | ${show.theatre}`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `ביקורות על ${show.title} | ${SITE_NAME}`,
      description,
      url: toAbsoluteUrl(canonicalPath),
      images: [{ url: absoluteImageUrl, alt: getShowImageAlt(show.title) }],
    },
    twitter: {
      card: "summary_large_image",
      title: `ביקורות על ${show.title} | ${SITE_NAME}`,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ShowReviewsPage({ params }: ReviewsPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const show = await getShowBySlug(slug);

  if (!show || show.reviews.length < MIN_REVIEWS) {
    notFound();
  }

  const { reviewCount, avgRating } = getShowStats(show);
  const canonicalPath = showReviewsPath(show.slug);
  const showPagePath = showPath(show.slug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "הצגות", path: ROUTES.SHOWS },
    { name: show.title, path: showPagePath },
    { name: "ביקורות", path: canonicalPath },
  ]);

  // Full reviews JSON-LD (all reviews, not just first 5)
  const reviewsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: show.title,
    url: toAbsoluteUrl(showPagePath),
    image: toAbsoluteUrl(getShowImagePath(show.title)),
    aggregateRating:
      avgRating !== null
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: show.reviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author },
      name: review.title ?? `ביקורת על ${show.title}`,
      reviewBody: review.text,
      datePublished: new Date(review.date).toISOString(),
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
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
        dangerouslySetInnerHTML={{ __html: toJsonLd(reviewsJsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "הצגות", href: ROUTES.SHOWS },
          { label: show.title, href: showPagePath },
          { label: "ביקורות" },
        ]}
      />

      <header className={styles.header}>
        <div className={styles.headerGrid}>
          <div className={styles.poster}>
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt={getShowImageAlt(show.title)}
              fill
              sizes="120px"
              className={styles.posterImage}
            />
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              ביקורות על {show.title}
            </h1>
            <div className={styles.meta}>
              {THEATRE_BY_NAME.has(show.theatre) ? (
                <Link
                  href={theatrePath(THEATRE_BY_NAME.get(show.theatre)!.slug)}
                  className={styles.theatreLink}
                >
                  {show.theatre}
                </Link>
              ) : (
                <span>{show.theatre}</span>
              )}
              {avgRating !== null && (
                <span className={styles.rating}>
                  {avgRating.toFixed(1)} <span className={styles.star}>★</span>
                </span>
              )}
              <span>{reviewCount} ביקורות</span>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.reviewList}>
        {show.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </section>

      <nav className={styles.linksRow}>
        <Link href={showPagePath} className={styles.backLink}>
          חזרה לעמוד ההצגה
        </Link>
      </nav>
    </main>
  );
}
