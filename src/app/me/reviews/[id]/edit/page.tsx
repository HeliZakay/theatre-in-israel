import { notFound } from "next/navigation";
import ROUTES from "@/constants/routes";
import { requireAuth } from "@/lib/auth";
import { getReviewByOwner } from "@/lib/shows";
import EditReviewForm from "./EditReviewForm";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "עריכת ביקורת",
  description: "עריכת ביקורת שנכתבה על ידך.",
  robots: {
    index: false,
    follow: false,
  },
};

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const session = await requireAuth(ROUTES.MY_REVIEWS);

  const { id } = await params;
  const reviewId = Number.parseInt(id, 10);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    notFound();
  }

  const review = await getReviewByOwner(reviewId, session.user.id);
  if (!review) {
    notFound();
  }

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>עריכת ביקורת</p>
        <h1 className={styles.title}>{review.show.title}</h1>
        <p className={styles.subtitle}>עדכנו את הכותרת, הדירוג או הטקסט.</p>
      </header>

      <EditReviewForm
        reviewId={review.id}
        showId={review.showId}
        initialTitle={review.title ?? ""}
        initialRating={review.rating}
        initialText={review.text}
      />
    </main>
  );
}
