import styles from "./SecurityBanner.module.css";

export default function SecurityBanner() {
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
