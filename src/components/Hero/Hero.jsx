import styles from "./Hero.module.css";
import SearchBar from "../SearchBar/SearchBar";
import FeaturedShow from "../FeaturedShow/FeaturedShow";

export default function Hero({ suggestions = {} }) {
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
            title="גבירתי הנאווה"
            imageSrc="/my-fair-lady.jpg"
            tags={["מחזמר", "2 שעות"]}
            quote="ממש מצחיק ושחקנים מעולים!"
            quoteAuthor="חלי, רחובות"
          />
        </div>
      </div>
    </section>
  );
}
