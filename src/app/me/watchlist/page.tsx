import ROUTES from "@/constants/routes";
import { authOptions, type AuthenticatedSession } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getWatchlistShowIds } from "@/lib/watchlist";
import { fetchShowListItemsWithEvents } from "@/lib/showHelpers";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import Button from "@/components/ui/Button/Button";
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
  const session = (await getServerSession(authOptions)) as AuthenticatedSession;

  const showIds = await getWatchlistShowIds(session.user.id);
  const shows = await fetchShowListItemsWithEvents(showIds);

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>רשימת הצפייה שלי</h1>
        <p className={styles.subtitle}>הצגות ששמרת לצפייה מאוחרת.</p>
      </header>

      {shows.length ? (
        <section className={styles.grid}>
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
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
