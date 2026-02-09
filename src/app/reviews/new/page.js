import styles from "./page.module.css";
import Link from "next/link";
import { getShows } from "@/lib/shows";
import ReviewForm from "@/components/ReviewForm/ReviewForm";

export default async function NewReviewPage() {
  const shows = await getShows();
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>ביקורת חדשה</p>
        <h1 className={styles.title}>כתיבת ביקורת</h1>
        <p className={styles.subtitle}>בחרו הצגה ולאחר מכן כתבו ביקורת.</p>
      </header>

      <ReviewForm shows={shows} />

      <div style={{ marginTop: 12 }}>
        <Link className={styles.ghostBtn} href="/shows">
          ביטול
        </Link>
      </div>
    </main>
  );
}
