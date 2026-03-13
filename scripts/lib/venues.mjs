/**
 * Shared venue → city resolution for all scrapers.
 *
 * Centralises the mapping of venue names to cities so every scraper
 * (Khan, Haifa, Hebrew Theatre, etc.) uses a single authoritative lookup.
 */

// ── Venue → City map ────────────────────────────────────────────
// Add new venues here — all scrapers benefit automatically.

const VENUE_CITY_MAP = {
  // Tel Aviv area
  "היכל התרבות תל אביב": "תל אביב",
  "היכל התרבות": "תל אביב",
  "תיאטרון הבימה": "תל אביב",
  "בית ליסין": "תל אביב",
  "תיאטרון הקאמרי": "תל אביב",
  צוותא: "תל אביב",
  תמונע: "תל אביב",
  "התיאטרון העברי": "תל אביב",
  "בית החייל תל אביב": "תל אביב",
  "בית החייל ת\"א": "תל אביב",
  "בית החייל ת״א": "תל אביב",
  "בית האופרה - תל אביב": "תל אביב",
  "מוזיאון ארץ ישראל - תל אביב": "תל אביב",
  "בית ציוני אמריקה": "תל אביב",
  "בית ציוני אמריקה תל אביב-אולם מאירהוף": "תל אביב",
  // Haifa
  "תיאטרון הצפון": "חיפה",
  "תיאטרון חיפה": "חיפה",
  "אודיטוריום חיפה": "חיפה",
  // Jerusalem
  "תיאטרון ירושלים": "ירושלים",
  "תיאטרון החאן": "ירושלים",
  "גררד בכר": "ירושלים",
  "היכל התרבות ירושלים": "ירושלים",
  // Beer Sheva
  "תיאטרון באר שבע": "באר שבע",
  "היכל התרבות באר שבע": "באר שבע",
  "המרכז לאמנויות הבמה באר שבע": "באר שבע",
  // Herzliya
  "היכל התרבות הרצליה": "הרצליה",
  "היכל אומנוית הבמה - הרצליה": "הרצליה",
  // Other cities
  "היכל התרבות רעננה": "רעננה",
  "היכל התרבות כפר סבא": "כפר סבא",
  "היכל התרבות אשדוד": "אשדוד",
  "היכל התרבות ראשון לציון": "ראשון לציון",
  "היכל התרבות נתניה": "נתניה",
  "היכל התרבות פתח תקווה": "פתח תקווה",
  "היכל התרבות רמת גן": "רמת גן",
  "מרכז תרבות גבעתיים": "גבעתיים",
  "היכל התרבות מודיעין": "מודיעין",
  "היכל התרבות קריית מוצקין": "קריית מוצקין",
  "היכל התרבות לוד": "לוד",
  "תיאטרון גשר": "יפו",
  "היכל התרבות אור עקיבא": "אור עקיבא",
  "היכל התרבות אשקלון": "אשקלון",
  "היכל התרבות איירפורט סיטי": "קריית שדה התעופה",
  "היכל התיאטרון מוצקין": "קריית מוצקין",
  'מזכרת בתיה - היכל התרבות ע"ש אריה כספי': "מזכרת בתיה",
  "היכל התרבות בית העם רחובות": "רחובות",
  "תיאטרון חולון": "חולון",
};

/**
 * Known Israeli cities for trailing-city heuristic, sorted longest-first
 * so "ראשון לציון" matches before "ציון".
 */
const KNOWN_CITIES = [
  "ראשון לציון",
  "פתח תקווה",
  "קריית מוצקין",
  "קריית ביאליק",
  "קריית שמונה",
  "כפר סבא",
  "רמת גן",
  "באר שבע",
  "רמת השרון",
  "גבעתיים",
  "תל אביב",
  "ירושלים",
  "הרצליה",
  "רעננה",
  "אשדוד",
  "חולון",
  "נתניה",
  "חיפה",
  "אשקלון",
  "מודיעין",
  "עפולה",
  "לוד",
  "יפו",
  "עכו",
  "אילת",
  "אור עקיבא",
  "קריית שדה התעופה",
  "מזכרת בתיה",
  "רחובות",
].sort((a, b) => b.length - a.length);

// ── Public API ───────────────────────────────────────────────────

/**
 * Resolve the city for a raw venue name.
 *
 * Resolution tiers (in order):
 *   1. Exact match in VENUE_CITY_MAP
 *   2. Partial/contains match — venue key is a substring of rawVenueName or vice versa
 *   3. Trailing city heuristic — rawVenueName ends with a known city name
 *   4. Fallback — "לא ידוע" with a console warning
 *
 * @param {string} rawVenueName — venue string exactly as scraped
 * @returns {string} — city name
 */
export function resolveVenueCity(rawVenueName) {
  const trimmed = rawVenueName.replace(/\s+/g, " ").trim();

  // Tier 1: exact match
  if (VENUE_CITY_MAP[trimmed]) {
    return VENUE_CITY_MAP[trimmed];
  }

  // Tier 2: partial/contains match (either direction)
  for (const [key, city] of Object.entries(VENUE_CITY_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return city;
    }
  }

  // Tier 3: trailing city heuristic
  for (const city of KNOWN_CITIES) {
    if (trimmed.endsWith(city)) {
      return city;
    }
  }

  // Tier 4: fallback
  console.warn(
    `  ⚠  Unknown venue city for: "${trimmed}" — defaulting to "לא ידוע"`,
  );
  return "לא ידוע";
}
