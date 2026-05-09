/**
 * Shared anomaly-detection logic for scraped events.
 *
 * Consumed by both the nightly email report and the /admin/flagged page so
 * they agree on what counts as an anomaly. Pure JSON inspection — no DB.
 *
 * Each issue carries the offending events themselves (not just a count) so
 * the admin page can render clickable rows; the email render path collapses
 * them to a summary string.
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const COUNT_DROP_THRESHOLD = 0.3;
const STALE_HOURS = 48; // matches scripts/lib/scraper-freshness.js threshold

export function todayInJerusalem() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

function isValidHour(h) {
  if (!h || typeof h !== "string") return false;
  const m = /^(\d{2}):(\d{2})$/.exec(h);
  if (!m) return false;
  const hh = +m[1];
  const mm = +m[2];
  return hh >= 8 && hh <= 23 && mm < 60;
}

function eventKey(e) {
  return `${e.showId}|${e.date}|${e.hour}`;
}

function parseEvents(raw) {
  const data = JSON.parse(raw);
  const events = data.events ?? [];
  return {
    events,
    scrapedAt: data.scrapedAt,
    map: new Map(events.map((e) => [eventKey(e), e])),
  };
}

// Returns previous version of a tracked file from one commit ago, or null
// if git isn't available (e.g. on Vercel runtime where the repo isn't a
// working tree). The count-drop check silently no-ops in that case.
function readPreviousFile(relPath) {
  try {
    return execSync(`git show HEAD~1:${relPath}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

export function checkFileAnomalies(events, prevEventCount, scrapedAt) {
  const today = todayInJerusalem();
  const issues = [];

  if (scrapedAt) {
    const ageMs = Date.now() - new Date(scrapedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (Number.isFinite(ageHours) && ageHours > STALE_HOURS) {
      issues.push({
        kind: "stale-data",
        summary: `last scraped ${Math.round(ageHours)}h ago — workflow may not be running`,
        events: [],
      });
    }
  }

  const unknownCity = events.filter((e) => e.venueCity === "לא ידוע");
  if (unknownCity.length) {
    issues.push({
      kind: "unknown-venue",
      summary: `${unknownCity.length} event(s) with venueCity="לא ידוע" — touring fallback fired, venue not resolved`,
      events: unknownCity,
    });
  }

  const suspectHour = events.filter((e) => e.suspectHour === true);
  if (suspectHour.length) {
    issues.push({
      kind: "suspect-hour",
      summary: `${suspectHour.length} event(s) with hour likely confused with duration ("דקות" near hour value)`,
      events: suspectHour,
    });
  }

  const past = events.filter((e) => e.date && e.date < today);
  if (past.length) {
    issues.push({
      kind: "past-date",
      summary: `${past.length} past-dated event(s)`,
      events: past,
    });
  }

  const badHours = events.filter((e) => !isValidHour(e.hour));
  if (badHours.length) {
    const zeros = badHours.filter((e) => e.hour === "00:00").length;
    const summary = zeros
      ? `${badHours.length} bad hour(s) — ${zeros} are 00:00 (likely extraction failure)`
      : `${badHours.length} bad hour(s)`;
    issues.push({ kind: "bad-hour", summary, events: badHours });
  }

  const seen = new Map();
  for (const e of events) {
    const k = `${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push(e);
  }
  let dupeCount = 0;
  const dupeEvents = [];
  for (const arr of seen.values()) {
    if (arr.length > 1) {
      dupeCount += arr.length - 1;
      dupeEvents.push(...arr);
    }
  }
  if (dupeCount) {
    issues.push({
      kind: "duplicate",
      summary: `${dupeCount} duplicate event row(s)`,
      events: dupeEvents,
    });
  }

  if (
    prevEventCount != null &&
    prevEventCount >= 5 &&
    events.length < prevEventCount * (1 - COUNT_DROP_THRESHOLD)
  ) {
    const pct = Math.round(
      ((prevEventCount - events.length) / prevEventCount) * 100,
    );
    issues.push({
      kind: "count-drop",
      summary: `event count dropped ${pct}% (${prevEventCount} → ${events.length}) — possible scraper failure`,
      events: [],
    });
  }

  return issues;
}

export function buildCrossRef(allFileEvents) {
  const today = todayInJerusalem();
  const keyToFiles = new Map();
  for (const { file, events } of allFileEvents) {
    for (const e of events) {
      if (!e.showSlug || !e.date || e.date < today) continue;
      const k = `${e.showSlug}|${e.date}|${e.hour}`;
      if (!keyToFiles.has(k)) keyToFiles.set(k, new Set());
      keyToFiles.get(k).add(file);
    }
  }
  let confirmed = 0;
  let totalFuture = 0;
  for (const files of keyToFiles.values()) {
    totalFuture++;
    if (files.size >= 2) confirmed++;
  }
  return { confirmed, totalFuture };
}

/**
 * @param {object} opts
 * @param {string} opts.dataDir — absolute path to the directory of events-*.json files
 * @param {Array<{ jsonFile: string, label: string }>} opts.theatres
 * @param {boolean} [opts.includePrevious=true] — read HEAD~1 for diff/count-drop
 */
export function readReport({ dataDir, theatres, includePrevious = true }) {
  const rows = [];
  let totalEvents = 0;
  let totalShows = 0;
  let totalNew = 0;
  let totalRemoved = 0;
  const anomalies = [];
  const allFileEvents = [];

  for (const { jsonFile: file, label } of theatres) {
    const relPath = `prisma/data/${file}`;
    try {
      const raw = readFileSync(join(dataDir, file), "utf-8");
      const current = parseEvents(raw);
      const shows = new Set(current.events.map((e) => e.showId)).size;

      let added = [];
      let removed = [];
      let prevEventCount = null;
      if (includePrevious) {
        const prevRaw = readPreviousFile(relPath);
        if (prevRaw) {
          const prev = parseEvents(prevRaw);
          added = current.events.filter((e) => !prev.map.has(eventKey(e)));
          removed = prev.events.filter((e) => !current.map.has(eventKey(e)));
          prevEventCount = prev.events.length;
        }
      }

      const issues = checkFileAnomalies(
        current.events,
        prevEventCount,
        current.scrapedAt,
      );
      if (issues.length) anomalies.push({ label, file, issues });
      allFileEvents.push({ file, events: current.events });

      rows.push({
        label,
        file,
        events: current.events.length,
        shows,
        added,
        removed,
        ok: true,
      });
      totalEvents += current.events.length;
      totalShows += shows;
      totalNew += added.length;
      totalRemoved += removed.length;
    } catch {
      rows.push({
        label,
        file,
        events: 0,
        shows: 0,
        added: [],
        removed: [],
        ok: false,
      });
      anomalies.push({
        label,
        file,
        issues: [{ kind: "unreadable", summary: "file unreadable", events: [] }],
      });
    }
  }

  const crossRef = buildCrossRef(allFileEvents);
  return {
    rows,
    totalEvents,
    totalShows,
    totalNew,
    totalRemoved,
    anomalies,
    crossRef,
  };
}
