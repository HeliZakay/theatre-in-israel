import { getShowsForList } from "@/lib/showsData";
import BackLink from "@/components/BackLink/BackLink";
import ROUTES from "@/constants/routes";
import styles from "./page.module.css";
import ShowsContent from "./ShowsContent";

export const dynamic = "force-dynamic";

interface ShowsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const { shows, theatres, genres, filters } = await getShowsForList(
    await searchParams,
  );

  return (
    <main className={styles.page} id="main-content">
      <BackLink href={ROUTES.HOME} />
      <ShowsContent
        shows={shows}
        theatres={theatres}
        genres={genres}
        filters={filters}
      />
    </main>
  );
}
