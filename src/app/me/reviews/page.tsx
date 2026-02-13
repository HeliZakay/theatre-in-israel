import Link from "next/link";
import ROUTES from "@/constants/routes";
import { requireAuth } from "@/lib/auth";
import { getReviewsByUser } from "@/lib/shows";
import { formatDate } from "@/utils/formatDate";
import Button from "@/components/Button/Button";
import DeleteReviewButton from "./DeleteReviewButton";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הביקורות שלי",
  description: "האזור האישי לניהול ביקורות שנכתבו באתר.",
  robots: {
    index: false,
    follow: false,
  },
};

// Must remain dynamic: requires authentication
export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const session = await requireAuth(ROUTES.MY_REVIEWS);

  const reviews = await getReviewsByUser(session.user.id);

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>הביקורות שלי</h1>
        <p className={styles.subtitle}>ניהול כל הביקורות שכתבת במקום אחד.</p>
      </header>

      {reviews.length ? (
        <section className={styles.list}>
          {reviews.map((review) => (
            <article key={review.id} className={styles.card}>
              <header className={styles.cardHeader}>
                <Link
                  className={styles.showLink}
                  href={`${ROUTES.SHOWS}/${review.show.id}`}
                >
                  {review.show.title}
                </Link>
                <div className={styles.meta}>
                  <span>★{review.rating}</span>
                  <span>•</span>
                  <span>{formatDate(review.date)}</span>
                </div>
              </header>

              <h2 className={styles.reviewTitle}>
                {review.title?.trim() || "ללא כותרת"}
              </h2>
              <p className={styles.reviewText}>{review.text}</p>

              <div className={styles.cardActions}>
                <Link
                  className={styles.editBtn}
                  href={`${ROUTES.MY_REVIEWS}/${review.id}/edit`}
                >
                  עריכה
                </Link>
                <DeleteReviewButton reviewId={review.id} />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <p>עדיין לא כתבת ביקורות.</p>
          <Button href={ROUTES.REVIEWS_NEW} aria-label="כתיבת ביקורת">
            לכתוב ביקורת
          </Button>
          <Link className={styles.linkBtn} href={ROUTES.SHOWS}>
            מעבר לכל ההצגות
          </Link>
        </section>
      )}
    </main>
  );
}
