import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import styles from "./page.module.css";
import { getShows, getAverageRating, getLatestReviewDate } from "@/lib/shows";

export default async function Home() {
  const shows = await getShows();
  const enrichedShows = shows.map((show) => ({
    ...show,
    avgRating: getAverageRating(show.reviews),
    latestReviewDate: getLatestReviewDate(show.reviews),
  }));
  const topRated = enrichedShows
    .filter((s) => s.avgRating !== null)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 6);

  const latestReviewed = enrichedShows
    .filter((s) => s.latestReviewDate)
    .sort((a, b) => b.latestReviewDate - a.latestReviewDate)
    .slice(0, 6);

  return (
    <main className={styles.page} id="main-content">
      <Hero />

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
