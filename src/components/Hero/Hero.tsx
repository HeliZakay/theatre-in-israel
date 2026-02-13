import styles from "./Hero.module.css";
import SearchBar from "../SearchBar/SearchBar";
import FeaturedShow from "../FeaturedShow/FeaturedShow";
import { getShowImagePath } from "@/utils/getShowImagePath";
import ROUTES from "@/constants/routes";
import type { EnrichedShow, Suggestions } from "@/types";

interface HeroProps {
  suggestions?: Suggestions;
  featuredShow?: EnrichedShow | null;
}

export default function Hero({
  suggestions = { shows: [], theatres: [], genres: [] },
  featuredShow = null,
}: HeroProps) {
  const featuredTags: string[] = featuredShow
    ? [
        ...(featuredShow.genre ?? []).slice(0, 2),
        featuredShow.durationMinutes
          ? `${featuredShow.durationMinutes} דקות`
          : null,
      ].filter((t): t is string => t !== null)
    : [];

  const featuredQuote = featuredShow?.reviews?.[0]?.text ?? null;
  const featuredAuthor = featuredShow?.reviews?.[0]?.author ?? null;

  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.inner}>
        <div className={styles.right}>
          <div>
            <h1 className={styles.title}>דירוגים וביקורות להצגות בישראל</h1>
            <p className={styles.subtitle}>
              לפני שקונים כרטיס – בודקים מה הקהל חושב.
            </p>
          </div>
          <SearchBar suggestions={suggestions} />
        </div>
        {featuredShow ? (
          <div className={styles.left}>
            <FeaturedShow
              title={featuredShow.title}
              imageSrc={getShowImagePath(featuredShow.title)}
              tags={featuredTags}
              quote={featuredQuote ?? ""}
              quoteAuthor={featuredAuthor ?? ""}
              avgRating={featuredShow.avgRating ?? null}
              reviewCount={featuredShow.reviews?.length ?? 0}
              href={`${ROUTES.SHOWS}/${featuredShow.id}`}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
