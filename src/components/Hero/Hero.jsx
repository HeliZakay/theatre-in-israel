import styles from "./Hero.module.css";
import { SearchBar } from "../SearchBar/SearchBar";
import FeaturedShow from "../FeaturedShow/FeaturedShow";

export default function Hero() {
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
          <SearchBar />
        </div>
        <div className={styles.left}>
          <FeaturedShow />
        </div>
      </div>
    </section>
  );
}
