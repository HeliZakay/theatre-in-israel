/**
 * Curated city enrichment for cities that have a dedicated landing page with
 * hand-written copy. Cities are keyed by their canonical Hebrew name (which
 * also drives the URL slug). All cities that exist as venue cities in the DB
 * get a landing page automatically — entries here only add description,
 * resident theatres, and venue-name aliases.
 *
 * Slug ↔ name mapping: `<name>.replaceAll(' ', '-')` and vice versa. Hebrew
 * letters stay in the URL (modern browsers display them natively; copy/paste
 * percent-encodes them — accepted trade-off).
 */

export interface CityInfo {
  /** Canonical Hebrew name (matches a value in Venue.city). */
  name: string;
  /** DB venue-city values that map to this city. Defaults to [name]. */
  aliases: string[];
  /** Hand-written description for SEO. Optional. */
  description?: string;
  /** Hebrew names of resident theatre companies (match Show.theatre). */
  residentTheatres?: string[];
}

export const CITIES: CityInfo[] = [
  {
    name: "תל אביב",
    aliases: ["תל אביב", "תל אביב-יפו"],
    description:
      "תל אביב היא בירת התיאטרון של ישראל — עם עשרות אולמות, תיאטראות מובילים כמו הקאמרי, הבימה וגשר, ומאות הצגות בכל חודש.",
    residentTheatres: [
      "תיאטרון הקאמרי",
      "תיאטרון הבימה",
      "תיאטרון גשר",
      "תיאטרון בית ליסין",
      "אנסמבל תמונע",
      "תיאטרון toMix",
      "תיאטרון המשולש",
      "תיאטרון מלנקי",
      "תיאטרון הסימטה",
      "תיאטרון ניקו ניתאי",
      "תיאטרון החנות",
      "תיאטרון דוואי",
    ],
  },
  {
    name: "חיפה",
    aliases: ["חיפה"],
    description:
      "חיפה מציעה סצנת תיאטרון עשירה בצפון הארץ — תיאטרון חיפה, אודיטוריום חיפה ומבחר הצגות מגוון לאורך כל השנה.",
    residentTheatres: ["תיאטרון חיפה"],
  },
  {
    name: "ירושלים",
    aliases: ["ירושלים"],
    description:
      "ירושלים היא ביתו של תיאטרון החאן ומציעה חוויות תיאטרון ייחודיות — הצגות מקוריות, הפקות אורחות ומופעים בהיכלי התרבות של הבירה.",
    residentTheatres: [
      "תיאטרון החאן",
      "תיאטרון האינקובטור",
      "קבוצת התיאטרון הירושלמי",
    ],
  },
  {
    name: "באר שבע",
    aliases: ["באר שבע"],
    description:
      "באר שבע היא מרכז התיאטרון של הנגב — תיאטרון באר שבע מעלה הפקות מקוריות, ואולמות העיר מארחים מיטב ההצגות מכל הארץ.",
    residentTheatres: ["תיאטרון באר שבע"],
  },
];

/** Map from canonical Hebrew name → curated enrichment. */
export const CITY_BY_NAME = new Map(CITIES.map((c) => [c.name, c]));

/** Reverse alias map: any DB venue-city value → its canonical Hebrew name. */
export const CANONICAL_NAME_BY_ALIAS = new Map<string, string>(
  CITIES.flatMap((c) => c.aliases.map((a) => [a, c.name] as const)),
);

/** Hebrew name → URL slug. Spaces become hyphens; Hebrew letters stay. */
export function cityNameToSlug(name: string): string {
  return name.replaceAll(" ", "-");
}

/** URL slug → Hebrew name. */
export function citySlugToName(slug: string): string {
  return slug.replaceAll("-", " ");
}
