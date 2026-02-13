import { getShowsForList } from "@/lib/data/showsList";
import BackLink from "@/components/BackLink/BackLink";
import ROUTES from "@/constants/routes";
import { DEFAULT_SORT } from "@/constants/sorts";
import { SITE_NAME, toAbsoluteUrl, toJsonLd } from "@/lib/seo";
import {
  buildShowsQueryString,
  parseShowsSearchParams,
} from "@/utils/showsQuery";
import styles from "./page.module.css";
import ShowsContent from "./ShowsContent";

import type { Metadata } from "next";

// Must remain dynamic: depends on searchParams for filtering/pagination
export const dynamic = "force-dynamic";

interface ShowsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildShowsSeo(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const filters = parseShowsSearchParams(searchParams);
  const canonicalQuery = buildShowsQueryString({
    query: filters.query || undefined,
    theatre: filters.theatre || undefined,
    genres: filters.genres,
    sort: filters.sort,
    page: filters.page,
  });
  const canonicalPath = `${ROUTES.SHOWS}${canonicalQuery}`;

  const titleBits: string[] = [];
  if (filters.theatre) titleBits.push(`תיאטרון ${filters.theatre}`);
  if (filters.genres.length === 1) titleBits.push(`ז׳אנר ${filters.genres[0]}`);
  if (filters.genres.length > 1) titleBits.push("מספר ז׳אנרים");
  if (filters.query) titleBits.push(`חיפוש: ${filters.query}`);

  const pageLabel = filters.page > 1 ? ` - עמוד ${filters.page}` : "";
  const title = titleBits.length
    ? `הצגות לפי סינון${pageLabel}`
    : `כל ההצגות והביקורות${pageLabel}`;

  const description = titleBits.length
    ? `מצאו הצגות תיאטרון בישראל לפי ${titleBits.join(", ")} וקראו ביקורות קהל.`
    : "מאגר הצגות תיאטרון בישראל עם ביקורות קהל, דירוגים וסינון לפי ז׳אנר ותיאטרון.";

  const shouldNoindex =
    Boolean(filters.query.trim()) ||
    filters.page > 1 ||
    filters.sort !== DEFAULT_SORT;

  return { canonicalPath, description, shouldNoindex, title };
}

export async function generateMetadata({
  searchParams,
}: ShowsPageProps): Promise<Metadata> {
  const seo = buildShowsSeo(await searchParams);

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalPath,
    },
    robots: seo.shouldNoindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: `${seo.title} | ${SITE_NAME}`,
      description: seo.description,
      url: seo.canonicalPath,
    },
  };
}

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { shows, theatres, genres, filters } =
    await getShowsForList(resolvedSearchParams);
  const seo = buildShowsSeo(resolvedSearchParams);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "עמוד הבית",
        item: toAbsoluteUrl(ROUTES.HOME),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "הצגות",
        item: toAbsoluteUrl(seo.canonicalPath),
      },
    ],
  };

  const itemListJsonLd =
    shows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "רשימת הצגות",
          itemListElement: shows.map((show, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: show.title,
            url: toAbsoluteUrl(`${ROUTES.SHOWS}/${show.id}`),
          })),
        }
      : null;

  return (
    <main className={styles.page} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      ) : null}
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
