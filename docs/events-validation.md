# Events Validation System

A nightly check that scraped events actually match what the source websites
say. Catches scraper malfunctions (structural checks) and silent-wrong data
where the JSON looks valid but the values are incorrect (LLM verification).

This document is for the future maintainer (likely me) picking this up after
months without context. It covers what the code doesn't already tell you:
*why* thresholds are what they are, *what slips through anyway*, and *how
to extend it* without breaking the contract between modules.

---

## Pipeline (where validation fits)

```
GitHub Actions: Refresh Events  (nightly 03:00 UTC)
  ┌─────────────────────────────────────────────────┐
  │ scrape-all-events.mjs   → prisma/data/events-*.json
  │ git commit + push        (only if diffs)
  │ check-scraper-freshness.mjs  (fails CI if any file > 48h)
  │ verify-flagged-events.mjs    ← LLM verifier
  │   ↳ writes prisma/data/llm-verifications.json
  │   ↳ commits + pushes that file
  │ send-events-report.mjs       ← email
  │   ↳ reads anomalies + LLM verifications, sends Resend email
  └─────────────────────────────────────────────────┘

Vercel build (triggered by the commit):
  prisma migrate deploy → prisma/sync-events.js → DB upsert

Admin UI:
  /admin/flagged  (gated by NextAuth + email match)
    ↳ same anomaly source as the email
```

The whole validation surface uses **`src/lib/event-anomalies.mjs`** as a
single source of truth. The email and the admin page both call its
`readReport()` so the two views always agree.

---

## File map

| File | Role |
|---|---|
| `src/lib/event-anomalies.mjs` | Pure JSON inspection. `readReport()` returns `{ rows, anomalies, crossRef, allFileEvents }`. Folds in LLM disagreements when present. **No DB calls** — runs at runtime in Vercel and in CI. |
| `scripts/send-events-report.mjs` | Email. Renders `readReport()` output as HTML, sends via Resend. |
| `src/app/admin/flagged/page.tsx` | Admin page. Server component. Renders `readReport()` output as clickable rows. Auth-gated by `requireAuth` + email match. |
| `scripts/lib/verify-llm.mjs` | LLM client wrappers. `verifyEvent` (single) and `verifyEventsBatch` (multi-events-per-page). Hebrew prompt. Uses GitHub Models channel. |
| `scripts/verify-flagged-events.mjs` | Orchestrator. Groups all events by `sourceUrl`, calls `verifyEventsBatch` once per page, writes `prisma/data/llm-verifications.json`. |
| `scripts/lib/scraper-runner.mjs` | Runs every scraper. Filters past-dated events centrally, drops cancelled events (`נדחה`/`בוטל` in `rawText`), tags suspect hours, dedupes venue-source matches by `showId`. Plumbs `sourceUrl` + `ticketUrl` into the JSON output. |

---

## Anomaly checks (current set)

All defined in `checkFileAnomalies` in `event-anomalies.mjs`. Each returns
an issue with `kind`, a Hebrew/English-mixed `summary`, and the offending
`events` array.

| Kind | Trigger | Why this threshold |
|---|---|---|
| `stale-data` | `scrapedAt > 48h` ago | Matches `scripts/lib/scraper-freshness.js`. Daily workflow runs ≈24h apart, so 48h tolerates one missed run before flagging. |
| `unknown-venue` | `venueCity === "לא ידוע"` | Touring fallback — venue resolver couldn't map the venue name to a city. Real bug, not edge case. |
| `suspect-hour` | event has `suspectHour: true` (set by runner when `rawText` contains `דקות` near the hour value) | Catches scrapers that grabbed a duration ("21:00 דקות") instead of a start time. |
| `past-date` | `event.date < today` (Israel local) | Shouldn't happen because the runner now filters these centrally. If it fires, a scraper is bypassing the runner's filter. |
| `bad-hour` | hour not `HH:MM` between `08:00–23:59` | `00:00` is the explicit fallback when extraction failed; flag it loudly. |
| `duplicate` | same `(showSlug, date, hour)` appears more than once | Runner now dedupes venue-source listings by `showId`, so this should be rare. If it fires, the scraper produced internal dupes. |
| `count-drop` | events count < 70% of yesterday's, with ≥ 5 events yesterday | Wipe protection in `sync-events.js` is at 30%. We flag earlier (at 70%) so anomalies surface before sync silently preserves stale data. |
| `llm-disagreement` | LLM returned `disagree` for an event in `llm-verifications.json` | Folded in by `event-anomalies.mjs` reading the verifier's output file. The reason from the model is attached per event. |

