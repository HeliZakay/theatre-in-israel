import ShowsSection from "@/components/ShowsSection/ShowsSection";
import { getSectionsData } from "@/lib/data/homepage";
import ROUTES from "@/constants/routes";
import { buildShowsQueryString } from "@/utils/showsQuery";

export default async function ShowsSectionsContent() {
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
        kicker="ז'אנר"
        title="דרמות"
        shows={dramas}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["דרמה", "דרמה קומית"] })}`}
        linkText="לכל הדרמות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="קומדיות"
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["קומדיה", "קומדיה שחורה", "סאטירה"] })}`}
        linkText="לכל הקומדיות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="מוזיקלי"
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["מוזיקלי", "מחזמר"] })}`}
        linkText="לכל המוזיקליים"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="הכי ישראלי"
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["ישראלי"] })}`}
        linkText="לכל הישראליים"
      />
    </>
  );
}
