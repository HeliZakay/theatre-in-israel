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
}

export const THEATRES: TheatreInfo[] = [
  { slug: "cameri", name: "הקאמרי" },
  { slug: "habima", name: "הבימה" },
  { slug: "gesher", name: "גשר" },
  { slug: "beit-lessin", name: "בית ליסין" },
  { slug: "haifa", name: "תיאטרון חיפה" },
  { slug: "beer-sheva", name: "תיאטרון באר שבע" },
  { slug: "khan", name: "תיאטרון החאן" },
  { slug: "hebrew-theatre", name: "התיאטרון העברי" },
  { slug: "tmuna", name: "תמונע" },
  { slug: "tzavta", name: "צוותא" },
];

/** Map from URL slug → theatre info */
export const THEATRE_BY_SLUG = new Map(
  THEATRES.map((t) => [t.slug, t]),
);

/** Map from Hebrew DB name → theatre info */
export const THEATRE_BY_NAME = new Map(
  THEATRES.map((t) => [t.name, t]),
);
