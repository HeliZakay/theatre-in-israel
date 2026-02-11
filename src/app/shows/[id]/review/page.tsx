import styles from "./page.module.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { getShowById } from "@/lib/showsData";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";

export const dynamic = "force-dynamic";

interface NewReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
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

      <section className={styles.contentLayout}>
        <aside className={styles.posterPanel} aria-label={`פוסטר של ${show.title}`}>
          <div className={styles.poster}>
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt={show.title}
              fill
              sizes="(max-width: 900px) 100vw, 280px"
              className={styles.posterImage}
            />
          </div>
        </aside>

        <div className={styles.formWrap}>
          <ReviewForm initialShowId={show.id} />
          <div className={styles.cancelRow}>
            <Link className={styles.ghostBtn} href={`${ROUTES.SHOWS}/${show.id}`}>
              חזרה לדף ההצגה
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
