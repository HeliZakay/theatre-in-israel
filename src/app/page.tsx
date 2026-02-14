import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getHomePageData } from "@/lib/data/homepage";
import { SITE_NAME } from "@/lib/seo";
import { buildShowsQueryString } from "@/utils/showsQuery";

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
};

export const revalidate = 120; // Re-generate at most every 2 minutes

export default async function Home() {
  const {
    suggestions,
    topRated,
    dramas,
    comedies,
    musicals,
    israeli,
    featuredShow,
  } = await getHomePageData();

  return (
    <main className={styles.page} id="main-content">
      <Hero suggestions={suggestions} featuredShow={featuredShow} />

      <ShowsSection
        kicker="המובילים"
        title="דירוגים גבוהים"
        shows={topRated}
        linkHref={ROUTES.SHOWS}
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="דרמות"
        shows={dramas}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["דרמה", "דרמה קומית", "רגשי"] })}`}
        linkText="לכל הדרמות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="קומדיות"
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["קומדיה"] })}`}
        linkText="לכל הקומדיות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="מוזיקלי"
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["מוזיקלי"] })}`}
        linkText="לכל המוזיקליים"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="הכי ישראלי"
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["ישראלי"] })}`}
        linkText="לכל הישראליים"
      />

      <CtaStrip
        title="כתבו ביקורת ועזרו לאחרים לבחור"
        text="כמה דקות של כתיבה יכולות לחסוך לקהל ערב לא מוצלח."
        buttonText="כתיבת ביקורת"
        href={ROUTES.REVIEWS_NEW}
      />
    </main>
  );
}
