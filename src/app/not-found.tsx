import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page} id="main-content">
      <h1 className={styles.title}>404 — הדף לא נמצא</h1>
      <p className={styles.message}>הדף שחיפשת לא קיים או שהוסר.</p>
      <Link href="/" className={styles.homeLink}>
        חזרה לדף הבית
      </Link>
    </main>
  );
}
