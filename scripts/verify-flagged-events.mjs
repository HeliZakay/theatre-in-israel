#!/usr/bin/env node
/**
 * verify-flagged-events.mjs — run LLM verification on flagged events.
 *
 * Reads anomalies from event-anomalies.mjs, picks events that have a
 * sourceUrl in any flagged issue, fetches each page, asks the model
 * whether the claim is corroborated, and writes the verdicts to
 * prisma/data/llm-verifications.json. The anomaly checker reads that
 * file and surfaces "disagree" verdicts as a new issue kind, so the
 * email and the /admin/flagged page pick them up automatically.
 *
 * Runs in two passes:
 *   1. FLAGGED — every event in any anomaly issue that has sourceUrl,
 *      capped at --max-flagged (default 30). High-priority triage.
 *   2. SAMPLED — random events per file that did NOT trigger an anomaly,
 *      with sourceUrl, --sample-per-file (default 3) per scraper. This
 *      catches silent-wrong events that pass structural checks but are
 *      actually wrong (wrong date parsing, wrong title binding, etc.).
 *
 * Usage:
 *   node scripts/verify-flagged-events.mjs                       # default
 *   node scripts/verify-flagged-events.mjs --max-flagged=50      # cap A
 *   node scripts/verify-flagged-events.mjs --sample-per-file=5   # cap B
 *   node scripts/verify-flagged-events.mjs --no-sample           # flagged only
 *   node scripts/verify-flagged-events.mjs --dry-run             # don't write
 */

import { join } from "path";
import { writeFileSync } from "fs";
import { readReport } from "../src/lib/event-anomalies.mjs";
import { THEATRES } from "./lib/theatres-config.mjs";
import { createAIClient } from "./lib/ai.mjs";
import { fetchPageText, verifyEvent } from "./lib/verify-llm.mjs";

const DEFAULT_MAX_FLAGGED = 30;
const DEFAULT_SAMPLE_PER_FILE = 3;

function parseCli() {
  const args = process.argv.slice(2);
  let maxFlagged = DEFAULT_MAX_FLAGGED;
  let samplePerFile = DEFAULT_SAMPLE_PER_FILE;
  let noSample = false;
  let dryRun = false;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--no-sample") noSample = true;
    else if (a.startsWith("--max-flagged=")) {
      maxFlagged = parseInt(a.slice(14), 10) || maxFlagged;
    } else if (a.startsWith("--sample-per-file=")) {
      samplePerFile = parseInt(a.slice(18), 10) || samplePerFile;
    }
  }
  return { maxFlagged, samplePerFile, noSample, dryRun };
}

