import styles from "./loading.module.css";

export default function GlobalLoading() {
  return (
    <main
      className={styles.page}
      id="main-content"
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.stageGlow} aria-hidden="true" />
      <section className={styles.card}>
        <p className={styles.kicker}>תיאטרון בישראל</p>
        <h2 className={styles.title}>מעלים את המסך...</h2>
        <p className={styles.subtitle}>טוענים את התוכן הבא עבורך</p>

        <div className={styles.loaderRow}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.loaderText}>טוען נתונים</span>
        </div>

        <div className={styles.dotRow} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
