/**
 * Theatre registry — lazy-loads individual theatre scraper modules on demand.
 *
 * Exports:
 *   THEATRE_IDS            – array of all valid theatre ID strings
 *   loadTheatreConfig(id)  – loads and returns a single config
 *   loadAllTheatreConfigs()– loads all configs
 *   loadTheatreConfigs(ids)– loads specific configs by ID array (validates IDs)
 */

export const THEATRE_IDS = [
  "cameri",
  "habima",
  "gesher",
  "lessin",
  "haifa",
  "beer-sheva",
  "hakahn",
  "hebrew-theatre",
  "tmuna",
  "tzavta",
  "tomix",
  "meshulash",
  "incubator",
  "malenki",
  "jerusalem-theatre-group",
  "hasimta",
  "hanut31",
  "niko-nitai",
  "elad",
  "independent",
];

/**
 * Loaders keyed by theatre ID.
 * Each returns a config object matching the shape expected by runPipeline:
 *   { theatreId, theatreName, theatreConst, fetchListing, scrapeDetails, titlePreference, launchBrowser }
 */
const LOADERS = {
  async cameri() {
    const {
      CAMERI_THEATRE,
      launchBrowser,
      fetchListing,
      scrapeShowDetails,
      scrapeCast,
    } = await import("./cameri.mjs");

    return {
      theatreId: "cameri",
      theatreName: CAMERI_THEATRE,
      theatreConst: CAMERI_THEATRE,
      theatreLabel: "Cameri Theatre (תיאטרון הקאמרי)",
      websiteUrl: "cameri.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async habima() {
    const { HABIMA_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./habima.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "habima",
      theatreName: HABIMA_THEATRE,
      theatreConst: HABIMA_THEATRE,
      theatreLabel: "Habima Theatre (תיאטרון הבימה)",
      websiteUrl: "habima.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async gesher() {
    const { GESHER_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./gesher.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "gesher",
      theatreName: GESHER_THEATRE,
      theatreConst: GESHER_THEATRE,
      theatreLabel: "Gesher Theatre (תיאטרון גשר)",
      websiteUrl: "gesher-theatre.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async lessin() {
    const { LESSIN_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./lessin.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "lessin",
      theatreName: LESSIN_THEATRE,
      theatreConst: LESSIN_THEATRE,
      theatreLabel: "Beit Lessin Theatre (תיאטרון בית ליסין)",
      websiteUrl: "lessin.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async haifa() {
    const { HAIFA_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./haifa.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "haifa",
      theatreName: HAIFA_THEATRE,
      theatreConst: HAIFA_THEATRE,
      theatreLabel: "Haifa Theatre (תיאטרון חיפה)",
      websiteUrl: "ht1.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async "beer-sheva"() {
    const { BEER_SHEVA_THEATRE, fetchListing, scrapeShowDetails, scrapeCast } =
      await import("./beer-sheva.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "beer-sheva",
      theatreName: BEER_SHEVA_THEATRE,
      theatreConst: BEER_SHEVA_THEATRE,
      theatreLabel: "Beer Sheva Theatre (תיאטרון באר שבע)",
      websiteUrl: "b7t.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async hakahn() {
    const { KHAN_THEATRE, fetchListing, scrapeShowDetails, scrapeCast } =
      await import("./hakahn.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hakahn",
      theatreName: KHAN_THEATRE,
      theatreConst: KHAN_THEATRE,
      theatreLabel: "Khan Theatre (תיאטרון החאן)",
      websiteUrl: "khan.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async "hebrew-theatre"() {
    const { HEBREW_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./hebrew-theatre.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hebrew-theatre",
      theatreName: HEBREW_THEATRE,
      theatreConst: HEBREW_THEATRE,
      theatreLabel: "Hebrew Theatre (התיאטרון העברי)",
      websiteUrl: "teatron.org.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async tmuna() {
    const { TMUNA_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./tmuna.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "tmuna",
      theatreName: TMUNA_THEATRE,
      theatreConst: TMUNA_THEATRE,
      theatreLabel: "Tmuna Theatre (תיאטרון תמונע)",
      websiteUrl: "tmu-na.org.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async tzavta() {
    const { TZAVTA_THEATRE, fetchListing, scrapeShowDetails, scrapeCast } =
      await import("./tzavta.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "tzavta",
      theatreName: TZAVTA_THEATRE,
      theatreConst: TZAVTA_THEATRE,
      theatreLabel: "Tzavta Theatre (תיאטרון צוותא)",
      websiteUrl: "tzavta.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async tomix() {
    const { TOMIX_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./tomix.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "tomix",
      theatreName: TOMIX_THEATRE,
      theatreConst: TOMIX_THEATRE,
      theatreLabel: "toMix Theatre (תיאטרון toMix)",
      websiteUrl: "to-mix.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async meshulash() {
    const { MESHULASH_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./meshulash.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "meshulash",
      theatreName: MESHULASH_THEATRE,
      theatreConst: MESHULASH_THEATRE,
      theatreLabel: "Meshulash Theatre (תיאטרון המשולש)",
      websiteUrl: "hameshulash.com",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async incubator() {
    const { INCUBATOR_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./incubator.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "incubator",
      theatreName: INCUBATOR_THEATRE,
      theatreConst: INCUBATOR_THEATRE,
      theatreLabel: "Incubator Theatre (תיאטרון האינקובטור)",
      websiteUrl: "incubator.org.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async malenki() {
    const { MALENKI_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./malenki.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "malenki",
      theatreName: MALENKI_THEATRE,
      theatreConst: MALENKI_THEATRE,
      theatreLabel: "Malenki Theatre (תיאטרון מלנקי)",
      websiteUrl: "malenky.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async hasimta() {
    const { HASIMTA_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./hasimta.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hasimta",
      theatreName: HASIMTA_THEATRE,
      theatreConst: HASIMTA_THEATRE,
      theatreLabel: "Hasimta Theatre (תיאטרון הסימטה)",
      websiteUrl: "hasimta.com",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async hanut31() {
    const { HANUT31_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./hanut31.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hanut31",
      theatreName: HANUT31_THEATRE,
      theatreConst: HANUT31_THEATRE,
      theatreLabel: "Hanut31 Theatre (תיאטרון החנות)",
      websiteUrl: "hanut31.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async "jerusalem-theatre-group"() {
    const { JERUSALEM_THEATRE_GROUP, fetchListing, scrapeShowDetails } =
      await import("./jerusalem-theatre-group.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "jerusalem-theatre-group",
      theatreName: JERUSALEM_THEATRE_GROUP,
      theatreConst: JERUSALEM_THEATRE_GROUP,
      theatreLabel: "Jerusalem Theatre Group (קבוצת התיאטרון הירושלמי)",
      websiteUrl: "tcj.org.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async "niko-nitai"() {
    const { NIKO_NITAI_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./niko-nitai.mjs");
    const { launchStealthBrowser } = await import("./browser.mjs");

    return {
      theatreId: "niko-nitai",
      theatreName: NIKO_NITAI_THEATRE,
      theatreConst: NIKO_NITAI_THEATRE,
      theatreLabel: "Niko Nitai Theatre (תיאטרון ניקו ניתאי)",
      websiteUrl: "nikonitai.smarticket.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser: launchStealthBrowser,
    };
  },

  async elad() {
    const { ELAD_THEATRE, fetchListing, scrapeShowDetails } =
      await import("./elad.mjs");
    const { launchStealthBrowser } = await import("./browser.mjs");

    return {
      theatreId: "elad",
      theatreName: ELAD_THEATRE,
      theatreConst: ELAD_THEATRE,
      theatreLabel: "Elad Theatre (תיאטרון אלעד)",
      websiteUrl: "elad-theater.co.il",
      fetchListing,
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "detail-first",
      launchBrowser: launchStealthBrowser,
    };
  },

  async independent() {
    const { fetchListing: fetchGuestListing } = await import(
      "./venues/habima-guest.mjs"
    );
    const { scrapeShowDetails } = await import("./habima.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    const INDEPENDENT_THEATRE = "הפקות עצמאיות";

    return {
      theatreId: "independent",
      theatreName: INDEPENDENT_THEATRE,
      theatreConst: INDEPENDENT_THEATRE,
      theatreLabel: "Independent Productions (הפקות עצמאיות)",
      websiteUrl: "habima.co.il",
      async fetchListing(browser) {
        const listings = await fetchGuestListing(browser);
        return listings.map(({ title, detailUrl }) => ({
          title,
          url: detailUrl,
        }));
      },
      scrapeDetails: scrapeShowDetails,
      scrapeCast: async (browser, url) =>
        (await scrapeShowDetails(browser, url)).cast || null,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },
};

/**
 * Load and return the config for a single theatre.
 * @param {string} theatreId
 * @returns {Promise<object>}
 */
export async function loadTheatreConfig(theatreId) {
  const loader = LOADERS[theatreId];
  if (!loader) {
    throw new Error(
      `Unknown theatre ID: "${theatreId}". Valid IDs: ${THEATRE_IDS.join(", ")}`,
    );
  }
  return loader();
}

/**
 * Load and return configs for all 10 theatres.
 * @returns {Promise<object[]>}
 */
export async function loadAllTheatreConfigs() {
  return Promise.all(THEATRE_IDS.map((id) => loadTheatreConfig(id)));
}

/**
 * Load and return configs for the given theatre IDs.
 * Throws if any ID is invalid.
 * @param {string[]} ids
 * @returns {Promise<object[]>}
 */
export async function loadTheatreConfigs(ids) {
  const invalid = ids.filter((id) => !THEATRE_IDS.includes(id));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown theatre ID(s): ${invalid.map((id) => `"${id}"`).join(", ")}. Valid IDs: ${THEATRE_IDS.join(", ")}`,
    );
  }
  return Promise.all(ids.map((id) => loadTheatreConfig(id)));
}
