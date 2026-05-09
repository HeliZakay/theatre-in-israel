#!/usr/bin/env node
/**
 * verify-flagged-events.mjs — LLM verification of every event with a sourceUrl.
 *
 * Strategy: group events by sourceUrl (a "page"). Fetch each page once
 * and ask the model to verify every event claimed for that page in a
 * single call. A show with 10 performance dates → 1 page fetch + 1 LLM
 * call instead of 10 of each. This makes 100% coverage cheap enough to
 * run nightly without sampling.
 *
 * Pages are processed in priority order: pages whose events are flagged
 * by another anomaly check go first, so even if a budget cap kicks in
 * the highest-risk pages always get verified.
 *
 * Output: prisma/data/llm-verifications.json. The anomaly checker reads
 * it and surfaces "disagree" verdicts via the llm-disagreement issue
 * kind, which the email and /admin/flagged page render automatically.
 *
 * Usage:
 *   node scripts/verify-flagged-events.mjs                  # default: all pages
 *   node scripts/verify-flagged-events.mjs --max-pages=200  # cap for safety
 *   node scripts/verify-flagged-events.mjs --dry-run        # don't write file
 */

import { join } from "path";
import { writeFileSync } from "fs";
import { readReport } from "../src/lib/event-anomalies.mjs";
import { THEATRES } from "./lib/theatres-config.mjs";
import { createAIClient } from "./lib/ai.mjs";
import { fetchPageText, verifyEventsBatch } from "./lib/verify-llm.mjs";

function parseCli() {
  const args = process.argv.slice(2);
  let maxPages = Infinity;
  let dryRun = false;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--max-pages=")) {
      maxPages = parseInt(a.slice(12), 10) || maxPages;
    }
  }
  return { maxPages, dryRun };
}

// Build a Set of "showSlug|date|hour" for every event mentioned in any
// anomaly issue, so we can mark pages as "high priority" downstream.
function flaggedEventKeys(anomalies) {
  const keys = new Set();
  for (const { issues } of anomalies) {
    for (const issue of issues) {
      for (const e of issue.events) {
        keys.add(`${e.showSlug ?? e.showId}|${e.date}|${e.hour}`);
      }
    }
  }
  return keys;
}

// Group events by sourceUrl. Each page's entry contains the file label,
// the events claimed for that page, and a flag indicating whether at
// least one event on the page was already flagged by another check.
function groupByPage(allFileEvents, flaggedKeys) {
  const pages = new Map();
  for (const { file, label, events } of allFileEvents) {
    for (const e of events) {
      if (!e.sourceUrl) continue;
      let page = pages.get(e.sourceUrl);
      if (!page) {
        page = {
          sourceUrl: e.sourceUrl,
          file,
          theatre: label,
          events: [],
          hasFlagged: false,
        };
        pages.set(e.sourceUrl, page);
      }
      page.events.push(e);
      const k = `${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
      if (flaggedKeys.has(k)) page.hasFlagged = true;
    }
  }
  // Sort: flagged pages first, then by URL for stable ordering.
  return [...pages.values()].sort((a, b) => {
    if (a.hasFlagged !== b.hasFlagged) return a.hasFlagged ? -1 : 1;
    return a.sourceUrl.localeCompare(b.sourceUrl);
  });
}

async function main() {
  const { maxPages, dryRun } = parseCli();
  const dataDir = join(process.cwd(), "prisma", "data");

  const aiClient = createAIClient();
  if (!aiClient) {
    console.error(
      "[verify] GITHUB_TOKEN not set — skipping LLM verification.",
    );
    process.exit(0);
  }

  const report = readReport({ dataDir, theatres: THEATRES });
  const flaggedKeys = flaggedEventKeys(report.anomalies);
  const allPages = groupByPage(report.allFileEvents, flaggedKeys);
  const pages = Number.isFinite(maxPages) ? allPages.slice(0, maxPages) : allPages;
  const skipped = allPages.length - pages.length;

  const totalEvents = pages.reduce((n, p) => n + p.events.length, 0);
  const flaggedPages = pages.filter((p) => p.hasFlagged).length;
  console.log(
    `[verify] ${allPages.length} unique source pages covering ${report.allFileEvents.reduce((n, f) => n + f.events.filter((e) => e.sourceUrl).length, 0)} events with sourceUrl. ` +
      `Verifying ${pages.length} page(s) (${flaggedPages} flagged, ${pages.length - flaggedPages} unflagged), ${totalEvents} event(s)${skipped ? `; skipping ${skipped} over budget` : ""}.`,
  );

  const results = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const lbl = `[${i + 1}/${pages.length}]`;
    const tag = page.hasFlagged ? "F" : " ";
    process.stdout.write(
      `${lbl}[${tag}] ${page.theatre} (${page.events.length} ev) — `,
    );

    const fetched = await fetchPageText(page.sourceUrl);
    if (!fetched.ok) {
      console.log(`fetch failed (${fetched.status || fetched.error})`);
      for (const event of page.events) {
        results.push({
          theatre: page.theatre,
          file: page.file,
          wasFlagged: flaggedKeys.has(
            `${event.showSlug ?? event.showId}|${event.date}|${event.hour}`,
          ),
          event,
          verdict: "uncertain",
          reason: `fetch failed: ${fetched.status || fetched.error}`,
        });
      }
      continue;
    }

    let verdicts;
    try {
      verdicts = await verifyEventsBatch(aiClient, {
        events: page.events,
        pageText: fetched.text,
      });
    } catch (err) {
      console.log(`error — ${err.message}`);
      for (const event of page.events) {
        results.push({
          theatre: page.theatre,
          file: page.file,
          wasFlagged: flaggedKeys.has(
            `${event.showSlug ?? event.showId}|${event.date}|${event.hour}`,
          ),
          event,
          verdict: "uncertain",
          reason: `verifier error: ${err.message}`,
        });
      }
      continue;
    }

    const counts = { agree: 0, disagree: 0, uncertain: 0 };
    for (let j = 0; j < page.events.length; j++) {
      const event = page.events[j];
      const v = verdicts[j] ?? { verdict: "uncertain", reason: "" };
      counts[v.verdict] = (counts[v.verdict] ?? 0) + 1;
      results.push({
        theatre: page.theatre,
        file: page.file,
        wasFlagged: flaggedKeys.has(
          `${event.showSlug ?? event.showId}|${event.date}|${event.hour}`,
        ),
        event,
        verdict: v.verdict,
        reason: v.reason,
      });
    }
    console.log(
      `agree=${counts.agree} disagree=${counts.disagree} uncertain=${counts.uncertain}`,
    );
  }

  const summary = {
    pagesVerified: pages.length,
    pagesSkipped: skipped,
    eventsVerified: results.length,
    agree: results.filter((r) => r.verdict === "agree").length,
    disagree: results.filter((r) => r.verdict === "disagree").length,
    uncertain: results.filter((r) => r.verdict === "uncertain").length,
  };
  console.log(
    `[verify] done — agree=${summary.agree} disagree=${summary.disagree} uncertain=${summary.uncertain} ` +
      `across ${summary.eventsVerified} events on ${summary.pagesVerified} pages` +
      (summary.pagesSkipped ? ` (${summary.pagesSkipped} pages skipped)` : ""),
  );

  if (!dryRun) {
    const outPath = join(dataDir, "llm-verifications.json");
    writeFileSync(
      outPath,
      JSON.stringify(
        { checkedAt: new Date().toISOString(), summary, results },
        null,
        2,
      ),
      "utf-8",
    );
    console.log(`[verify] wrote ${results.length} result(s) to ${outPath}`);
  }
}

main().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});
