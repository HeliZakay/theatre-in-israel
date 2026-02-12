import styles from "./page.module.css";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { getShows } from "@/lib/shows";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
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

export const dynamic = "force-dynamic";

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
        <Link className={styles.ghostBtn} href={ROUTES.SHOWS}>
          ביטול
        </Link>
      </div>
    </main>
  );
}
