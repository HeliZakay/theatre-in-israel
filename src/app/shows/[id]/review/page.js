import styles from "./page.module.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getShows } from "@/lib/shows";
import { getShowById } from "@/lib/showsData";

export async function generateStaticParams() {
  const shows = await getShows();
  return shows.map((show) => ({
    id: String(show.id),
  }));
}

export default async function NewReviewPage({ params }) {
  const { id: showId } = await params;
  const show = await getShowById(showId);

  if (!show) {
    notFound();
  }

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>ביקורת חדשה</p>
        <h1 className={styles.title}>{show.title}</h1>
        <p className={styles.subtitle}>ספרו לקהל מה חשבתם על ההצגה.</p>
      </header>

      <form className={styles.form} action="/api/reviews" method="post">
        <input type="hidden" name="showId" value={show.id} />
        <label className={styles.field}>
          <span className={styles.label}>שם מלא</span>
          <input
            className={styles.input}
            name="name"
            type="text"
            placeholder="מה שמך?"
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
          <Link className={styles.ghostBtn} href={`/shows/${show.id}`}>
            חזרה לדף ההצגה
          </Link>
        </div>
      </form>
    </main>
  );
}
