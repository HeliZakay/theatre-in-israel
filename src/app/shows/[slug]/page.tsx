/**
 * Show detail page — SSG with ISR (revalidate every 2 min).
 *
 * Key logic:
 * - Legacy numeric URLs (/shows/42) are permanently redirected to slug URLs.
 * - Review ownership is detected for both authenticated users (by userId) and
 *   anonymous visitors (by cookie token), so the page can highlight "your review".
 * - When ENABLE_REVIEW_AUTH_GATEWAY is on and the visitor is unauthenticated,
 *   the review CTA links to a separate /shows/:slug/review page instead of
 *   showing the inline form.
 * - Related shows: theatre carousel first, then genre carousel with theatre
 *   duplicates removed.
 */
import { permanentRedirect } from "next/navigation";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { getAnonToken } from "@/utils/anonToken";
import { authOptions } from "@/lib/auth";
import { getShowBySlug } from "@/lib/data/showDetail";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ENABLE_REVIEW_AUTH_GATEWAY } from "@/constants/featureFlags";
import ROUTES, { showPath, showReviewPath, theatrePath, genrePath, actorPath } from "@/constants/routes";
import { THEATRE_BY_NAME } from "@/constants/theatres";
import { GENRE_BY_NAME } from "@/constants/genres";
import Breadcrumb from "@/components/layout/Breadcrumb/Breadcrumb";
import ReviewCard from "@/components/reviews/ReviewCard/ReviewCard";
import Image from "next/image";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import WatchlistButton from "@/components/shows/WatchlistButton/WatchlistButton";
import LotteryBadge from "@/components/shows/LotteryBadge/LotteryBadge";
import StickyReviewCTA from "@/components/shows/StickyReviewCTA/StickyReviewCTA";
import InlineReviewForm from "@/components/reviews/InlineReviewForm/InlineReviewForm";
import ReviewSuccessBanner from "@/components/reviews/ReviewSuccessBanner/ReviewSuccessBanner";
import ScrollToReviewButton from "@/components/reviews/ScrollToReviewButton/ScrollToReviewButton";
import ScrollToReviewsLink from "@/components/reviews/ScrollToReviewsLink/ScrollToReviewsLink";
import ShareDropdown from "@/components/ui/ShareDropdown/ShareDropdown";
import WebReviewSummary from "@/components/reviews/WebReviewSummary/WebReviewSummary";
import ShowsSection from "@/components/shows/ShowsSection/ShowsSection";
import PerformancesSidebar from "@/components/shows/PerformancesSidebar/PerformancesSidebar";
import {
  getRelatedByTheatre,
  getRelatedByGenres,
} from "@/lib/data/relatedShows";
import { getShowStats } from "@/utils/showStats";
import { getShowImagePath } from "@/utils/getShowImagePath";
import {
  SITE_NAME,
  toJsonLd,
  toAbsoluteUrl,
  buildBreadcrumbJsonLd,
  buildCreativeWorkJsonLd,
  getShowImageAlt,
} from "@/lib/seo";

import type { Metadata } from "next";

export const revalidate = 120; // Re-generate at most every 2 minutes

/**
 * If the slug is purely numeric (legacy URL like /shows/42),
 * look up the show by ID and permanently redirect to /shows/:slug.
 */
async function redirectIfLegacyNumericId(slug: string) {
  if (!/^\d+$/.test(slug)) return;
  const { default: prisma } = await import("@/lib/prisma");
  const show = await prisma.show.findUnique({
    where: { id: Number(slug) },
    select: { slug: true },
  });
  if (show) {
    permanentRedirect(`/shows/${show.slug}`);
  }
}

export async function generateStaticParams() {
  const { default: prisma } = await import("@/lib/prisma");
  const shows = await prisma.show.findMany({
    select: { slug: true },
    orderBy: { id: "asc" },
  });
  return shows.map((show) => ({ slug: show.slug }));
}

interface ShowPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string; count?: string }>;
}

const getShowForPage = cache(async (slug: string) => getShowBySlug(slug));

function buildShowDescription(
  description: string | null,
  summary: string,
  theatre: string,
  title: string,
  avgRating: number | null,
  reviewCount: number,
): string {
  const ratingText =
    avgRating !== null
      ? `★ ${avgRating.toFixed(1)}/5 על בסיס ${reviewCount} ביקורות צופים.`
      : ``;

  const text = description ?? summary;
  const shortText =
    text.length > 120 ? `${text.slice(0, 117).trimEnd()}...` : text;

  const parts = [
    `קראו ביקורות על ${title} ב${theatre}.`,
    ratingText,
    shortText,
  ].filter(Boolean);

  return parts.join(" ");
}

