/**
 * City slug ↔ display-name mapping for dedicated city landing pages.
 * Only cities with multiple venues or a resident theatre company get pages.
 * The `aliases` array lists DB venue-city values that map to this city
 * (reuses the same mapping as CITY_SLUGS in eventsConstants).
 */

export interface CityInfo {
  /** URL slug (Latin) */
  slug: string;
  /** Hebrew display name */
  name: string;
  /** DB venue-city values that belong to this city */
  aliases: string[];
  /** Hebrew description for SEO */
  description: string;
  /** Hebrew names of resident theatre companies (match Show.theatre in DB) */
  residentTheatres: string[];
  /** Path to city image in /public */
  image: string;
}

export const CITIES: CityInfo[] = [
  {
    slug: "tel-aviv",
    name: "תל אביב",
    aliases: ["תל אביב", "תל אביב-יפו"],
    description:
      "תל אביב היא בירת התיאטרון של ישראל — עם עשרות אולמות, תיאטראות מובילים כמו הקאמרי, הבימה וגשר, ומאות הצגות בכל חודש.",
    residentTheatres: [
      "תיאטרון הקאמרי",
      "תיאטרון הבימה",
      "תיאטרון גשר",
      "תיאטרון בית ליסין",
      "תיאטרון תמונע",
      "תיאטרון צוותא",
      "תיאטרון toMix",
    ],
    image: "/תל-אביב.webp",
  },
  {
    slug: "haifa",
    name: "חיפה",
    aliases: ["חיפה"],
    description:
      "חיפה מציעה סצנת תיאטרון עשירה בצפון הארץ — תיאטרון חיפה, אודיטוריום חיפה ומבחר הצגות מגוון לאורך כל השנה.",
    residentTheatres: ["תיאטרון חיפה"],
    image: "/חיפה.webp",
  },
  {
    slug: "jerusalem",
    name: "ירושלים",
    aliases: ["ירושלים"],
    description:
      "ירושלים היא ביתו של תיאטרון החאן ומציעה חוויות תיאטרון ייחודיות — הצגות מקוריות, הפקות אורחות ומופעים בהיכלי התרבות של הבירה.",
    residentTheatres: ["תיאטרון החאן"],
    image: "/ירושלים.webp",
  },
  {
    slug: "beer-sheva",
    name: "באר שבע",
    aliases: ["באר שבע"],
    description:
      "באר שבע היא מרכז התיאטרון של הנגב — תיאטרון באר שבע מעלה הפקות מקוריות, ואולמות העיר מארחים מיטב ההצגות מכל הארץ.",
    residentTheatres: ["תיאטרון באר שבע"],
    image: "/באר שבע.webp",
  },
];

/** Map from URL slug → city info */
export const CITY_BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));
