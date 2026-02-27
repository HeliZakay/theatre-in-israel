import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getShowOptions } from "@/lib/reviews";
import { requireAuth } from "@/lib/auth";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
import CancelButton from "./CancelButton";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כתיבת ביקורת חדשה",
  description: "טופס כתיבת ביקורת להצגה באתר תיאטרון בישראל.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `כתיבת ביקורת חדשה | ${SITE_NAME}`,
    description: "טופס כתיבת ביקורת להצגה באתר תיאטרון בישראל.",
    url: ROUTES.REVIEWS_NEW,
  },
};

// Must remain dynamic: requires authentication
export const dynamic = "force-dynamic";

export default async function NewReviewPage() {
  await requireAuth(ROUTES.REVIEWS_NEW);

  const shows = await getShowOptions();
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>ביקורת חדשה</p>
        <h1 className={styles.title}>כתב.י ביקורת</h1>
        <p className={styles.subtitle}>בחר.י הצגה ולאחר מכן כתב.י ביקורת.</p>
      </header>

      <ReviewForm shows={shows} />

      <CancelButton />
    </main>
  );
}
