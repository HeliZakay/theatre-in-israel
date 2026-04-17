import { Suspense } from "react";
import Hero from "@/components/layout/Hero/Hero";
import UpcomingEventsSection from "@/components/events/UpcomingEventsSection";
import ShowsSectionsContent from "@/components/shows/ShowsSectionsContent/ShowsSectionsContent";
import ShowsSectionsSkeleton from "@/components/shows/ShowsSectionsSkeleton/ShowsSectionsSkeleton";
import LotteryBanner from "@/components/shows/LotteryBanner/LotteryBanner";
import ExploreBanner from "@/components/shows/ExploreBanner/ExploreBanner";
import { isLotteryActive } from "@/constants/lottery";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import {
  getHeroData,
  getExploreBannerShows,
  getLatestReviews,
  getTotalReviewCount,
} from "@/lib/data/homepage";
import LatestReviewsSection from "@/components/reviews/LatestReviewsSection/LatestReviewsSection";
import { SITE_NAME } from "@/lib/seo";
import { formatReviewMilestone } from "@/utils/formatReviewCount";

import type { Metadata } from "next";

const homeTitle = "הצגות מומלצות - ביקורות ודירוגי קהל";

export async function generateMetadata(): Promise<Metadata> {
  const totalReviewCount = await getTotalReviewCount();
  const countLabel = totalReviewCount >= 100
    ? `${formatReviewMilestone(totalReviewCount)} ביקורות צופים, `
    : "ביקורות צופים, ";
  const homeDescription = `גלו אילו הצגות שווה לראות השבוע. ${countLabel}דירוגים והמלצות על הצגות תיאטרון בכל הארץ — קאמרי, הבימה, גשר, חיפה ועוד.`;

  return {
    title: homeTitle,
    description: homeDescription,
    alternates: {
      canonical: ROUTES.HOME,
    },
    openGraph: {
      title: `${homeTitle} | ${SITE_NAME}`,
      description: homeDescription,
      url: ROUTES.HOME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${homeTitle} | ${SITE_NAME}`,
      description: homeDescription,
      images: ["/logo-img.png"],
    },
  };
}

export const revalidate = 120;

export default async function Home() {
  const [{ suggestions, featuredShow, featuredReview }, exploreShows, latestReviews, totalReviewCount] =
    await Promise.all([getHeroData(), getExploreBannerShows(), getLatestReviews(), getTotalReviewCount()]);

  return (
    <main className={styles.page} id="main-content">
      <Hero
        suggestions={suggestions}
        featuredShow={featuredShow}
        featuredReview={featuredReview}
        totalReviewCount={totalReviewCount}
      />

      <Suspense fallback={null}>
        <UpcomingEventsSection />
      </Suspense>

      <LatestReviewsSection reviews={latestReviews} totalReviewCount={totalReviewCount} />

      <Suspense fallback={<ShowsSectionsSkeleton />}>
        <ShowsSectionsContent
          banner={
            isLotteryActive() ? (
              <LotteryBanner />
            ) : (
              <ExploreBanner shows={exploreShows} />
            )
          }
        />
      </Suspense>
    </main>
  );
}
