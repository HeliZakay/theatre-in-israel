import { Suspense } from "react";
import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSectionsContent from "@/components/ShowsSectionsContent/ShowsSectionsContent";
import ShowsSectionsSkeleton from "@/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton";
import LotteryBanner from "@/components/LotteryBanner/LotteryBanner";
import { isLotteryActive } from "@/constants/lottery";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getHeroData } from "@/lib/data/homepage";
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

export const revalidate = 120; // Re-generate at most every 2 minutes

export default async function Home() {
  const { suggestions, featuredShow, featuredReview } = await getHeroData();

  return (
    <main className={styles.page} id="main-content">
      <Hero
        suggestions={suggestions}
        featuredShow={featuredShow}
        featuredReview={featuredReview}
      />

      <LotteryBanner />

      <Suspense fallback={<ShowsSectionsSkeleton />}>
        <ShowsSectionsContent />
      </Suspense>

      <CtaStrip
        title="כתב.י ביקורת ועזר.י לאחרים לבחור"
        text={
          isLotteryActive()
            ? "כל ביקורת = כרטיס להגרלה על זוג כרטיסים לתיאטרון! 🎟️"
            : "כמה דקות של כתיבה יכולות לחסוך לקהל ערב לא מוצלח."
        }
        buttonText="כתב.י ביקורת"
        href={ROUTES.REVIEWS_NEW}
      />
    </main>
  );
}
