import styles from "./page.module.css";
import Link from "next/link";
import { getShows } from "@/lib/shows";

export default async function NewReviewPage() {
  const shows = await getShows();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>ביקורת חדשה</p>
        <h1 className={styles.title}>כתיבת ביקורת</h1>
        <p className={styles.subtitle}>בחרו הצגה ולאחר מכן כתבו ביקורת.</p>
      </header>

      <form className={styles.form} action="/api/reviews" method="post">
        <label className={styles.field}>
          <span className={styles.label}>הצגה</span>
          <select
            className={styles.select}
            name="showId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              בחרו הצגה
            </option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.title}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>שם מלא</span>
          <input
            className={styles.input}
            name="name"
            type="text"
            placeholder="שם ושם משפחה"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>כותרת הביקורת</span>
          <input
            className={styles.input}
            name="title"
            type="text"
            placeholder="לדוגמה: ערב קסום"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>דירוג</span>
          <select
            className={styles.select}
            name="rating"
            defaultValue=""
            required
          >
            <option value="" disabled>
              בחרו דירוג
            </option>
            <option value="5">5 - מצוין</option>
            <option value="4">4 - טוב מאוד</option>
            <option value="3">3 - סביר</option>
            <option value="2">2 - פחות</option>
            <option value="1">1 - לא מומלץ</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>תגובה</span>
          <textarea
            className={styles.textarea}
            name="comment"
            rows={6}
            placeholder="ספרו מה אהבתם, מה פחות, למי הייתם ממליצים..."
            required
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="submit">
            שליחת ביקורת
          </button>
          <Link className={styles.ghostBtn} href="/shows">
            ביטול
          </Link>
        </div>
      </form>
    </main>
  );
}