export async function generateMetadata({
  params,
}: ShowPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  try {
    await redirectIfLegacyNumericId(slug);
    const show = await getShowForPage(slug);

    if (!show) {
      return {
        title: "הצגה לא נמצאה",
        robots: { index: false, follow: false },
      };
    }

    const { reviewCount, avgRating } = getShowStats(show);
    const canonicalPath = showPath(show.slug);
    const description = buildShowDescription(
      show.description,
      show.summary,
      show.theatre,
      show.title,
      avgRating,
      reviewCount,
    );
    const imagePath = getShowImagePath(show.title);
    const absoluteImageUrl = toAbsoluteUrl(
      `/${encodeURIComponent(imagePath.slice(1))}`,
    );

    return {
      title: `${show.title} - ביקורות וחוויות צופים`,
      description,
      openGraph: {
        title: `${show.title} | ${SITE_NAME}`,
        description,
        url: toAbsoluteUrl(canonicalPath),
        images: [{ url: absoluteImageUrl, alt: getShowImageAlt(show.title) }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${show.title} | ${SITE_NAME}`,
        description,
        images: [absoluteImageUrl],
      },
    };
  } catch {
    return {
      title: "הצגה לא נמצאה",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ShowPage({
  params,
  searchParams,
}: ShowPageProps) {
  const [{ slug: rawSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const slug = decodeURIComponent(rawSlug);
  await redirectIfLegacyNumericId(slug);
  const show = await getShowForPage(slug);

  if (!show) {
    notFound();
  }

  const stats = getShowStats(show);
  const { reviewCount, avgRating } = stats;
  const canonicalPath = showPath(show.slug);

  // Check own-review state for authenticated users
  let userReview: (typeof show.reviews)[number] | null = null;
  let otherReviews = show.reviews;
  let session: Awaited<
    ReturnType<typeof getServerSession<typeof authOptions>>
  > = null;
  try {
    session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const userId = session.user.id;
      const idx = show.reviews.findIndex((r) => r.userId === userId);
      if (idx !== -1) {
        userReview = show.reviews[idx];
        otherReviews = show.reviews.filter((_, i) => i !== idx);
      }
    } else {
      // Anonymous visitor: check if they already reviewed (by cookie token).
      const anonToken = await getAnonToken();
      if (anonToken) {
        const anonReview = await prisma.review.findFirst({
          where: { anonToken, showId: show.id, userId: null },
          select: { id: true },
        });
        if (anonReview) {
          const idx = show.reviews.findIndex((r) => r.id === anonReview.id);
          if (idx !== -1) {
            userReview = show.reviews[idx];
            otherReviews = show.reviews.filter((_, i) => i !== idx);
          }
        }
      }
    }
  } catch {
    // Ignore — unauthenticated users see the default "add" state
  }

  // Fetch related shows in parallel
  const [sameTheatreShows, sameGenreShows] = await Promise.all([
    getRelatedByTheatre(show.theatre, show.id),
    getRelatedByGenres(show.genre, show.id),
  ]);

  // Deduplicate: remove shows already in the theatre carousel from the genre carousel
  const theatreIds = new Set(sameTheatreShows.map((s) => s.id));
  const similarShows = sameGenreShows.filter((s) => !theatreIds.has(s.id));

  // When the auth gateway flag is on and the user is not signed in, CTA buttons
  // link to /shows/:slug/review (a dedicated page) instead of scrolling to the
  // inline review form on this page.
  const showGateway = ENABLE_REVIEW_AUTH_GATEWAY && !session;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "הצגות", path: ROUTES.SHOWS },
    { name: show.title, path: canonicalPath },
  ]);

  const creativeWorkJsonLd = buildCreativeWorkJsonLd(
    show,
    stats,
    canonicalPath,
  );

  return (
    <main className={styles.page} id="main-content">
      <link rel="canonical" href={toAbsoluteUrl(canonicalPath)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(creativeWorkJsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "הצגות", href: ROUTES.SHOWS },
          { label: show.title },
        ]}
      />
      <div className={styles.heroRow}>
        <header className={styles.header}>
          <div className={styles.heroGrid}>
            <div className={styles.poster}>
              <FallbackImage
                src={getShowImagePath(show.title)}
                alt={getShowImageAlt(show.title)}
                fill
                sizes="(max-width: 640px) 100vw, 320px"
                className={styles.posterImage}
                priority
                fetchPriority="high"
              />
            </div>
            <div className={styles.heroContent}>
              <h1 className={styles.title}>{show.title}</h1>
              <div className={styles.ratingRow}>
                {avgRating !== null ? (
                  <span className={styles.metaRating}>
                    דירוג ממוצע
                    <span className={styles.metaRatingValue}>
                      {avgRating.toFixed(1)}
                      <span className={styles.metaRatingStar}>★</span>
                    </span>
                  </span>
                ) : (
                  <span className={styles.metaRatingEmpty}>אין דירוגים</span>
                )}
              </div>
              <div className={styles.meta}>
                {THEATRE_BY_NAME.has(show.theatre) ? (
                  <Link href={theatrePath(THEATRE_BY_NAME.get(show.theatre)!.slug)} className={styles.theatreLink}>
                    {show.theatre}
                  </Link>
                ) : (
                  <span>{show.theatre}</span>
                )}
                <span>{show.durationMinutes} דקות</span>
                {reviewCount > 0 ? (
                  <ScrollToReviewsLink reviewCount={reviewCount} className={styles.reviewsLink} />
                ) : (
                  <span>{reviewCount} ביקורות</span>
                )}
              </div>
              <div className={styles.genreRow}>
                {(show.genre ?? []).map((item) => {
                  const genreInfo = GENRE_BY_NAME.get(item);
                  return genreInfo ? (
                    <Link
                      key={item}
                      href={genrePath(genreInfo.slug)}
                      className={styles.genreChip}
                    >
                      {item}
                    </Link>
                  ) : (
                    <span key={item} className={styles.genreChip}>
                      {item}
                    </span>
                  );
                })}
              </div>
              <p className={styles.description}>{show.summary}</p>
              <div className={styles.heroActions} id="hero-actions">
                {!userReview && (
                  <ScrollToReviewButton
                    className={styles.primaryBtn}
                    reviewCount={reviewCount}
                    avgRating={avgRating}
                    href={
                      showGateway ? `/shows/${show.slug}/review` : undefined
                    }
                  />
                )}
                <WatchlistButton
                  showId={show.id}
                  showSlug={show.slug}
                />
                <ShareDropdown
                  url={showPath(show.slug)}
                  title={show.title}
                  theatre={show.theatre}
                  className={styles.ghostBtn}
                />
              </div>
              <LotteryBadge text="🎟️ כתיבת ביקורת = כרטיס להגרלה" />
            </div>
          </div>
        </header>
      </div>

      <div
        className={
          show.events.length > 0 ? styles.contentGrid : styles.contentGridFull
        }
      >
        <div className={styles.contentSections}>
          {show.description && (
            <section className={styles.aboutSection}>
              <h2 className={styles.sectionTitle}>על ההצגה</h2>
              <p className={styles.aboutText}>{show.description}</p>
            </section>
          )}

          {!userReview &&
            (showGateway ? (
              <section id="write-review" className={styles.reviewCta}>
                <Link
                  href={`/shows/${show.slug}/review`}
                  className={styles.reviewCtaLink}
                >
                  ✍️ כתוב.י ביקורת
                </Link>
              </section>
            ) : (
              <InlineReviewForm
                showId={show.id}
                showSlug={show.slug}
                showTitle={show.title}
                isAuthenticated={!!session}
                userName={session?.user?.name ?? ""}
                variant={show.reviews.length === 0 ? "empty" : "after-reviews"}
              />
            ))}

          {(show.cast || show.actors.length > 0) && (
            <section className={styles.aboutSection}>
              <h2 className={styles.sectionTitle}>משתתפים</h2>
              {show.actors.length > 0 && (
                <div className={styles.actorStrip}>
                  {show.actors.map((actor) => (
                    <Link
                      key={actor.id}
                      href={actorPath(actor.slug)}
                      className={styles.actorThumb}
                    >
                      {actor.image && (
                        <Image
                          src={actor.image}
                          alt={actor.name}
                          width={100}
                          height={125}
                          className={styles.actorImage}
                        />
                      )}
                      <span className={styles.actorName}>{actor.name}</span>
                    </Link>
                  ))}
                </div>
              )}
              {show.cast && <p className={styles.aboutText}>{show.cast}</p>}
            </section>
          )}

          {show.reviews.length === 0 && (
            <WebReviewSummary summary={show.webReviewSummary} />
          )}

          {(userReview || otherReviews.length > 0) && (
            <section className={`${styles.section} ${styles.reviewsAnchor}`} id="reviews">
              <h2 className={styles.sectionTitle}>ביקורות הקהל</h2>

              {userReview && (
                <div className={styles.ownReviewBlock}>
                  {resolvedSearchParams.review === "success" && (
                    <ReviewSuccessBanner
                      showSlug={show.slug}
                      showTitle={show.title}
                      reviewCount={
                        resolvedSearchParams.count
                          ? Number(resolvedSearchParams.count)
                          : null
                      }
                      review={{
                        rating: userReview.rating,
                        title: userReview.title,
                        text: userReview.text,
                      }}
                    />
                  )}
                  <ReviewCard review={userReview} isOwn />
                </div>
              )}

              {otherReviews.length > 0 && (
                <div className={styles.reviewList}>
                  {otherReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}

            </section>
          )}
        </div>

        {show.events.length > 0 && (
          <PerformancesSidebar events={show.events} theatre={show.theatre} />
        )}
      </div>

      {sameTheatreShows.length > 0 && (
        <ShowsSection
          title={`עוד הצגות של ${show.theatre}`}
          shows={sameTheatreShows}
          linkHref={THEATRE_BY_NAME.has(show.theatre) ? theatrePath(THEATRE_BY_NAME.get(show.theatre)!.slug) : `${ROUTES.SHOWS}?theatre=${encodeURIComponent(show.theatre)}`}
          linkText="לכל ההצגות"
          className={styles.fullWidthSection}
        />
      )}

      {similarShows.length > 0 && (
        <ShowsSection
          title="הצגות דומות"
          shows={similarShows}
          linkHref={ROUTES.SHOWS}
          linkText="לכל ההצגות"
          className={styles.fullWidthSection}
        />
      )}

      {!userReview && (
        <StickyReviewCTA
          href={showGateway ? showReviewPath(show.slug) : undefined}
        />
      )}
    </main>
  );
}
