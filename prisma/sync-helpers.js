/**
 * Pure helper functions extracted from sync-events.js for testability.
 */

// ---------------------------------------------------------------------------
// Venue alias normalization — maps variant venue names/cities to a single
// canonical form so that different scrapers don't create duplicate venues
// for the same physical location.
//
// Key format: "venueName|venueCity"
// Value format: { name, city } — the canonical form
// ---------------------------------------------------------------------------
const VENUE_ALIASES = new Map([
  // Beit HaChayal Tel Aviv — abbreviated ת"א → full תל אביב
  ['בית החייל ת"א|תל אביב', { name: "בית החייל תל אביב", city: "תל אביב" }],
  ['בית החייל ת"א|תל אביב-יפו', { name: "בית החייל תל אביב", city: "תל אביב" }],

  // Beit Tzioni America — city variant תל אביב-יפו → תל אביב
  ["בית ציוני אמריקה|תל אביב", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  ["בית ציוני אמריקה|תל אביב-יפו", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  // Beit Tzioni America — name includes hall specification
  ["בית ציוני אמריקה תל אביב-אולם מאירהוף|תל אביב", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  ["בית ציוני אמריקה תל אביב-אולם מאירהוף|תל אביב-יפו", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],

  // Heichal Herzliya — typo אומנוית → אמנויות
  ["היכל אומנוית הבמה - הרצליה|הרצליה", { name: "היכל אמנויות הבמה הרצליה", city: "הרצליה" }],

  // Heichal HaTheatron Kiryat Motzkin — missing קריית in name
  ["היכל התיאטרון מוצקין|קריית מוצקין", { name: "היכל התיאטרון קריית מוצקין", city: "קריית מוצקין" }],

  // Heichal Airport City — spelling variant and different city name
  ["היכל התרבות איירפורט סיטי|קריית שדה התעופה", { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" }],
  // Heichal Airport City — old typo אייפורט → איירפורט
  ["היכל התרבות אייפורט סיטי|אייפורט סיטי", { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" }],

  // Beit HaAm Rehovot — hebrew-theatre prepends היכל התרבות
  ["היכל התרבות בית העם רחובות|רחובות", { name: "בית העם רחובות", city: "רחובות" }],
  // Beit HaAm Rehovot — typo הכיל instead of היכל
  ["הכיל התרבות - בית העם רחובות|רחובות", { name: "בית העם רחובות", city: "רחובות" }],

  // Moza Heichal HaTarbut Hof HaCarmel — strip "מוזה" prefix
  ["מוזה היכל התרבות חוף הכרמל|חוף הכרמל", { name: "היכל התרבות חוף הכרמל", city: "חוף הכרמל" }],
  ["מוזה היכל התרבות חוף הכרמל|תל אביב", { name: "היכל התרבות חוף הכרמל", city: "חוף הכרמל" }],

  // Theatron Holon — strip "בית יד לבנים" suffix
  ["תיאטרון חולון - בית יד לבנים|חולון", { name: "תיאטרון חולון", city: "חולון" }],

  // Beit Yad LaBanim Raanana — add city suffix
  ["בית יד לבנים|רעננה", { name: "בית יד לבנים רעננה", city: "רעננה" }],

  // Auditorium Kalchkin → Eretz Israel Museum Tel Aviv (same venue)
  ["אודיטוריום ע\"ש קלצ'קין|תל אביב", { name: "מוזיאון ארץ ישראל - תל אביב", city: "תל אביב" }],

  // Mishkan Ashdod — typo אומנויות → אמנויות
  ["המשכן לאומנויות הבמה אשדוד|אשדוד", { name: "המשכן לאמנויות הבמה אשדוד", city: "אשדוד" }],

  // Heichal HaTarbut Hevel Modi'in — canonical name is איירפורט סיטי
  ["היכל התרבות חבל מודיעין|אייפורט סיטי", { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" }],
  ["היכל התרבות חבל מודיעין|איירפורט סיטי", { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" }],
  ["היכל התרבות חבל מודיעין|קריית שדה התעופה", { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" }],

  // Heichal HaTheatron — bare name without city → Kiryat Motzkin
  ["היכל התיאטרון|קריית מוצקין", { name: "היכל התיאטרון קריית מוצקין", city: "קריית מוצקין" }],
  ["היכל התיאטרון|קרית מוצקין", { name: "היכל התיאטרון קריית מוצקין", city: "קריית מוצקין" }],

  // Mishkan Tel Aviv — bare name → add city suffix
  ["המשכן לאמנויות הבמה|תל אביב", { name: "המשכן לאמנויות הבמה תל אביב", city: "תל אביב" }],

  // Theatron HaYahalom — add city suffix
  ["תיאטרון היהלום|רמת גן", { name: "תיאטרון היהלום רמת גן", city: "רמת גן" }],

  // Herzliya — typo אומנויות → אמנויות (different from existing אומנוית typo)
  ["היכל אומנויות הבמה הרצליה|הרצליה", { name: "היכל אמנויות הבמה הרצליה", city: "הרצליה" }],

  // Beit HaChayal — dash variant → canonical without dash
  ["בית החייל - תל אביב|תל אביב", { name: "בית החייל תל אביב", city: "תל אביב" }],

  // Heichal HaTarbut — bare name → היכל התרבות בת ים
  ["היכל התרבות|בת ים", { name: "היכל התרבות בת ים", city: "בת ים" }],

  // toMix — old short name → full name with אקספו ת״א
  ["תיאטרון toMix|תל אביב", { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],

  // toMix — scraper comma-splits "תיאטרון toMix, אקספו ת"א" → venueName short + city אקספו
  ['תיאטרון toMix|אקספו ת"א', { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],
  ["תיאטרון toMix|אקספו ת״א", { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],

  // toMix — scraper outputs full venue name (gershayim ״) + אקספו as city (regular " or ״)
  ['תיאטרון toMix אקספו ת"א|אקספו ת"א', { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],
  ["תיאטרון toMix אקספו ת״א|אקספו ת״א", { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],
  ['תיאטרון toMix אקספו ת״א|אקספו ת"א', { name: "תיאטרון toMix אקספו ת״א", city: "תל אביב" }],

  // Tzavta — short name → תיאטרון צוותא
  ["צוותא|תל אביב", { name: "תיאטרון צוותא", city: "תל אביב" }],
  ["צוותא|תל אביב-יפו", { name: "תיאטרון צוותא", city: "תל אביב" }],

  // Venues with wrong city תל אביב — fix to correct city
  ["היכל התרבות אריאל|תל אביב", { name: "היכל התרבות אריאל", city: "אריאל" }],
  ["היכל התרבות בת ים|תל אביב", { name: "היכל התרבות בת ים", city: "בת ים" }],
  ["היכל התרבות יבנה|תל אביב", { name: "היכל התרבות יבנה", city: "יבנה" }],
  ["היכל התרבות כרמיאל|תל אביב", { name: "היכל התרבות כרמיאל", city: "כרמיאל" }],
  ["היכל התרבות עכו|תל אביב", { name: "היכל התרבות עכו", city: "עכו" }],
  ["היכל התרבות עפולה|תל אביב", { name: "היכל התרבות עפולה", city: "עפולה" }],
  ["היכל התרבות ראש העין|תל אביב", { name: "היכל התרבות ראש העין", city: "ראש העין" }],
  ["היכל התרבות מעלה אדומים|תל אביב", { name: "היכל התרבות מעלה אדומים", city: "מעלה אדומים" }],
  ["היכל התרבות דרום השרון|תל אביב", { name: "היכל התרבות דרום השרון", city: "נווה ירק" }],

  // Venues with wrong city לא ידוע — fix to correct city
  ["אולם מופעים גבעת ברנר|לא ידוע", { name: "אולם מופעים גבעת ברנר", city: "גבעת ברנר" }],
  ["אולם המופעים יפעת|לא ידוע", { name: "אולם המופעים יפעת עמק יזרעאל", city: "מועצה אזורית עמק יזרעאל" }],
  ["אולם המופעים יפעת|מועצה אזורית עמק יזרעאל", { name: "אולם המופעים יפעת עמק יזרעאל", city: "מועצה אזורית עמק יזרעאל" }],
  ['מתנ"ס תל מונד|לא ידוע', { name: 'מתנ"ס תל מונד', city: "תל מונד" }],
  ["סינמה סיטי גלילות|לא ידוע", { name: "סינמה סיטי גלילות", city: "גלילות" }],
  ["תיאטרון יד למגינים יגור|לא ידוע", { name: "תיאטרון יד למגינים יגור", city: "יגור" }],
]);

const CITY_REGIONS_MAP = {
  'תל אביב': ['center'], 'תל אביב-יפו': ['center'], 'רמת גן': ['center'], 'גבעתיים': ['center'], 'חולון': ['center'], 'בת ים': ['center'], 'פתח תקווה': ['center'], 'ראש העין': ['center'], 'גני תקווה': ['center'], 'אקספו ת"א': ['center'], 'אקספו ת״א': ['center'], 'אקספו תל אביב': ['center'],
  'נתניה': ['sharon'], 'כפר סבא': ['sharon'], 'רעננה': ['sharon'], 'נווה ירק': ['sharon'], 'תל מונד': ['sharon'],
  'הרצליה': ['sharon', 'center'], 'גלילות': ['sharon', 'center'], 'אריאל': ['sharon', 'center'],
  'ראשון לציון': ['shfela', 'center'], 'רחובות': ['shfela'], 'נס ציונה': ['shfela'], 'יבנה': ['shfela'], 'מזכרת בתיה': ['shfela'], 'גבעת ברנר': ['shfela'], 'קריית שדה התעופה': ['shfela'], 'איירפורט סיטי': ['shfela', 'center'],
  'ירושלים': ['jerusalem'], 'מעלה אדומים': ['jerusalem'], 'מודיעין': ['shfela', 'jerusalem'],
  'חיפה': ['north'], 'עכו': ['north'], 'כרמיאל': ['north'], 'עפולה': ['north'], 'קריית מוצקין': ['north'], 'קרית מוצקין': ['north'], 'קריית חיים': ['north'], 'זכרון יעקב': ['north'], 'יגור': ['north'], 'חוף הכרמל': ['north'], 'אור עקיבא': ['north'], 'מועצה אזורית עמק יזרעאל': ['north'],
  'באר שבע': ['south'], 'אשדוד': ['south', 'shfela'], 'אשקלון': ['south'],
};

function normalizeVenue(name, city) {
  const key = `${name}|${city}`;
  const alias = VENUE_ALIASES.get(key);
  return alias || { name, city };
}

module.exports = { VENUE_ALIASES, CITY_REGIONS_MAP, normalizeVenue };
