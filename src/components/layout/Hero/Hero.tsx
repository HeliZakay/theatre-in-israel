import styles from "./Hero.module.css";
import SearchBar from "@/components/ui/SearchBar/SearchBar";
import FeaturedShow from "@/components/shows/FeaturedShow/FeaturedShow";
import { getShowImagePath } from "@/utils/getShowImagePath";
import ROUTES, { showPath } from "@/constants/routes";
import { formatReviewMilestone } from "@/utils/formatReviewCount";
import type { ShowListItem, Suggestions } from "@/types";
import type { FeaturedReview } from "@/lib/data/homepage";

interface HeroProps {
  suggestions?: Suggestions;
  featuredShow?: ShowListItem | null;
  featuredReview?: FeaturedReview | null;
  totalReviewCount?: number;
}

export default function Hero({
  suggestions = { shows: [], theatres: [], genres: [] },
  featuredShow = null,
  featuredReview = null,
  totalReviewCount = 0,
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
            {totalReviewCount >= 100 ? (
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
