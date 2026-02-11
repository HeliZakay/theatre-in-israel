import styles from "./loading.module.css";

export default function GlobalLoading() {
  return (
    <main
      className={styles.page}
      id="main-content"
      aria-busy="true"
      aria-live="polite"
    >
      <section className={styles.card}>
        <h2 className={styles.title}>טוענים תוצאות</h2>
        <p className={styles.subtitle}>זה ייקח רק רגע</p>

        <div className={styles.loaderRow}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.loaderText}>מעדכנים נתונים...</span>
        </div>
      </section>
    </main>
  );
}