To add a new check: append a block to `checkFileAnomalies(events, prevEventCount, scrapedAt)`. The contract is `issues.push({ kind, summary, events })` — `events` can be `[]` if the issue is file-level (stale-data has no events). Email and admin page render new kinds without changes.

---

## LLM verifier — design notes

**Why batched per page, not per event.** Many events share a `sourceUrl`
(a show with 10 dates lives on one detail page). One fetch + one LLM call
covers all of them. Local data: 39 unique pages cover 147 events (~3.8x
reduction). This is what makes 100% coverage cheap enough to drop
sampling entirely.

**Why GitHub Models, not Anthropic API.** Free tier is generous enough
for ~250 calls/night. No new API key. The downside is rate limits — at
50 req/min and ~1000 req/day this fits well, but if it ever doesn't,
the `--max-pages` flag gives graceful degradation. Pages are sorted
**flagged-first** so the highest-risk pages always get verified first.

**Why Hebrew prompts.** Source pages are Hebrew; the model performs
better on the same-language comparison and the reason it returns is
already user-facing for the admin page.

**Why `temperature: 0` and JSON response format.** Determinism +
machine-parseable. The wrapper falls back to `{ verdict: "uncertain",
reason: "model returned malformed JSON" }` if parsing fails, so a flaky
model doesn't crash the run.

**Output schema (`prisma/data/llm-verifications.json`):**
```json
{
  "checkedAt": "ISO8601",
  "summary": { "pagesVerified": N, "agree": N, "disagree": N, "uncertain": N, ... },
  "results": [
    {
      "theatre": "Habima Theatre",
      "file": "events-habima-theatre.json",
      "wasFlagged": true|false,
      "event": { "showSlug": ..., "date": ..., "hour": ..., "sourceUrl": ..., ... },
      "verdict": "agree" | "disagree" | "uncertain",
      "reason": "Hebrew explanation"
    }
  ]
}
```

`event-anomalies.mjs::readLlmDisagreements` reads this and folds
`disagree` results into the anomaly stream as `kind: "llm-disagreement"`.
`uncertain` results are NOT surfaced — too noisy. If you ever want a
"low-confidence" badge in the UI, that's where the data lives.

---

## Local development

### Test the LLM verifier without a full nightly

```sh
# Need GITHUB_TOKEN in .env.local
node scripts/verify-flagged-events.mjs --max-pages=5 --dry-run
```

`--dry-run` skips writing the verifications file. Drop it to actually
write. Cap `--max-pages` while iterating on the prompt.

### Inspect anomalies without sending email

```sh
node --input-type=module -e "
  import { readReport } from './src/lib/event-anomalies.mjs';
  import { THEATRES } from './scripts/lib/theatres-config.mjs';
  import { join } from 'path';
  const r = readReport({ dataDir: join(process.cwd(), 'prisma', 'data'), theatres: THEATRES });
  for (const a of r.anomalies) {
    console.log(a.label + ':');
    for (const i of a.issues) console.log('  [' + i.kind + '] ' + i.summary);
  }
"
```

### View the admin page locally

```sh
npm run dev
# Visit http://localhost:3000/admin/flagged
# Sign in as helizakay1@gmail.com
```

