import * as Separator from "@radix-ui/react-separator";
import Image from "next/image";
import styles from "./FeaturedShow.module.css";

export default function FeaturedShow() {
  return (
    <article className={styles.card} aria-label="כרטיס הצגה מומלצת">
      <div className={styles.media}>
        <div className={styles.mediaRatio}>
          <Image
            src="/my-fair-lady.jpg"
            alt="גבירתי הנאווה"
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            className={styles.mediaImage}
            priority
          />
          <div className={styles.mediaShade} aria-hidden />
          <div className={styles.mediaOverlay}>
            <h3 className={styles.showTitle}>גבירתי הנאווה</h3>
            <div className={styles.tagRow}>
              <span className={styles.tag}>מחזמר</span>
              <span className={styles.tag}>תל אביב</span>
              <span className={styles.tag}>2 שעות</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <Separator.Root className={styles.separator} />
        <h3 className={styles.mobileTitle}>גבירתי הנאווה</h3>
        <div className={styles.mobileTags}>
          <span className={styles.tag}>מחזמר</span>
          <span className={styles.tag}>תל אביב</span>
          <span className={styles.tag}>2 שעות</span>
        </div>
        <blockquote className={styles.quote}>
          ממש מצחיק ושחקנים מעולים!
          <span className={styles.quoteAuthor}>חלי, רחובות</span>
        </blockquote>
      </div>
    </article>
  );
}
