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
];

/**
 * Loaders keyed by theatre ID.
 * Each returns a config object matching the shape expected by runPipeline:
 *   { theatreId, theatreName, theatreConst, fetchListing, scrapeDetails, titlePreference, launchBrowser }
 */
const LOADERS = {
  async cameri() {
    const { CAMERI_THEATRE, launchBrowser, fetchSchedule, scrapeShowDetails } =
      await import("./cameri.mjs");

    return {
      theatreId: "cameri",
      theatreName: CAMERI_THEATRE,
      theatreConst: CAMERI_THEATRE,
      fetchListing: fetchSchedule,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "detail-first",
      launchBrowser,
    };
  },

  async habima() {
    const { HABIMA_THEATRE, fetchRepertoire, scrapeShowDetails } =
      await import("./habima.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "habima",
      theatreName: HABIMA_THEATRE,
      theatreConst: HABIMA_THEATRE,
      fetchListing: fetchRepertoire,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async gesher() {
    const { GESHER_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./gesher.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "gesher",
      theatreName: GESHER_THEATRE,
      theatreConst: GESHER_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async lessin() {
    const { LESSIN_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./lessin.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "lessin",
      theatreName: LESSIN_THEATRE,
      theatreConst: LESSIN_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async haifa() {
    const { HAIFA_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./haifa.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "haifa",
      theatreName: HAIFA_THEATRE,
      theatreConst: HAIFA_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async "beer-sheva"() {
    const { BEER_SHEVA_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./beer-sheva.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "beer-sheva",
      theatreName: BEER_SHEVA_THEATRE,
      theatreConst: BEER_SHEVA_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async hakahn() {
    const { KHAN_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./hakahn.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hakahn",
      theatreName: KHAN_THEATRE,
      theatreConst: KHAN_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async "hebrew-theatre"() {
    const { HEBREW_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./hebrew-theatre.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "hebrew-theatre",
      theatreName: HEBREW_THEATRE,
      theatreConst: HEBREW_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async tmuna() {
    const { TMUNA_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./tmuna.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "tmuna",
      theatreName: TMUNA_THEATRE,
      theatreConst: TMUNA_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
      titlePreference: "listing-first",
      launchBrowser,
    };
  },

  async tzavta() {
    const { TZAVTA_THEATRE, fetchShows, scrapeShowDetails } =
      await import("./tzavta.mjs");
    const { launchBrowser } = await import("./browser.mjs");

    return {
      theatreId: "tzavta",
      theatreName: TZAVTA_THEATRE,
      theatreConst: TZAVTA_THEATRE,
      fetchListing: fetchShows,
      scrapeDetails: scrapeShowDetails,
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
