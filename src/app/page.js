import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import styles from "./page.module.css";
import { getHomePageData } from "@/lib/showsData";

export default async function Home() {
  const { suggestions, topRated, latestReviewed } = await getHomePageData();

  return (
    <main className={styles.page} id="main-content">
      <Hero suggestions={suggestions} />

      <ShowsSection
        kicker="המובילים"
        title="דירוגים גבוהים"
        shows={topRated}
        linkHref="/shows"
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker="חדש"
        title="ביקורות אחרונות"
        shows={latestReviewed}
        linkHref="/shows"
        linkText="לכל ההצגות"
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
