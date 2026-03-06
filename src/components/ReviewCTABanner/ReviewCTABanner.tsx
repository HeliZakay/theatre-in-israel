import styles from "./ReviewCTABanner.module.css";
import Button from "@/components/Button/Button";
import ROUTES from "@/constants/routes";

export default function ReviewCTABanner() {
  return (
    <section className={styles.banner} aria-label="כתיבת ביקורת">
      <h2 className={styles.headline}>ראיתם הצגה לאחרונה?</h2>
      <p className={styles.subtitle}>
        כתב.י ביקורת קצרה — זה לוקח פחות מדקה, ועוזר לאלפי צופים להחליט
      </p>
      <Button href={ROUTES.REVIEWS_NEW} className={styles.button}>
        כתב.י ביקורת
      </Button>
    </section>
  );
}
