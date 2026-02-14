import Link from "next/link";
import ROUTES from "@/constants/routes";
import { requireAuth } from "@/lib/auth";
import { getWatchlistShowIds } from "@/lib/watchlist";
import { fetchShowsByIds } from "@/lib/showHelpers";
import ShowCard from "@/components/ShowCard/ShowCard";
import Button from "@/components/Button/Button";
import RemoveFromWatchlistButton from "./RemoveFromWatchlistButton";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "רשימת הצפייה שלי",
  description: "הצגות ששמרת לצפייה מאוחרת.",
  robots: {
    index: false,
    follow: false,
  },
};

// Must remain dynamic: requires authentication
export const dynamic = "force-dynamic";

export default async function MyWatchlistPage() {
  const session = await requireAuth(ROUTES.MY_WATCHLIST);

  const showIds = await getWatchlistShowIds(session.user.id);
  const shows = await fetchShowsByIds(showIds);

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>רשימת הצפייה שלי</h1>
        <p className={styles.subtitle}>הצגות ששמרת לצפייה מאוחרת.</p>
      </header>

      <Link className={styles.navLink} href={ROUTES.MY_REVIEWS}>
        לביקורות שלי ←
      </Link>

      {shows.length ? (
        <section className={styles.grid}>
          {shows.map((show) => (
            <div key={show.id} className={styles.gridItem}>
              <ShowCard show={show} />
              <RemoveFromWatchlistButton showId={show.id} />
            </div>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <p>עדיין לא הוספת הצגות לרשימת הצפייה.</p>
          <Button href={ROUTES.SHOWS} aria-label="מעבר לכל ההצגות">
            לכל ההצגות
          </Button>
        </section>
      )}
    </main>
  );
}
