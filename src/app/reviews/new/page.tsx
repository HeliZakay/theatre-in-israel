import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getShowOptions } from "@/lib/reviews";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
import CancelButton from "./CancelButton";
import { SITE_NAME } from "@/lib/seo";
import ReviewAuthGateway from "@/components/ReviewAuthGateway/ReviewAuthGateway";

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

// Must remain dynamic: checks authentication status
export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const { guest } = await searchParams;

  const isAuthenticated = !!session;

  if (!isAuthenticated && guest !== "1") {
    return <ReviewAuthGateway callbackUrl={ROUTES.REVIEWS_NEW} />;
  }

  const shows = await getShowOptions();
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>ביקורת חדשה</p>
        <h1 className={styles.title}>כתב.י ביקורת</h1>
        <p className={styles.subtitle}>בחר.י הצגה ולאחר מכן כתב.י ביקורת.</p>
      </header>

      <ReviewForm shows={shows} isAuthenticated={isAuthenticated} />

      <CancelButton />
    </main>
  );
}