// Pick events to verify from anomalies. Dedupe by (sourceUrl + showSlug +
// date + hour) so we don't hit the same page twice. Cap at `max`.
function selectFlagged(anomalies, max) {
  const seen = new Map();
  for (const { label, file, issues } of anomalies) {
    for (const issue of issues) {
      for (const e of issue.events) {
        if (!e.sourceUrl) continue;
        const k = `${e.sourceUrl}|${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
        if (seen.has(k)) continue;
        seen.set(k, {
          kind: "flagged",
          theatre: label,
          file,
          issueKind: issue.kind,
          event: e,
        });
        if (seen.size >= max) return [...seen.values()];
      }
    }
  }
  return [...seen.values()];
}

// Random sample of unflagged events with sourceUrl, perFile per file.
// Skips events already in `excludeKeys` (the flagged set). Uses
// Math.random — over time every event eventually gets sampled.
function selectSampled(allFileEvents, perFile, excludeKeys) {
  const out = [];
  for (const { file, label, events } of allFileEvents) {
    const candidates = events.filter((e) => {
      if (!e.sourceUrl) return false;
      const k = `${e.sourceUrl}|${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
      return !excludeKeys.has(k);
    });
    if (candidates.length === 0) continue;
    // Fisher-Yates shuffle until we have perFile picks
    const pool = [...candidates];
    const picks = [];
    while (picks.length < perFile && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    for (const e of picks) {
      out.push({
        kind: "sampled",
        theatre: label,
        file,
        issueKind: null,
        event: e,
      });
    }
  }
  return out;
}

async function main() {
  const { maxFlagged, samplePerFile, noSample, dryRun } = parseCli();
  const dataDir = join(process.cwd(), "prisma", "data");

  const aiClient = createAIClient();
  if (!aiClient) {
    console.error(
      "[verify] GITHUB_TOKEN not set — skipping LLM verification.",
    );
    process.exit(0);
  }

  const report = readReport({ dataDir, theatres: THEATRES });
  const flaggedTargets = selectFlagged(report.anomalies, maxFlagged);
  const flaggedKeys = new Set(
    flaggedTargets.map(
      (t) =>
        `${t.event.sourceUrl}|${t.event.showSlug ?? t.event.showId}|${t.event.date}|${t.event.hour}`,
    ),
  );
  const sampledTargets = noSample
    ? []
    : selectSampled(report.allFileEvents, samplePerFile, flaggedKeys);
  const targets = [...flaggedTargets, ...sampledTargets];

  console.log(
    `[verify] ${report.anomalies.length} flagged file(s); ` +
      `${flaggedTargets.length} flagged event(s) (cap ${maxFlagged}), ` +
      `${sampledTargets.length} sampled event(s) (${samplePerFile}/file)`,
  );
  if (targets.length === 0) {
    if (!dryRun) {
      writeFileSync(
        join(dataDir, "llm-verifications.json"),
        JSON.stringify({ checkedAt: new Date().toISOString(), results: [] }, null, 2),
        "utf-8",
      );
    }
    return;
  }

  const results = [];
  // Cache by sourceUrl to avoid refetching the same page when multiple
  // events share it (common: many events per show detail page).
  const pageCache = new Map();
  for (let i = 0; i < targets.length; i++) {
    const { kind, theatre, file, issueKind, event } = targets[i];
    const lbl = `[${i + 1}/${targets.length}]`;
    const tag = kind === "sampled" ? "S" : "F";
    process.stdout.write(
      `${lbl}[${tag}] ${event.showSlug ?? event.showId} ${event.date} ${event.hour} — `,
    );

    let fetched = pageCache.get(event.sourceUrl);
    if (!fetched) {
      fetched = await fetchPageText(event.sourceUrl);
      pageCache.set(event.sourceUrl, fetched);
    }
    if (!fetched.ok) {
      console.log(`fetch failed (${fetched.status || fetched.error})`);
      results.push({
        kind,
        theatre,
        file,
        issueKind,
        event,
        verdict: "uncertain",
        reason: `fetch failed: ${fetched.status || fetched.error}`,
      });
      continue;
    }

    try {
      const v = await verifyEvent(aiClient, { event, pageText: fetched.text });
      console.log(`${v.verdict}${v.reason ? ` — ${v.reason}` : ""}`);
      results.push({ kind, theatre, file, issueKind, event, ...v });
    } catch (err) {
      console.log(`error — ${err.message}`);
      results.push({
        kind,
        theatre,
        file,
        issueKind,
        event,
        verdict: "uncertain",
        reason: `verifier error: ${err.message}`,
      });
    }
  }

  const tally = (filter) => ({
    agree: results.filter((r) => filter(r) && r.verdict === "agree").length,
    disagree: results.filter((r) => filter(r) && r.verdict === "disagree").length,
    uncertain: results.filter((r) => filter(r) && r.verdict === "uncertain").length,
  });
  const summary = {
    flagged: tally((r) => r.kind === "flagged"),
    sampled: tally((r) => r.kind === "sampled"),
    overall: tally(() => true),
  };
  console.log(
    `[verify] done — flagged: agree=${summary.flagged.agree} disagree=${summary.flagged.disagree} uncertain=${summary.flagged.uncertain}; ` +
      `sampled: agree=${summary.sampled.agree} disagree=${summary.sampled.disagree} uncertain=${summary.sampled.uncertain}`,
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
