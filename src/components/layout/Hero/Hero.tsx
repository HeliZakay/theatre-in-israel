import styles from "./Hero.module.css";
import SearchBar from "@/components/ui/SearchBar/SearchBar";
import FeaturedShow from "@/components/shows/FeaturedShow/FeaturedShow";
import { getShowImagePath } from "@/utils/getShowImagePath";
import ROUTES, { showPath } from "@/constants/routes";
import { formatReviewMilestone } from "@/utils/formatReviewCount";
import type { ShowListItem, Suggestions } from "@/types";
import type { FeaturedReview, PlatformStats } from "@/lib/data/homepage";

function roundDownToHundred(n: number): number {
  return Math.floor(n / 100) * 100;
}

interface HeroProps {
  suggestions?: Suggestions;
  featuredShow?: ShowListItem | null;
  featuredReview?: FeaturedReview | null;
  totalReviewCount?: number;
  platformStats?: PlatformStats | null;
}

export default function Hero({
  suggestions = { shows: [], theatres: [], genres: [] },
  featuredShow = null,
  featuredReview = null,
  totalReviewCount = 0,
  platformStats = null,
}: HeroProps) {
  const featuredTags: string[] = featuredShow
    ? [
        ...(featuredShow.genre ?? []).slice(0, 2),
        featuredShow.durationMinutes
          ? `${featuredShow.durationMinutes} דקות`
          : null,
      ].filter((t): t is string => t !== null)
    : [];

  const featuredQuote = featuredReview?.text ?? null;
  const featuredAuthor = featuredReview?.author ?? null;

  return (
    <section className={styles.hero} aria-label="מדור ראשי">
      <div className={styles.inner}>
        <div className={styles.right}>
          <div>
            <h1 className={styles.title}>דירוגים וביקורות להצגות בישראל</h1>
            <p className={styles.subtitle}>
              לפני שקונים כרטיס – בודקים מה הקהל חושב.
            </p>
            {platformStats && platformStats.upcomingEvents > 0 ? (
              <p className={styles.statsStrip}>
                <span className={styles.statItem}>
                  <span className={styles.statLabel}>מעל </span>
                  <bdi className={styles.statNumber} dir="ltr">{roundDownToHundred(platformStats.upcomingEvents).toLocaleString("en-US")}</bdi>
                  <span className={styles.statLabel}> מועדי הצגות קרובים</span>
                </span>
                <span className={styles.statSeparator} aria-hidden="true">·</span>
                <span className={styles.statItem}>
                  <bdi className={styles.statNumber} dir="ltr">{platformStats.theatres}</bdi>
                  <span className={styles.statLabel}> תיאטראות ב-</span>
                  <bdi className={styles.statNumber} dir="ltr">{platformStats.cities}</bdi>
                  <span className={styles.statLabel}> ערים</span>
                </span>
                <span className={styles.statSeparator} aria-hidden="true">·</span>
                <span className={styles.statItem}>
                  <span className={styles.statLabel}>מעל </span>
                  <bdi className={styles.statNumber} dir="ltr">{roundDownToHundred(platformStats.reviews).toLocaleString("en-US")}</bdi>
                  <span className={styles.statLabel}> ביקורות צופים</span>
                </span>
              </p>
            ) : totalReviewCount >= 100 ? (
              <p className={styles.socialProof}>
                <span className={styles.socialProofStar}>★</span>{" "}
                {formatReviewMilestone(totalReviewCount)} ביקורות צופים
              </p>
            ) : null}
          </div>
          <SearchBar suggestions={suggestions} />
        </div>
        {featuredShow ? (
          <div className={styles.left}>
            <FeaturedShow
              title={featuredShow.title}
              theatre={featuredShow.theatre}
              imageSrc={getShowImagePath(featuredShow.title)}
              tags={featuredTags}
              quote={featuredQuote ?? ""}
              quoteAuthor={featuredAuthor ?? ""}
              avgRating={featuredShow.avgRating ?? null}
              reviewCount={featuredShow.reviewCount ?? 0}
              href={showPath(featuredShow.slug ?? String(featuredShow.id))}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
