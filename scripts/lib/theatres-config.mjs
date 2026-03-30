/**
 * Single source of truth for all theatre and venue scrapers.
 *
 * Each entry describes one scraper:
 *   - label:    Display name used in logs and commit messages
 *   - script:   Filename of the scrape-all-* script (relative to scripts/)
 *   - jsonFile: Filename of the events JSON (relative to prisma/data/)
 *   - required: If true, sync-events.js will abort on parse failure (default: false)
 */
export const THEATRES = [
  // Theatre scrapers
  { label: "Cameri",            script: "scrape-all-cameri-events.mjs",              jsonFile: "events.json", required: true },
  { label: "Lessin",            script: "scrape-all-lessin-events.mjs",              jsonFile: "events-lessin.json" },
  { label: "Hebrew Theatre",    script: "scrape-all-hebrew-theatre-events.mjs",      jsonFile: "events-hebrew-theatre.json" },
  { label: "Khan",              script: "scrape-all-khan-events.mjs",                jsonFile: "events-khan.json" },
  { label: "Gesher",            script: "scrape-all-gesher-events.mjs",              jsonFile: "events-gesher.json" },
  { label: "Haifa Theatre",     script: "scrape-all-haifa-theatre-events.mjs",       jsonFile: "events-haifa-theatre.json" },
  { label: "Tmuna",             script: "scrape-all-tmuna-theatre-events.mjs",       jsonFile: "events-tmuna-theatre.json" },
  { label: "Beer Sheva",        script: "scrape-all-beer-sheva-theatre-events.mjs",  jsonFile: "events-beer-sheva-theatre.json" },
  { label: "Tzavta",            script: "scrape-all-tzavta-theatre-events.mjs",      jsonFile: "events-tzavta-theatre.json" },
  { label: "Habima",            script: "scrape-all-habima-theatre-events.mjs",       jsonFile: "events-habima-theatre.json" },
  { label: "toMix",             script: "scrape-all-tomix-events.mjs",               jsonFile: "events-tomix.json" },
  // Venue scrapers
  { label: "Nes Ziona",         script: "scrape-all-nes-ziona-events.mjs",           jsonFile: "events-nes-ziona.json" },
  { label: "Ashdod",            script: "scrape-all-ashdod-events.mjs",              jsonFile: "events-ashdod.json" },
  { label: "Beer Sheva Venue",  script: "scrape-all-beer-sheva-venue-events.mjs",    jsonFile: "events-beer-sheva-venue.json" },
  { label: "Rishon LeZion",     script: "scrape-all-rishon-lezion-events.mjs",       jsonFile: "events-rishon-lezion.json" },
  { label: "Petah Tikva",       script: "scrape-all-petah-tikva-events.mjs",         jsonFile: "events-petah-tikva.json" },
  { label: "Or Akiva",          script: "scrape-all-or-akiva-events.mjs",            jsonFile: "events-or-akiva.json" },
  { label: "Theatron HaZafon",  script: "scrape-all-theatron-hazafon-events.mjs",    jsonFile: "events-theatron-hazafon.json" },
  { label: "Kfar Saba",         script: "scrape-all-kfar-saba-events.mjs",           jsonFile: "events-kfar-saba.json" },
  { label: "Airport City",      script: "scrape-all-airport-city-events.mjs",        jsonFile: "events-airport-city.json" },
  { label: "Ashkelon",          script: "scrape-all-ashkelon-events.mjs",            jsonFile: "events-ashkelon.json" },
  { label: "Holon",             script: "scrape-all-holon-events.mjs",               jsonFile: "events-holon.json" },
  { label: "Kiryat Motzkin",    script: "scrape-all-kiryat-motzkin-events.mjs",      jsonFile: "events-kiryat-motzkin.json" },
  { label: "Rehovot",           script: "scrape-all-rehovot-events.mjs",             jsonFile: "events-rehovot.json" },
  { label: "Herzliya",          script: "scrape-all-herzliya-events.mjs",            jsonFile: "events-herzliya.json" },
  { label: "Ganei Tikva",       script: "scrape-all-ganei-tikva-events.mjs",         jsonFile: "events-ganei-tikva.json" },
  { label: "Or Yehuda",        script: "scrape-all-or-yehuda-events.mjs",           jsonFile: "events-or-yehuda.json" },
];
