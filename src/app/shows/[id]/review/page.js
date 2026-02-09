import styles from "./page.module.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { getShows } from "@/lib/shows";
import { getShowById } from "@/lib/showsData";
import ReviewForm from "@/components/ReviewForm/ReviewForm";

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

      <ReviewForm initialShowId={show.id} />
      <div style={{ marginTop: 12 }}>
        <Link className={styles.ghostBtn} href={`${ROUTES.SHOWS}/${show.id}`}>
          חזרה לדף ההצגה
        </Link>
      </div>
    </main>
  );
}
