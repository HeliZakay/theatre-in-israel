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

// Returns the previous tracked version of a file, or null if git isn't
// available (e.g. on Vercel runtime where the repo isn't a working tree).
//
// We can't just use HEAD~1 — the nightly workflow now makes multiple
// commits per run (scrape commit + verifier commit), so HEAD~1 could be
// today's scrape itself and the diff would be 0. Instead, ask git for
// the second-most-recent commit that actually touched this file. That's
// always the previous nightly's scrape regardless of intervening
// commits that didn't change the events JSON.
function readPreviousFile(relPath) {
  try {
    const commit = execSync(
      `git log --skip 1 -1 --format=%H -- "${relPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    if (!commit) return null;
    return execSync(`git show ${commit}:${relPath}`, {
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

// Read llm-verifications.json (if present). Returns the parsed summary
// plus disagree verdicts grouped by source file.
//   { summary: {...} | null, byFile: Map<filename, Array<{event, reason}>> }
function readLlmVerifications(dataDir) {
  const byFile = new Map();
  let summary = null;
  try {
    const raw = readFileSync(join(dataDir, "llm-verifications.json"), "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data.summary === "object") summary = data.summary;
    if (Array.isArray(data.results)) {
      for (const r of data.results) {
        if (r.verdict !== "disagree") continue;
        if (!byFile.has(r.file)) byFile.set(r.file, []);
        byFile.get(r.file).push({ event: r.event, reason: r.reason });
      }
    }
  } catch {
    // No verification file or unreadable — skip silently.
  }
  return { summary, byFile };
}

// Detect the silent-failure shape: the verifier ran but produced zero
// valid verdicts. That means LLM calls and/or page fetches all failed and
// nothing useful made it into the file. Surface this as a top-level
// anomaly so the email and admin page render it loudly.
export function checkVerifierBroken(summary) {
  if (!summary) return null;
  const agree = Number(summary.agree) || 0;
  const disagree = Number(summary.disagree) || 0;
  const uncertain = Number(summary.uncertain) || 0;
  if (agree + disagree === 0 && uncertain > 10) {
    return {
      kind: "verifier-broken",
      summary: `LLM verifier produced 0 valid verdicts across ${uncertain} events — check workflow logs for permission errors (e.g. missing models scope)`,
      events: [],
    };
  }
  return null;
}

/**
 * @param {object} opts
 * @param {string} opts.dataDir — absolute path to the directory of events-*.json files
 * @param {Array<{ jsonFile: string, label: string }>} opts.theatres
 * @param {boolean} [opts.includePrevious=true] — read HEAD~1 for diff/count-drop
 */
export function readReport({ dataDir, theatres, includePrevious = true }) {
  const { summary: llmSummary, byFile: llmDisagreements } =
    readLlmVerifications(dataDir);
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

      // Fold in LLM disagreements (if a verification ran for this file).
      const fileDisagreements = llmDisagreements.get(file);
      if (fileDisagreements && fileDisagreements.length) {
        issues.push({
          kind: "llm-disagreement",
          summary: `${fileDisagreements.length} event(s) the LLM verifier disagrees with — page does not corroborate the scraped date/time/show`,
          events: fileDisagreements.map((d) => ({
            ...d.event,
            llmReason: d.reason,
          })),
        });
      }

      if (issues.length) anomalies.push({ label, file, issues });
      allFileEvents.push({ file, label, events: current.events });

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

  const verifierBroken = checkVerifierBroken(llmSummary);
  if (verifierBroken) {
    anomalies.unshift({
      label: "LLM verifier",
      file: "llm-verifications.json",
      issues: [verifierBroken],
    });
  }

  return {
    rows,
    totalEvents,
    totalShows,
    totalNew,
    totalRemoved,
    anomalies,
    crossRef,
    allFileEvents,
    llmSummary,
  };
}
