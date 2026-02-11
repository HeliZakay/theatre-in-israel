import styles from "./Hero.module.css";
import SearchBar from "../SearchBar/SearchBar";
import FeaturedShow from "../FeaturedShow/FeaturedShow";
import { getShowImagePath } from "@/utils/getShowImagePath";

export default function Hero({ suggestions = {}, featuredShow = null }) {
  const featuredTags = featuredShow
    ? [
        ...(featuredShow.genre ?? []).slice(0, 2),
        featuredShow.durationMinutes
          ? `${featuredShow.durationMinutes} דקות`
          : null,
      ].filter(Boolean)
    : ["מחזמר", "2 שעות"];

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
        <div className={styles.left}>
          <FeaturedShow
            title={featuredShow?.title ?? "גבירתי הנאווה"}
            imageSrc={
              featuredShow
                ? getShowImagePath(featuredShow.title)
                : "/my-fair-lady.jpg"
            }
            tags={featuredTags}
            quote={featuredQuote ?? "ממש מצחיק ושחקנים מעולים!"}
            quoteAuthor={featuredAuthor ?? "חלי, רחובות"}
            avgRating={featuredShow?.avgRating ?? null}
            reviewCount={featuredShow?.reviews?.length ?? 0}
          />
        </div>
      </div>
    </section>
  );
}
