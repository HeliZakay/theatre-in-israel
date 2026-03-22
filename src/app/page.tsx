import { Suspense } from "react";
import Hero from "@/components/Hero/Hero";
import UpcomingEventsSection from "@/components/Events/UpcomingEventsSection";
import ShowsSectionsContent from "@/components/ShowsSectionsContent/ShowsSectionsContent";
import ShowsSectionsSkeleton from "@/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton";
import LotteryBanner from "@/components/LotteryBanner/LotteryBanner";
import ExploreBanner from "@/components/ExploreBanner/ExploreBanner";
import { isLotteryActive } from "@/constants/lottery";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import {
  getHeroData,
  getExploreBannerShows,
  getLatestReviews,
} from "@/lib/data/homepage";
import LatestReviewsSection from "@/components/LatestReviewsSection/LatestReviewsSection";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

const homeTitle = "הצגות מומלצות - ביקורות ודירוגי קהל";
const homeDescription =
  "גלו אילו הצגות שווה לראות השבוע. ביקורות צופים, דירוגים והמלצות על הצגות תיאטרון בכל הארץ — קאמרי, הבימה, גשר, חיפה ועוד.";

export const metadata: Metadata = {
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

export const revalidate = 120;

export default async function Home() {
  const [{ suggestions, featuredShow, featuredReview }, exploreShows, latestReviews] =
    await Promise.all([getHeroData(), getExploreBannerShows(), getLatestReviews()]);

  return (
    <main className={styles.page} id="main-content">
      <Hero
        suggestions={suggestions}
        featuredShow={featuredShow}
        featuredReview={featuredReview}
      />

      <Suspense fallback={null}>
        <UpcomingEventsSection />
      </Suspense>

      <LatestReviewsSection reviews={latestReviews} />

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
