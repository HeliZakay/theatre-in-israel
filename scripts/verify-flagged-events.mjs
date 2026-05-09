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
 * Usage:
 *   node scripts/verify-flagged-events.mjs           # default: up to 30 events
 *   node scripts/verify-flagged-events.mjs --max=50  # custom cap
 *   node scripts/verify-flagged-events.mjs --dry-run # don't write output
 */

import { join } from "path";
import { writeFileSync } from "fs";
import { readReport } from "../src/lib/event-anomalies.mjs";
import { THEATRES } from "./lib/theatres-config.mjs";
import { createAIClient } from "./lib/ai.mjs";
import { fetchPageText, verifyEvent } from "./lib/verify-llm.mjs";

const DEFAULT_MAX = 30;

function parseCli() {
  const args = process.argv.slice(2);
  let max = DEFAULT_MAX;
  let dryRun = false;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--max=")) max = parseInt(a.slice(6), 10) || max;
  }
  return { max, dryRun };
}

// Pick events to verify: take events from each flagged issue that has a
// sourceUrl. Dedupe by (sourceUrl + showSlug + date + hour) so we don't
// hit the same page twice. Cap at `max`.
function selectEvents(anomalies, max) {
  const seen = new Map();
  for (const { label, file, issues } of anomalies) {
    for (const issue of issues) {
      for (const e of issue.events) {
        if (!e.sourceUrl) continue;
        const k = `${e.sourceUrl}|${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
        if (seen.has(k)) continue;
        seen.set(k, { theatre: label, file, issueKind: issue.kind, event: e });
        if (seen.size >= max) return [...seen.values()];
      }
    }
  }
  return [...seen.values()];
}

async function main() {
  const { max, dryRun } = parseCli();
  const dataDir = join(process.cwd(), "prisma", "data");

  const aiClient = createAIClient();
  if (!aiClient) {
    console.error(
      "[verify] GITHUB_TOKEN not set — skipping LLM verification.",
    );
    process.exit(0);
  }

  const report = readReport({ dataDir, theatres: THEATRES });
  const targets = selectEvents(report.anomalies, max);

  console.log(
    `[verify] ${report.anomalies.length} flagged file(s); ${targets.length} event(s) to verify (max ${max})`,
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
  for (let i = 0; i < targets.length; i++) {
    const { theatre, file, issueKind, event } = targets[i];
    const lbl = `[${i + 1}/${targets.length}]`;
    process.stdout.write(`${lbl} ${event.showSlug ?? event.showId} ${event.date} ${event.hour} — `);

    const fetched = await fetchPageText(event.sourceUrl);
    if (!fetched.ok) {
      console.log(`fetch failed (${fetched.status || fetched.error})`);
      results.push({
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
      results.push({ theatre, file, issueKind, event, ...v });
    } catch (err) {
      console.log(`error — ${err.message}`);
      results.push({
        theatre,
        file,
        issueKind,
        event,
        verdict: "uncertain",
        reason: `verifier error: ${err.message}`,
      });
    }
  }

  const summary = {
    agree: results.filter((r) => r.verdict === "agree").length,
    disagree: results.filter((r) => r.verdict === "disagree").length,
    uncertain: results.filter((r) => r.verdict === "uncertain").length,
  };
  console.log(
    `[verify] done — agree=${summary.agree} disagree=${summary.disagree} uncertain=${summary.uncertain}`,
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
