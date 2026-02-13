"use client";
import Link from "next/link";
import styles from "./error.module.css";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.card}>
        <h1 className={styles.title}>אירעה שגיאה</h1>
        <p className={styles.message}>מצטערים — קרתה שגיאה במהלך טעינת הדף.</p>
        {process.env.NODE_ENV === "development" && error?.message ? (
          <pre className={styles.devError}>{error.message}</pre>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.retryButton} onClick={() => reset()}>
            נסה שוב
          </button>
          <Link href="/" className={styles.homeLink}>
            חזור לדף הבית
          </Link>
        </div>
      </section>
    </main>
  );
}
