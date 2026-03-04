import styles from "./ExploreBanner.module.css";

export default function ExploreBannerHeadline() {
  return (
    <>
      <h2 className={styles.headline}>גלו הצגות חדשות</h2>
      <p className={styles.body}>
        מגוון הצגות מהתיאטרונים המובילים בארץ — בחרו את ההצגה הבאה שלכם
      </p>
    </>
  );
}
