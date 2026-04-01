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
  { label: "Cameri",            script: "scrapers/scrape-all-cameri-events.mjs",              jsonFile: "events.json", required: true },
  { label: "Lessin",            script: "scrapers/scrape-all-lessin-events.mjs",              jsonFile: "events-lessin.json" },
  { label: "Hebrew Theatre",    script: "scrapers/scrape-all-hebrew-theatre-events.mjs",      jsonFile: "events-hebrew-theatre.json" },
  { label: "Khan",              script: "scrapers/scrape-all-khan-events.mjs",                jsonFile: "events-khan.json" },
  { label: "Gesher",            script: "scrapers/scrape-all-gesher-events.mjs",              jsonFile: "events-gesher.json" },
  { label: "Haifa Theatre",     script: "scrapers/scrape-all-haifa-theatre-events.mjs",       jsonFile: "events-haifa-theatre.json" },
  { label: "Tmuna",             script: "scrapers/scrape-all-tmuna-theatre-events.mjs",       jsonFile: "events-tmuna-theatre.json" },
  { label: "Beer Sheva",        script: "scrapers/scrape-all-beer-sheva-theatre-events.mjs",  jsonFile: "events-beer-sheva-theatre.json" },
  { label: "Tzavta",            script: "scrapers/scrape-all-tzavta-theatre-events.mjs",      jsonFile: "events-tzavta-theatre.json" },
  { label: "Habima",            script: "scrapers/scrape-all-habima-theatre-events.mjs",       jsonFile: "events-habima-theatre.json" },
  { label: "toMix",             script: "scrapers/scrape-all-tomix-events.mjs",               jsonFile: "events-tomix.json" },
  { label: "Meshulash",         script: "scrapers/scrape-all-meshulash-events.mjs",           jsonFile: "events-meshulash.json" },
  // Venue scrapers
  { label: "Nes Ziona",         script: "scrapers/scrape-all-nes-ziona-events.mjs",           jsonFile: "events-nes-ziona.json" },
  { label: "Ashdod",            script: "scrapers/scrape-all-ashdod-events.mjs",              jsonFile: "events-ashdod.json" },
  { label: "Beer Sheva Venue",  script: "scrapers/scrape-all-beer-sheva-venue-events.mjs",    jsonFile: "events-beer-sheva-venue.json" },
  { label: "Rishon LeZion",     script: "scrapers/scrape-all-rishon-lezion-events.mjs",       jsonFile: "events-rishon-lezion.json" },
  { label: "Petah Tikva",       script: "scrapers/scrape-all-petah-tikva-events.mjs",         jsonFile: "events-petah-tikva.json" },
  { label: "Or Akiva",          script: "scrapers/scrape-all-or-akiva-events.mjs",            jsonFile: "events-or-akiva.json" },
  { label: "Theatron HaZafon",  script: "scrapers/scrape-all-theatron-hazafon-events.mjs",    jsonFile: "events-theatron-hazafon.json" },
  { label: "Kfar Saba",         script: "scrapers/scrape-all-kfar-saba-events.mjs",           jsonFile: "events-kfar-saba.json" },
  { label: "Airport City",      script: "scrapers/scrape-all-airport-city-events.mjs",        jsonFile: "events-airport-city.json" },
  { label: "Ashkelon",          script: "scrapers/scrape-all-ashkelon-events.mjs",            jsonFile: "events-ashkelon.json" },
  { label: "Holon",             script: "scrapers/scrape-all-holon-events.mjs",               jsonFile: "events-holon.json" },
  { label: "Kiryat Motzkin",    script: "scrapers/scrape-all-kiryat-motzkin-events.mjs",      jsonFile: "events-kiryat-motzkin.json" },
  { label: "Rehovot",           script: "scrapers/scrape-all-rehovot-events.mjs",             jsonFile: "events-rehovot.json" },
  { label: "Herzliya",          script: "scrapers/scrape-all-herzliya-events.mjs",            jsonFile: "events-herzliya.json" },
  { label: "Ganei Tikva",       script: "scrapers/scrape-all-ganei-tikva-events.mjs",         jsonFile: "events-ganei-tikva.json" },
  { label: "Or Yehuda",        script: "scrapers/scrape-all-or-yehuda-events.mjs",           jsonFile: "events-or-yehuda.json" },
  { label: "Jerusalem Theatre", script: "scrapers/scrape-all-jerusalem-theatre-events.mjs",  jsonFile: "events-jerusalem-theatre.json" },
];
