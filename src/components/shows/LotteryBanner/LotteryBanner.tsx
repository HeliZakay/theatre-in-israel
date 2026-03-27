import Button from "@/components/ui/Button/Button";
import { isLotteryActive } from "@/constants/lottery";
import ROUTES from "@/constants/routes";
import styles from "./LotteryBanner.module.css";

export default function LotteryBanner() {
  if (!isLotteryActive()) return null;

  return (
    <section className={styles.banner} aria-label="הגרלה">
      <div className={styles.content}>
        <p className={styles.headline}>
          🎟️ כתב.י ביקורת וזכ.י בזוג כרטיסים לתיאטרון!
        </p>
        <p className={styles.subtitle}>כל ביקורת מאומתת = כרטיס נוסף להגרלה</p>
      </div>
      <Button href={ROUTES.REVIEWS_NEW} className={styles.button}>
        כתב.י ביקורת
      </Button>
    </section>
  );
}
