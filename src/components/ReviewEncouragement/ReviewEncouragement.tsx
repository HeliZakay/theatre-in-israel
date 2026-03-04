import styles from "./ReviewEncouragement.module.css";
import Card from "@/components/Card/Card";
import Button from "@/components/Button/Button";
import { cx } from "@/utils/cx";

interface ReviewEncouragementProps {
  variant: "empty" | "after-reviews";
  reviewHref: string;
}

export default function ReviewEncouragement({
  variant,
  reviewHref,
}: ReviewEncouragementProps) {
  if (variant === "empty") {
    return (
      <Card className={cx(styles.card, styles.empty)}>
        <span className={styles.emoji} aria-hidden="true">
          🎭
        </span>
        <h3 className={styles.headline}>היו הראשונים לכתוב ביקורת!</h3>
        <p className={styles.body}>
          ראיתם את ההצגה? כל מילה שלכם שווה זהב — גם משפט אחד עוזר לאחרים
          להחליט.
        </p>
        <Button href={reviewHref} className={styles.button}>
          כתב.י ביקורת
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cx(styles.card, styles.afterReviews)}>
      <h3 className={styles.headline}>ראיתם את ההצגה? ספרו גם מה חשבתם</h3>
      <p className={styles.body}>
        הדעה שלכם חשובה לנו ולקהילה — גם מילה או שתיים מספיקות 🎭
      </p>
      <Button href={reviewHref} className={styles.button}>
        כתב.י ביקורת
      </Button>
    </Card>
  );
}
