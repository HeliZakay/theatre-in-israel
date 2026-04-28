"use client";

import { usePathname } from "next/navigation";
import styles from "./SecurityBanner.module.css";

const ENABLED = false;

export default function SecurityBanner() {
  const pathname = usePathname();
  if (!ENABLED) return null;
  if (pathname.startsWith("/reviews/batch")) return null;

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.text}>
        <strong>שימו לב:</strong> בשל המצב הביטחוני, ייתכנו שינויים במועדי
        ההופעות. מומלץ לוודא את המועדים המעודכנים באתר התיאטרון או אולם
        ההופעות.
      </p>
    </div>
  );
}
