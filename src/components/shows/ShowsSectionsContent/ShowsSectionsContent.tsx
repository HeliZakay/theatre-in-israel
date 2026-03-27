import type { ReactNode } from "react";
import ShowsSection from "@/components/shows/ShowsSection/ShowsSection";
import { getSectionsData } from "@/lib/data/homepage";
import ROUTES, { showPath } from "@/constants/routes";
import { buildShowsQueryString } from "@/utils/showsQuery";
import { GENRE_SECTIONS } from "@/constants/genreGroups";
import { toAbsoluteUrl, toJsonLd } from "@/lib/seo";

interface Props {
  banner?: ReactNode;
}

export default async function ShowsSectionsContent({ banner }: Props) {
  const { topRated, dramas, comedies, musicals, israeli, kids } =
    await getSectionsData();

  const itemListJsonLd =
    topRated.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "הצגות מומלצות — דירוגים גבוהים",
          itemListElement: topRated.map((show, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: show.title,
            url: toAbsoluteUrl(showPath(show.slug)),
          })),
        }
      : null;

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}
      <ShowsSection
        kicker="המובילים"
        title="דירוגים גבוהים"
        shows={topRated}
        linkHref={`${ROUTES.SHOWS}#results`}
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.dramas.kicker}
        title={GENRE_SECTIONS.dramas.title}
        shows={dramas}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.dramas.genres] })}#results`}
        linkText={GENRE_SECTIONS.dramas.linkText}
        sectionGenres={[...GENRE_SECTIONS.dramas.genres]}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.comedies.kicker}
        title={GENRE_SECTIONS.comedies.title}
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.comedies.genres] })}#results`}
        linkText={GENRE_SECTIONS.comedies.linkText}
        sectionGenres={[...GENRE_SECTIONS.comedies.genres]}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.musicals.kicker}
        title={GENRE_SECTIONS.musicals.title}
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.musicals.genres] })}#results`}
        linkText={GENRE_SECTIONS.musicals.linkText}
        sectionGenres={[...GENRE_SECTIONS.musicals.genres]}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.israeli.kicker}
        title={GENRE_SECTIONS.israeli.title}
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.israeli.genres] })}#results`}
        linkText={GENRE_SECTIONS.israeli.linkText}
        sectionGenres={[...GENRE_SECTIONS.israeli.genres]}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.kids.kicker}
        title={GENRE_SECTIONS.kids.title}
        shows={kids}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.kids.genres] })}#results`}
        linkText={GENRE_SECTIONS.kids.linkText}
        sectionGenres={[...GENRE_SECTIONS.kids.genres]}
      />

      {banner}
    </>
  );
}
