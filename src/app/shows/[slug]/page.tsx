import { permanentRedirect } from "next/navigation";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShowBySlug } from "@/lib/data/showDetail";
import { isShowInWatchlist } from "@/lib/watchlist";
import ROUTES, { showPath, showReviewPath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import WatchlistButton from "@/components/WatchlistButton/WatchlistButton";
import LotteryBadge from "@/components/LotteryBadge/LotteryBadge";
import StickyReviewCTA from "@/components/StickyReviewCTA/StickyReviewCTA";
import InlineReviewForm from "@/components/InlineReviewForm/InlineReviewForm";
import ScrollToReviewButton from "@/components/ScrollToReviewButton/ScrollToReviewButton";
import { getShowStats } from "@/utils/showStats";
import { getShowImagePath } from "@/utils/getShowImagePath";
import {
  SITE_NAME,
  toJsonLd,
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
      ? `דירוג ${avgRating.toFixed(1)} מתוך 5 על בסיס ${reviewCount} ביקורות.`
      : `עדיין אין דירוג ממוצע.`;

  const text = description ?? summary;
  const shortText =
    text.length > 140 ? `${text.slice(0, 137).trimEnd()}...` : text;

  return `${title} בתיאטרון ${theatre}. ${ratingText} ${shortText}`;
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

    return {
      title: `${show.title} - ביקורות`,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `${show.title} | ${SITE_NAME}`,
        description,
        url: canonicalPath,
        images: [{ url: imagePath, alt: getShowImageAlt(show.title) }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${show.title} | ${SITE_NAME}`,
        description,
        images: [imagePath],
      },
    };
  } catch {
    return {
      title: "הצגה לא נמצאה",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ShowPage({ params }: ShowPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  await redirectIfLegacyNumericId(slug);
  const show = await getShowForPage(slug);

  if (!show) {
    notFound();
  }

  const { reviewCount, avgRating } = getShowStats(show);
  const canonicalPath = showPath(show.slug);

  const stats = { reviewCount, avgRating, latestReviewDate: null };

  // Check watchlist + own-review state for authenticated users
  let initialInWatchlist = false;
  let userReview: (typeof show.reviews)[number] | null = null;
  let otherReviews = show.reviews;
  let session: Awaited<
    ReturnType<typeof getServerSession<typeof authOptions>>
  > = null;
  try {
    session = await getServerSession(authOptions);
    if (session?.user?.id) {
      initialInWatchlist = await isShowInWatchlist(session.user.id, show.id);
      const userId = session.user.id;
      const idx = show.reviews.findIndex((r) => r.userId === userId);
      if (idx !== -1) {
        userReview = show.reviews[idx];
        otherReviews = show.reviews.filter((_, i) => i !== idx);
      }
    }
  } catch {
    // Ignore — unauthenticated users see the default "add" state
  }

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
              <span>{show.theatre}</span>
              <span>{show.durationMinutes} דקות</span>
              <span>{reviewCount} ביקורות</span>
            </div>
            <div className={styles.genreRow}>
              {(show.genre ?? []).map((item) => (
                <span key={item} className={styles.genreChip}>
                  {item}
                </span>
              ))}
            </div>
            <p className={styles.description}>{show.summary}</p>
            <div className={styles.heroActions} id="hero-actions">
              {!userReview && (
                <ScrollToReviewButton className={styles.primaryBtn} />
              )}
              <WatchlistButton
                showId={show.id}
                showSlug={show.slug}
                initialInWatchlist={initialInWatchlist}
              />
            </div>
            <LotteryBadge text="🎟️ כתיבת ביקורת = כרטיס להגרלה" />
          </div>
        </div>
      </header>

      {show.description && (
        <section className={styles.aboutSection}>
          <h2 className={styles.sectionTitle}>על ההצגה</h2>
          <p className={styles.aboutText}>{show.description}</p>
        </section>
      )}

      {show.cast && (
        <section className={styles.aboutSection}>
          <h2 className={styles.sectionTitle}>משתתפים</h2>
          <p className={styles.aboutText}>{show.cast}</p>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ביקורות אחרונות</h2>

        {!userReview && (
          <InlineReviewForm
            showId={show.id}
            showSlug={show.slug}
            isAuthenticated={!!session}
            variant={show.reviews.length === 0 ? "empty" : "after-reviews"}
          />
        )}

        {userReview && (
          <div className={styles.ownReviewBlock}>
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

      {!userReview && (
        <StickyReviewCTA reviewHref={showReviewPath(show.slug)} />
      )}
    </main>
  );
}
