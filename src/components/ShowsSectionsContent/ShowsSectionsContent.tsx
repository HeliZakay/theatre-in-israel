import type { ReactNode } from "react";
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import { getSectionsData } from "@/lib/data/homepage";
import ROUTES from "@/constants/routes";
import { buildShowsQueryString } from "@/utils/showsQuery";
import { GENRE_SECTIONS } from "@/constants/genreGroups";

interface Props {
  banner?: ReactNode;
}

export default async function ShowsSectionsContent({ banner }: Props) {
  const { topRated, dramas, comedies, musicals, israeli } =
    await getSectionsData();

  return (
    <>
      <ShowsSection
        kicker="המובילים"
        title="דירוגים גבוהים"
        shows={topRated}
        linkHref={ROUTES.SHOWS}
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.dramas.kicker}
        title={GENRE_SECTIONS.dramas.title}
        shows={dramas}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.dramas.genres] })}`}
        linkText={GENRE_SECTIONS.dramas.linkText}
      />

      {banner}

      <ShowsSection
        kicker={GENRE_SECTIONS.comedies.kicker}
        title={GENRE_SECTIONS.comedies.title}
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.comedies.genres] })}`}
        linkText={GENRE_SECTIONS.comedies.linkText}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.musicals.kicker}
        title={GENRE_SECTIONS.musicals.title}
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.musicals.genres] })}`}
        linkText={GENRE_SECTIONS.musicals.linkText}
      />

      <ShowsSection
        kicker={GENRE_SECTIONS.israeli.kicker}
        title={GENRE_SECTIONS.israeli.title}
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: [...GENRE_SECTIONS.israeli.genres] })}`}
        linkText={GENRE_SECTIONS.israeli.linkText}
      />
    </>
  );
}
