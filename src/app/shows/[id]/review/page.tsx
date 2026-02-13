import styles from "./page.module.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import ROUTES from "@/constants/routes";
import { requireAuth } from "@/lib/auth";
import { getShowById } from "@/lib/data/showDetail";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface NewReviewPageProps {
  params: Promise<{ id: string }>;
}

const getShowForReviewPage = cache(async (showId: string) =>
  getShowById(showId),
);

export async function generateMetadata({
  params,
}: NewReviewPageProps): Promise<Metadata> {
  const { id: showId } = await params;
  const show = await getShowForReviewPage(showId);

  if (!show) {
    return {
      title: "כתיבת ביקורת",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `כתיבת ביקורת על ${show.title}`,
    description: `טופס כתיבת ביקורת להצגה ${show.title}.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `כתיבת ביקורת על ${show.title} | ${SITE_NAME}`,
      description: `טופס כתיבת ביקורת להצגה ${show.title}.`,
      url: `${ROUTES.SHOWS}/${show.id}/review`,
    },
  };
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { id: showId } = await params;
  await requireAuth(`${ROUTES.SHOWS}/${showId}/review`);

  const show = await getShowForReviewPage(showId);

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
        <aside
          className={styles.posterPanel}
          aria-label={`פוסטר של ${show.title}`}
        >
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
            <Link
              className={styles.ghostBtn}
              href={`${ROUTES.SHOWS}/${show.id}`}
            >
              חזרה לדף ההצגה
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
