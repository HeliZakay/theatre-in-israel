/**
 * scraper-runner.mjs — Shared harness for all scrape-all-*.mjs scripts.
 *
 * Accepts a config object and handles all common logic: CLI parsing,
 * browser launch, DB connection, show matching, event scraping loop,
 * JSON output, summary, and cleanup.
 *
 * Supports theatre scrapers (DB query by theatre + normaliseForMatch),
 * venue-source scrapers (fetchAllDbShows + matchVenueTitle),
 * fixed-venue and touring modes, standard and stealth browsers,
 * and both detail-scraping and flat-listing patterns.
 */

import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { launchBrowser } from "./browser.mjs";
import { createPrismaClient, normaliseForMatch } from "./db.mjs";
import { fetchAllDbShows, matchVenueTitle } from "./venue-match.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
} from "./cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── CLI parsing (shared across all scrapers) ──────────────────

function parseCli() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const debug = flags.has("--debug");
  const apply = flags.has("--apply");
  const jsonFlag = args.indexOf("--json");
  const jsonPath = jsonFlag !== -1 ? args[jsonFlag + 1] : null;
  return { debug, apply, jsonPath };
}

// ── Browser launch ────────────────────────────────────────────

async function openBrowser(stealth) {
  if (stealth) {
    const puppeteer = (await import("puppeteer-extra")).default;
    const StealthPlugin = (await import("puppeteer-extra-plugin-stealth"))
      .default;
    puppeteer.use(StealthPlugin());
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return launchBrowser();
}

// ── Main runner ───────────────────────────────────────────────

/**
 * @param {object} config
 * @param {string} config.label — Header title
 * @param {function} config.fetchListings — (browser) => listings array
 * @param {function} [config.scrapeShowEvents] — (browser, url, { debug }) => { events }
 * @param {string} [config.theatre] — DB theatre constant (theatre mode)
 * @param {string[]} [config.theatres] — Array of theatre names (multi-theatre mode; outputs venueSource format)
 * @param {boolean} [config.venueSource] — Use fetchAllDbShows + matchVenueTitle
 * @param {{ name: string, city: string }} [config.venue] — Fixed venue
 * @param {boolean} [config.touring] — Per-event venue from scrape results
 * @param {function} [config.resolveVenueCity] — (venueName) => city
 * @param {string} [config.defaultVenueName] — Fallback venue name for touring JSON
 * @param {function} [config.prepareScrape] — (browser) => extra opts merged into scrapeShowEvents calls
 * @param {string} [config.skipTheatre] — Skip matched shows from this theatre (venue mode)
 * @param {boolean} [config.stealth] — Use puppeteer-extra stealth
 * @param {number} [config.politeDelay] — ms between requests (default 1500)
 */
export function runScraper(config) {
  return _runScraper(config).catch((err) => {
    console.error(red(err.message));
    process.exit(1);
  });
}

async function _runScraper(config) {
  const {
    label,
    fetchListings,
    scrapeShowEvents,
    theatre,
    theatres,
    venueSource,
    venue,
    touring,
    resolveVenueCity,
    defaultVenueName,
    prepareScrape,
    skipTheatre,
    stealth,
    politeDelay = 1500,
  } = config;

  const isMultiTheatre = Array.isArray(theatres);

  dotenv.config({ path: path.join(rootDir, ".env.local") });
  const { debug, apply, jsonPath } = parseCli();

  // ── Header ──
  separator();
  console.log(bold(cyan(`  ${label} — All Shows`)));
  console.log(
    dim(
      `  Mode: ${jsonPath ? "JSON OUTPUT" : apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  // ── DB + shows ──
  let db = null;
  let dbShows;
  let allDbShows;

  if (venueSource) {
    allDbShows = await fetchAllDbShows();
    if (!allDbShows) {
      console.error(red("  DATABASE_URL not set — cannot query shows."));
      process.exit(1);
    }
    console.log(
      dim(`\n  Found ${allDbShows.length} shows in DB (all theatres).\n`),
    );
  } else {
    db = await createPrismaClient();
    if (!db) {
      console.error(red("  DATABASE_URL not set — cannot query shows."));
      process.exit(1);
    }
    try {
      const theatreFilter = isMultiTheatre ? { in: theatres } : theatre;
      dbShows = await db.prisma.show.findMany({
        where: { theatre: theatreFilter },
        select: { id: true, slug: true, title: true },
        orderBy: { title: "asc" },
      });
    } catch (err) {
      console.error(red(`  DB query failed: ${err.message}`));
      process.exit(1);
    }
    if (dbShows.length === 0) {
      console.log(yellow(`  No ${label} shows found in DB.`));
      if (jsonPath) {
        const output = { scrapedAt: new Date().toISOString() };
        if (isMultiTheatre) {
          output.venueSource = true;
          output.venue = { name: venue.name, city: venue.city };
        } else if (touring) {
          output.touring = true;
        } else if (venue) {
          output.venue = { name: venue.name, city: venue.city };
        }
        output.events = [];
        const outPath = path.resolve(rootDir, jsonPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
        console.log(green(`  Wrote 0 events to ${outPath}`));
      }
      await db.prisma.$disconnect();
      await db.pool.end();
      process.exit(0);
    }
    console.log(dim(`\n  Found ${dbShows.length} ${label} shows in DB.\n`));
  }

  // ── Browser + fetch listings ──
  const browser = await openBrowser(stealth);

  let listings;
  try {
    console.log(dim("  Fetching show listing…"));
    listings = await fetchListings(browser);
    if (venueSource && !scrapeShowEvents) {
      // Flat listing — report event count too
      const totalEvents = listings.reduce((n, l) => n + l.events.length, 0);
      console.log(
        dim(
          `  Listing returned ${listings.length} shows, ${totalEvents} event rows.\n`,
        ),
      );
    } else {
      console.log(dim(`  Listing returned ${listings.length} shows.\n`));
    }
  } catch (err) {
    console.error(red(`  Failed to fetch show listing: ${err.message}`));
    await browser.close();

    if (db) {
      await db.prisma.$disconnect();
      await db.pool.end();
    }
    process.exit(1);
  }

  // Close browser early for flat listings (no detail pages to scrape)
  if (venueSource && !scrapeShowEvents) {
    await browser.close();
  }

  // ── Match listings to DB shows ──
  const matched = [];
  const unmatched = [];
  const skippedOwnTheatre = [];

  if (venueSource) {
    for (const item of listings) {
      const result = matchVenueTitle(item.title, allDbShows);
      if (result) {
        if (skipTheatre && result.theatre === skipTheatre) {
          skippedOwnTheatre.push(item.title);
        } else {
          matched.push({
            showId: result.showId,
            showSlug: result.showSlug,
            title: item.title,
            theatre: result.theatre,
            url: item.detailUrl || null,
            events: item.events || null,
          });
        }
      } else {
        unmatched.push(item.title);
      }
    }
  } else if (isMultiTheatre) {
    // Multi-theatre: for each listing, look up in DB shows.
    // Reversed direction avoids reporting hundreds of unmatched DB shows
    // from other theatres (e.g. all independent shows not on this venue's site).
    const titleToShow = new Map();
    for (const show of dbShows) {
      titleToShow.set(normaliseForMatch(show.title), show);
    }
    for (const { title, url } of listings) {
      const key = normaliseForMatch(title);
      const show = titleToShow.get(key);
      if (show) {
        matched.push({
          showId: show.id,
          showSlug: show.slug,
          title: show.title,
          url,
        });
      } else {
        unmatched.push(title);
      }
    }
  } else {
    const listingMap = new Map();
    for (const { title, url } of listings) {
      listingMap.set(normaliseForMatch(title), url);
    }
    for (const show of dbShows) {
      const key = normaliseForMatch(show.title);
      const url = listingMap.get(key);
      if (url) {
        matched.push({
          showId: show.id,
          showSlug: show.slug,
          title: show.title,
          url,
        });
      } else {
        unmatched.push(show);
      }
    }
  }

  // ── Skipped own-theatre listings (venue mode) ──
  if (skippedOwnTheatre.length > 0) {
    console.log(
      dim(`  Skipped ${skippedOwnTheatre.length} own-theatre listing(s) (covered by theatre scraper):`),
    );
    for (const t of skippedOwnTheatre) {
      console.log(dim(`    - ${bidi(t)}`));
    }
    console.log("");
  }

  // ── Unmatched warnings ──
  if (unmatched.length > 0) {
    const noun = (venueSource || isMultiTheatre) ? "listing(s)" : "DB show(s)";
    console.log(
      yellow(`  Could not match ${unmatched.length} ${noun} to ${(venueSource || isMultiTheatre) ? "DB shows" : "listing URLs"}:`),
    );
    for (const s of unmatched) {
      if (typeof s === "string") {
        console.log(dim(`    - ${bidi(s)}`));
      } else {
        console.log(dim(`    - ${bidi(s.title)} (${s.slug})`));
      }
    }
    console.log("");
  }

  if (matched.length === 0) {
    console.log(red("  No shows matched — nothing to scrape."));

    if (!(venueSource && !scrapeShowEvents)) await browser.close();
    if (db) {
      await db.prisma.$disconnect();
      await db.pool.end();
    }
    process.exit(0);
  }

  console.log(cyan(`  Matched ${matched.length} shows. Scraping events…\n`));
  separator();

  // ── Venue upsert (fixed venue, --apply only) ──
  let fixedVenue = null;
  if (venue && apply) {
    if (!db) {
      db = await createPrismaClient();
      if (!db) {
        console.error(red("  DATABASE_URL not set — cannot apply."));
        if (!(venueSource && !scrapeShowEvents)) await browser.close();
        process.exit(1);
      }
    }
    fixedVenue = await db.prisma.venue.upsert({
      where: { name_city: { name: venue.name, city: venue.city } },
      create: { name: venue.name, city: venue.city, regions: [] },
      update: {},
    });
    console.log(dim(`  Venue: ${fixedVenue.name} (id=${fixedVenue.id})\n`));
  }

  // ── Optional pre-scrape hook (e.g. Habima presentations calendar) ──
  let extraOpts = {};
  if (prepareScrape) {
    try {
      extraOpts = (await prepareScrape(browser)) || {};
    } catch (err) {
      console.log(yellow(`  prepareScrape failed: ${err.message}`));
      console.log(yellow("  Proceeding without extra options.\n"));
    }
  }

  // ── Scrape loop ──
  const venueCache = new Map();
  const totals = { shows: 0, events: 0, created: 0, skipped: 0, failed: 0 };
  const collectedEvents = [];

  for (let i = 0; i < matched.length; i++) {
    const show = matched[i];
    const lbl = `[${i + 1}/${matched.length}]`;

    try {
      let events;

      if (scrapeShowEvents) {
        // Detail scraping — call scrapeShowEvents per show
        const result = await scrapeShowEvents(browser, show.url, { debug, ...extraOpts });
        events = result.events;

        if (events.length === 0) {
          console.log(
            yellow(`  ${lbl} ${bidi(show.title)}: no events found`),
          );
          totals.shows++;
          if (debug && result.debugHtml) {
            console.log(dim("    (debug HTML dumped above)"));
          }
          if (i < matched.length - 1) await sleep(politeDelay);
          continue;
        }
      } else {
        // Flat listing — events already on item
        events = show.events || [];
      }

      totals.shows++;
      totals.events += events.length;

      // ── Progress line ──
      if (venueSource) {
        console.log(
          green(
            `  ${lbl} ${bidi(show.title)} → ${bidi(show.theatre)}: ${events.length} event(s)`,
          ),
        );
      } else {
        console.log(
          green(`  ${lbl} ${bidi(show.title)}: ${events.length} event(s)`),
        );
      }

      // Warn about missing hours
      const emptyHours = events.filter((e) => !e.hour).length;
      if (emptyHours > 0) {
        console.log(
          yellow(
            `  ⚠  ${emptyHours}/${events.length} events have no hour — times may not be scraped correctly`,
          ),
        );
      }

      // ── Print events (dry-run / debug) ──
      if (!apply || debug) {
        for (const ev of events) {
          if (touring) {
            const vName = ev.venueName ? bidi(ev.venueName) : "(unknown)";
            const vCity = ev.venueCity ? dim(`(${bidi(ev.venueCity)})`) : "";
            console.log(
              dim(
                `        ${ev.date}  ${ev.hour || "??:??"}  ${vName}  ${vCity}`,
              ),
            );
          } else {
            const note = ev.note ? ` ${yellow(ev.note)}` : "";
            console.log(
              dim(`        ${ev.date}  ${ev.hour || "??:??"}${note}`),
            );
          }
        }
      }

      // ── Collect for JSON output ──
      if (jsonPath) {
        for (const ev of events) {
          const entry = {
            showId: show.showId,
            showSlug: show.showSlug,
            date: ev.date,
            hour: ev.hour || "00:00",
          };
          if (touring && !isMultiTheatre) {
            entry.venueName =
              ev.venueName || defaultVenueName || show.title;
            entry.venueCity =
              ev.venueCity ||
              (resolveVenueCity
                ? resolveVenueCity(entry.venueName)
                : "לא ידוע");
          }
          if (!touring && !venueSource && !isMultiTheatre && ev.note) {
            entry.note = ev.note;
          }
          collectedEvents.push(entry);
        }
      }

      // ── Apply to DB ──
      if (apply && !jsonPath) {
        if (!db) {
          db = await createPrismaClient();
        }
        let created = 0;
        let skipped = 0;

        for (const ev of events) {
          let eventVenue = fixedVenue;

          // Touring: resolve venue per event (skip for multi-theatre — uses fixed venue)
          if (touring && !isMultiTheatre) {
            const venueName =
              ev.venueName || defaultVenueName || show.title;
            const venueCity =
              ev.venueCity ||
              (resolveVenueCity ? resolveVenueCity(venueName) : "לא ידוע");
            const cacheKey = `${venueName}|${venueCity}`;
            eventVenue = venueCache.get(cacheKey);
            if (!eventVenue) {
              eventVenue = await db.prisma.venue.upsert({
                where: { name_city: { name: venueName, city: venueCity } },
                create: { name: venueName, city: venueCity, regions: [] },
                update: {},
              });
              venueCache.set(cacheKey, eventVenue);
            }
          }

          if (!eventVenue) continue;

          try {
            await db.prisma.event.upsert({
              where: {
                showId_venueId_date_hour: {
                  showId: show.showId,
                  venueId: eventVenue.id,
                  date: new Date(ev.date),
                  hour: ev.hour || "00:00",
                },
              },
              create: {
                showId: show.showId,
                venueId: eventVenue.id,
                date: new Date(ev.date),
                hour: ev.hour || "00:00",
              },
              update: {},
            });
            created++;
          } catch (e) {
            skipped++;
            if (debug) {
              console.log(
                dim(`        skip ${ev.date} ${ev.hour}: ${e.message}`),
              );
            }
          }
        }
        totals.created += created;
        totals.skipped += skipped;
        console.log(
          dim(`        → DB: ${created} created, ${skipped} skipped`),
        );
      }
    } catch (err) {
      totals.failed++;
      totals.shows++;
      console.log(
        red(`  ${lbl} ${bidi(show.title)}: ERROR — ${err.message}`),
      );
    }

    // Polite delay between detail-page requests
    if (scrapeShowEvents && i < matched.length - 1) {
      await sleep(politeDelay);
    }
  }

  // ── JSON output ──
  if (jsonPath) {
    const outPath = path.resolve(rootDir, jsonPath);

    // Guard: if we scraped 0 events but the existing file has events,
    // preserve the existing events to avoid data loss (e.g. transient
    // Cloudflare block or site outage).
    if (collectedEvents.length === 0 && fs.existsSync(outPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
        if (Array.isArray(existing.events) && existing.events.length > 0) {
          existing.scrapedAt = new Date().toISOString();
          fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), "utf-8");
          console.log(
            yellow(
              `\n  0 events scraped but existing file has ${existing.events.length} — preserved existing events (updated scrapedAt).`,
            ),
          );
          // Skip normal write
        } else {
          // Existing file also has 0 events — write normally
          const output = { scrapedAt: new Date().toISOString() };
          if (venueSource || isMultiTheatre) {
            output.venueSource = true;
            output.venue = { name: venue.name, city: venue.city };
          } else if (touring) {
            output.touring = true;
          } else if (venue) {
            output.venue = { name: venue.name, city: venue.city };
          }
          output.events = [];
          fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
          console.log(green(`\n  Wrote 0 events to ${outPath}`));
        }
      } catch {
        // Existing file is corrupt — write normally
        const output = { scrapedAt: new Date().toISOString() };
        output.events = [];
        fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
        console.log(green(`\n  Wrote 0 events to ${outPath}`));
      }
    } else {
      const output = { scrapedAt: new Date().toISOString() };
      if (venueSource || isMultiTheatre) {
        output.venueSource = true;
        output.venue = { name: venue.name, city: venue.city };
      } else if (touring) {
        output.touring = true;
      } else if (venue) {
        output.venue = { name: venue.name, city: venue.city };
      }
      output.events = collectedEvents;

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
      console.log(
        green(`\n  Wrote ${collectedEvents.length} events to ${outPath}`),
      );
    }
  }

  // ── Cleanup ──
  if (scrapeShowEvents || !venueSource) {
    await browser.close();
  }
  if (db) {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  // ── Summary ──
  console.log("");
  separator();
  console.log(bold(cyan("  Summary")));
  separator();
  if (venueSource || isMultiTheatre) {
    console.log(`  Listings found:   ${listings.length}`);
    console.log(`  Shows matched:    ${matched.length}`);
  }
  console.log(`  Shows processed:  ${totals.shows}`);
  console.log(`  Total events:     ${totals.events}`);
  if (apply && !jsonPath) {
    console.log(green(`  Events created:   ${totals.created}`));
    console.log(dim(`  Events skipped:   ${totals.skipped}`));
  }
  if (jsonPath) {
    console.log(green(`  Events written:   ${collectedEvents.length}`));
  }
  if (totals.failed > 0) {
    console.log(red(`  Shows failed:     ${totals.failed}`));
  }
  if (unmatched.length > 0) {
    const noun = (venueSource || isMultiTheatre) ? "Listings skipped" : "Shows unmatched";
    console.log(yellow(`  ${noun}:  ${unmatched.length}`));
  }
  separator();
  console.log("");
}
