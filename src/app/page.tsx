import { Suspense } from "react";
import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSectionsContent from "@/components/ShowsSectionsContent/ShowsSectionsContent";
import ShowsSectionsSkeleton from "@/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton";
import LotteryBanner from "@/components/LotteryBanner/LotteryBanner";
import ExploreBanner from "@/components/ExploreBanner/ExploreBanner";
import { isLotteryActive } from "@/constants/lottery";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getHeroData, getExploreBannerShows } from "@/lib/data/homepage";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

const homeTitle = "הצגות מומלצות, ביקורות ודירוגים";
const homeDescription =
  "מצאו הצגות תיאטרון בישראל לפי ביקורות קהל, דירוגים וז׳אנרים מובילים.";

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
  const [{ suggestions, featuredShow, featuredReview }, exploreShows] =
    await Promise.all([getHeroData(), getExploreBannerShows()]);

  return (
    <main className={styles.page} id="main-content">
      <Hero
        suggestions={suggestions}
        featuredShow={featuredShow}
        featuredReview={featuredReview}
      />

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

      <CtaStrip
        title="גלו את ההצגות החמות של העונה"
        text="מאות הצגות מכל התיאטראות בארץ — מצאו את ההצגה הבאה שלכם."
        buttonText="לכל ההצגות"
        href={ROUTES.SHOWS}
      />
    </main>
  );
}
