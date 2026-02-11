import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getHomePageData } from "@/lib/showsData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const {
    suggestions,
    topRated,
    latestReviewed,
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
        kicker="חדש"
        title="ביקורות אחרונות"
        shows={latestReviewed}
        linkHref="/shows"
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="קומדיות"
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}?genre=${encodeURIComponent("קומדיה")}`}
        linkText="לכל הקומדיות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="מוזיקלי"
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}?genre=${encodeURIComponent("מוזיקלי")}`}
        linkText="לכל המוזיקליים"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="הכי ישראלי"
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}?genre=${encodeURIComponent("ישראלי")}`}
        linkText="לכל הישראליים"
      />

      <CtaStrip
        title="כתבו ביקורת ועזרו לאחרים לבחור"
        text="כמה דקות של כתיבה יכולות לחסוך לקהל ערב לא מוצלח."
        buttonText="כתיבת ביקורת"
        href="/reviews/new"
      />
    </main>
  );
}
