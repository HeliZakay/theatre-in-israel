import styles from "./ExploreBanner.module.css";

export default function ExploreBannerHeadline() {
  return (
    <>
      <h2 className={styles.headline}>גלו הצגות</h2>
      <p className={styles.body}>
        מגוון הצגות מכל התיאטרונים בארץ — בחרו את ההצגה הבאה שלכם
      </p>
    </>
  );
}
