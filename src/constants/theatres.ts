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
  { slug: "cameri", name: "תיאטרון הקאמרי", image: "/images/theatres/תיאטרון-הקאמרי.webp" },
  { slug: "habima", name: "תיאטרון הבימה", image: "/images/theatres/תיאטרון-הבימה.webp" },
  { slug: "gesher", name: "תיאטרון גשר", image: "/images/theatres/תיאטרון-גשר.webp" },
  { slug: "beit-lessin", name: "תיאטרון בית ליסין", image: "/images/theatres/תיאטרון-בית-ליסין.webp" },
  { slug: "haifa", name: "תיאטרון חיפה", image: "/images/theatres/תיאטרון-חיפה.webp" },
  { slug: "beer-sheva", name: "תיאטרון באר שבע", image: "/images/theatres/תיאטרון-באר-שבע.webp" },
  { slug: "khan", name: "תיאטרון החאן", image: "/images/theatres/תיאטרון-החאן.webp" },
  { slug: "hebrew-theatre", name: "התיאטרון העברי", image: "/images/theatres/תיאטרון-העברי.webp" },
  { slug: "tmuna", name: "תיאטרון תמונע", image: "/images/theatres/תיאטרון-תמונע.webp" },
  { slug: "tzavta", name: "תיאטרון צוותא", image: "/images/theatres/תיאטרון-צוותא.webp" },
  { slug: "tomix", name: "תיאטרון toMix", image: "/images/theatres/תיאטרון-tomix.webp" },
  { slug: "meshulash", name: "תיאטרון המשולש", image: "/images/theatres/תיאטרון-המשולש.webp" },
  { slug: "incubator", name: "תיאטרון האינקובטור", image: "/images/theatres/תיאטרון-האינקובטור.webp" },
  { slug: "independent", name: "הפקות עצמאיות", image: "/images/theatres/הפקות-עצמאיות.webp" },
];

/** Map from URL slug → theatre info */
export const THEATRE_BY_SLUG = new Map(
  THEATRES.map((t) => [t.slug, t]),
);

/** Map from Hebrew DB name → theatre info */
export const THEATRE_BY_NAME = new Map(
  THEATRES.map((t) => [t.name, t]),
);
