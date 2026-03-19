/**
 * Theatre slug ↔ display-name mapping.
 * Slugs are Latin for clean URLs; display names are Hebrew.
 * The `theatre` column in the DB stores the Hebrew display name.
 */

export interface TheatreInfo {
  /** URL slug (Latin) */
  slug: string;
  /** Hebrew display name (matches Show.theatre in DB) */
  name: string;
  /** Path to theatre image in /public */
  image: string;
}

export const THEATRES: TheatreInfo[] = [
  { slug: "cameri", name: "תיאטרון הקאמרי", image: "/תיאטרון-הקאמרי.webp" },
  { slug: "habima", name: "תיאטרון הבימה", image: "/תיאטרון-הבימה.webp" },
  { slug: "gesher", name: "תיאטרון גשר", image: "/תיאטרון-גשר.webp" },
  { slug: "beit-lessin", name: "תיאטרון בית ליסין", image: "/תיאטרון-בית-ליסין.webp" },
  { slug: "haifa", name: "תיאטרון חיפה", image: "/תיאטרון-חיפה.webp" },
  { slug: "beer-sheva", name: "תיאטרון באר שבע", image: "/תיאטרון-באר-שבע.webp" },
  { slug: "khan", name: "תיאטרון החאן", image: "/תיאטרון-החאן.webp" },
  { slug: "hebrew-theatre", name: "התיאטרון העברי", image: "/תיאטרון-העברי.webp" },
  { slug: "tmuna", name: "תיאטרון תמונע", image: "/תיאטרון-תמונע.webp" },
  { slug: "tzavta", name: "תיאטרון צוותא", image: "/תיאטרון-צוותא.webp" },
  { slug: "tomix", name: "תיאטרון toMix", image: "/תיאטרון-tomix.webp" },
];

/** Map from URL slug → theatre info */
export const THEATRE_BY_SLUG = new Map(
  THEATRES.map((t) => [t.slug, t]),
);

/** Map from Hebrew DB name → theatre info */
export const THEATRE_BY_NAME = new Map(
  THEATRES.map((t) => [t.name, t]),
);
