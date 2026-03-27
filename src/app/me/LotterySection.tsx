"use client";

import ShareButtons from "@/components/ui/ShareButtons/ShareButtons";
import styles from "./page.module.css";
import Link from "next/link";
import ROUTES from "@/constants/routes";

interface LotterySectionProps {
  entries: number;
}

export default function LotterySection({ entries }: LotterySectionProps) {
  return (
    <section className={styles.lotterySection}>
      <p className={styles.lotteryCta}>
        כתב.י עוד ביקורות כדי להגדיל את הסיכוי לזכות! 🎟️
      </p>
      <div className={styles.lotteryActions}>
        <Link href={ROUTES.REVIEWS_NEW} className={styles.lotteryButton}>
          כתב.י ביקורת
        </Link>
        <ShareButtons
          text={
            "אני משתתף.ת בהגרלה לזוג כרטיסים לתיאטרון! כתבו ביקורות גם אתם \uD83C\uDFAD"
          }
          url="/"
        />
      </div>
    </section>
  );
}