To temporarily bypass auth while iterating on the layout, comment out
the `requireAuth` + `notFound()` block at the top of
`src/app/admin/flagged/page.tsx`. Restore before committing.

### Trigger an anomaly to test the UI

```sh
# Inject a fake past-dated + bad-hour event
node --input-type=module -e "
  import { readFileSync, writeFileSync } from 'fs';
  const p = 'prisma/data/events-habima-theatre.json';
  const d = JSON.parse(readFileSync(p,'utf-8'));
  d.events.unshift({ ...d.events[0], date: '2024-01-15', hour: '03:00' });
  writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
"
# … verify rendering …
git checkout -- prisma/data/events-habima-theatre.json
```

---

## What this system does NOT catch

Important to know before promoting events publicly. The system is
trustworthy but not exhaustive.

- **Wrong show bound to right slot.** Scraper extracts Title A's date for
  Title B due to a layout mismatch. Will only be caught if the LLM verifier
  sees the title doesn't match the page — works for events with `sourceUrl`,
  silent otherwise.
- **Right show, wrong date** with no source-page mismatch — i.e. the scraper
  read the wrong page entirely and extracted correctly from it. Rare.
- **Show-level real-world drift.** Theatre cancels a show but doesn't take
  the page down. Source page still says the show is on; LLM verifier
  agrees with the JSON; everything looks fine. Only user reports catch this.
- **Stale data masquerading as fresh** when wipe-protection (`sync-events.js`)
  preserves yesterday's events on a broken scrape. `scrapedAt` updates, the
  count looks normal. The 70%-drop check helps but doesn't fully cover this.
- **Events without `sourceUrl`.** Until a scraper re-runs with the new
  runner code, its events won't carry `sourceUrl` and the LLM verifier
  skips them. After every scraper has run once with the new runner,
  coverage is full.

The only piece of infrastructure that closes the real-world-drift gap
is user error reports (Phase 4 in the original plan, deferred —
product work, not validation work).

---

## Operational reference

- **Email recipient:** `helizakay1@gmail.com` (hardcoded in
  `scripts/send-events-report.mjs`)
- **Admin page email match:** `helizakay1@gmail.com` (hardcoded in
  `src/app/admin/flagged/page.tsx`)
- **Resend sender:** `onboarding@resend.dev` (sandboxed; switch to a
  verified domain if you ever want this to look professional)
- **Required secrets in GitHub Actions:** `RESEND_API_KEY` (email),
  `GITHUB_TOKEN` (LLM via GitHub Models, auto-provided by Actions),
  `DATABASE_URL` (scraping)
- **Nightly schedule:** `0 3 * * *` in `.github/workflows/refresh-events.yml`
  — 03:00 UTC = 06:00 Israel local

---

## Decision log (the why behind the choices)

These aren't obvious from the code; preserving rationale here.

- **Email + admin page share `event-anomalies.mjs`** rather than
  duplicating logic. They're not mirrors — email is a daily summary
  push, admin page is on-demand drill-down with clickable source links.
  Both views will always agree on what's flagged because they read the
  same module.
- **`sourceUrl` defaults to the show's detail page**, not the ticket
  page. The detail page is where the scraper read the data; the ticket
  page is the user action. Both are stored when available; verifier
  uses `sourceUrl`.
- **`ON CONFLICT DO UPDATE` with `COALESCE`** in `sync-events.js` lets
  scrapers populate URLs on existing rows without wiping URLs that other
  scrapers already populated. Important when one event is captured by
  multiple scrapers (a touring show via the theatre + via the venue).
- **Cancelled-event filter (`נדחה`/`בוטל`) is in the runner, not the
  anomaly check.** Anomaly checks are descriptive (catch + report);
  cancelled-event drop is corrective (the data shouldn't be there at
  all). Different layer.
- **Sampling concept removed** in favor of full coverage via batching.
  Batching by `sourceUrl` makes 100% coverage cheaper than the old
  sampled approach, so sampling is strictly worse.
