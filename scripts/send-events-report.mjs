import { readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { Resend } from "resend";
import { THEATRES } from "./lib/theatres-config.mjs";

const DATA_DIR = join(import.meta.dirname, "..", "prisma", "data");

const FILES = THEATRES.map((t) => ({ file: t.jsonFile, label: t.label }));

const RECIPIENT = "helizakay1@gmail.com";
const FROM = "תיאטרון בישראל <onboarding@resend.dev>";

/** Key that uniquely identifies an event */
function eventKey(e) {
  return `${e.showId}|${e.date}|${e.hour}`;
}

function parseEvents(raw) {
  const data = JSON.parse(raw);
  const events = data.events ?? [];
  return { events, map: new Map(events.map((e) => [eventKey(e), e])) };
}

function readPreviousFile(filePath) {
  try {
    return execSync(`git show HEAD~1:${filePath}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

// ── Sanity checks (run on the current JSON snapshot, no DB) ─────────────────

const COUNT_DROP_THRESHOLD = 0.3; // file dropped >30% vs yesterday → flag

function todayInJerusalem() {
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

function checkFileAnomalies(label, events, prevEventCount) {
  const today = todayInJerusalem();
  const issues = [];

  const past = events.filter((e) => e.date && e.date < today);
  if (past.length) issues.push(`${past.length} past-dated event(s)`);

  const badHours = events.filter((e) => !isValidHour(e.hour));
  if (badHours.length) {
    const zeros = badHours.filter((e) => e.hour === "00:00").length;
    const detail = zeros
      ? `${badHours.length} bad hour(s) — ${zeros} are 00:00 (likely extraction failure)`
      : `${badHours.length} bad hour(s)`;
    issues.push(detail);
  }

  const seen = new Map();
  let dupes = 0;
  for (const e of events) {
    const k = `${e.showSlug ?? e.showId}|${e.date}|${e.hour}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  for (const c of seen.values()) if (c > 1) dupes += c - 1;
  if (dupes) issues.push(`${dupes} duplicate event row(s)`);

  if (
    prevEventCount != null &&
    prevEventCount >= 5 &&
    events.length < prevEventCount * (1 - COUNT_DROP_THRESHOLD)
  ) {
    const pct = Math.round(
      ((prevEventCount - events.length) / prevEventCount) * 100,
    );
    issues.push(
      `event count dropped ${pct}% (${prevEventCount} → ${events.length}) — possible scraper failure`,
    );
  }

  return issues.length ? { label, issues } : null;
}

// Cross-reference: events that appear in ≥2 different source files are a
// positive confidence signal (e.g. a touring show scraped both by the theatre
// company and by the venue's site).
function buildCrossRef(allFileEvents) {
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

export function readReport() {
  const rows = [];
  let totalEvents = 0;
  let totalShows = 0;
  let totalNew = 0;
  let totalRemoved = 0;
  const anomalies = [];
  const allFileEvents = [];

  for (const { file, label } of FILES) {
    const relPath = `prisma/data/${file}`;
    try {
      const raw = readFileSync(join(DATA_DIR, file), "utf-8");
      const current = parseEvents(raw);
      const shows = new Set(current.events.map((e) => e.showId)).size;

      // Compare with previous version
      let added = [];
      let removed = [];
      let prevEventCount = null;
      const prevRaw = readPreviousFile(relPath);
      if (prevRaw) {
        const prev = parseEvents(prevRaw);
        added = current.events.filter((e) => !prev.map.has(eventKey(e)));
        removed = prev.events.filter((e) => !current.map.has(eventKey(e)));
        prevEventCount = prev.events.length;
      }

      const anomaly = checkFileAnomalies(label, current.events, prevEventCount);
      if (anomaly) anomalies.push(anomaly);
      allFileEvents.push({ file, events: current.events });

      rows.push({
        label,
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
        events: 0,
        shows: 0,
        added: [],
        removed: [],
        ok: false,
      });
      anomalies.push({ label, issues: ["file unreadable"] });
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

function showName(slug) {
  return slug.replace(/-/g, " ");
}

function buildDiffHtml(added, removed) {
  if (!added.length && !removed.length) return "";

  const lines = [];

  if (added.length) {
    // Group by show
    const byShow = new Map();
    for (const e of added) {
      const name = showName(e.showSlug ?? `show-${e.showId}`);
      if (!byShow.has(name)) byShow.set(name, []);
      byShow.get(name).push(`${e.date} ${e.hour}`);
    }
    for (const [name, dates] of byShow) {
      lines.push(
        `<span style="color: #16a34a;">+ ${name}: ${dates.join(", ")}</span>`
      );
    }
  }

  if (removed.length) {
    const byShow = new Map();
    for (const e of removed) {
      const name = showName(e.showSlug ?? `show-${e.showId}`);
      if (!byShow.has(name)) byShow.set(name, []);
      byShow.get(name).push(`${e.date} ${e.hour}`);
    }
    for (const [name, dates] of byShow) {
      lines.push(
        `<span style="color: #dc2626;">− ${name}: ${dates.join(", ")}</span>`
      );
    }
  }

  return `<div style="font-size: 0.85em; margin: 2px 0 8px 16px;">${lines.join("<br>")}</div>`;
}

function buildAnomaliesHtml(anomalies) {
  if (!anomalies.length) return "";
  const items = anomalies
    .map(
      ({ label, issues }) =>
        `<li><strong>${label}:</strong> ${issues.join("; ")}</li>`,
    )
    .join("\n");
  return `
    <div style="margin-top: 24px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
      <h3 style="margin: 0 0 8px; color: #b91c1c;">⚠️ אנומליות (${anomalies.length})</h3>
      <ul style="margin: 0; padding-right: 20px; color: #7f1d1d;">${items}</ul>
    </div>
  `;
}

function buildCrossRefHtml({ confirmed, totalFuture }) {
  if (totalFuture === 0) return "";
  const pct = Math.round((confirmed / totalFuture) * 100);
  return `
    <p style="margin-top: 16px; color: #6b7280; font-size: 0.9em;">
      צולב בין מקורות: ${confirmed}/${totalFuture} אירועים עתידיים (${pct}%) מאומתים ב-2+ מקורות שונים
    </p>
  `;
}

function buildHtml({ rows, totalEvents, totalShows, totalNew, totalRemoved, anomalies, crossRef }) {
  const date = new Date().toLocaleDateString("he-IL", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasDiff = totalNew > 0 || totalRemoved > 0;
  const diffSummary = hasDiff
    ? ` (${totalNew ? `+${totalNew}` : ""}${totalNew && totalRemoved ? " / " : ""}${totalRemoved ? `−${totalRemoved}` : ""} מאתמול)`
    : "";

  const tableRows = rows
    .map(({ label, events, shows, added, removed, ok }) => {
      const style = !ok
        ? 'style="color: #dc2626; font-weight: bold;"'
        : events === 0
          ? 'style="color: #d97706;"'
          : "";
      const eventsCell = !ok ? "שגיאה" : events;
      const diffBadge =
        added.length || removed.length
          ? ` <span style="font-size: 0.8em; color: #6b7280;">(${added.length ? `+${added.length}` : ""}${added.length && removed.length ? "/" : ""}${removed.length ? `−${removed.length}` : ""})</span>`
          : "";
      const diffDetail = buildDiffHtml(added, removed);

      return `<tr ${style}>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">${label}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: center;">${shows}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: center;">${eventsCell}${diffBadge}</td>
      </tr>${diffDetail ? `<tr><td colspan="3" style="padding: 0 12px 6px; border-bottom: 1px solid #eee;">${diffDetail}</td></tr>` : ""}`;
    })
    .join("\n");

  return `
    <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; max-width: 600px;">
      <h2>דו״ח אירועים יומי — ${date}</h2>
      <p style="color: #6b7280;">סה״כ ${totalEvents} אירועים, ${totalShows} הצגות${diffSummary}</p>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px 12px; text-align: right;">תיאטרון</th>
            <th style="padding: 8px 12px; text-align: center;">הצגות</th>
            <th style="padding: 8px 12px; text-align: center;">אירועים</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f3f4f6;">
            <td style="padding: 8px 12px;">סה״כ</td>
            <td style="padding: 8px 12px; text-align: center;">${totalShows}</td>
            <td style="padding: 8px 12px; text-align: center;">${totalEvents}</td>
          </tr>
        </tfoot>
      </table>
      ${buildCrossRefHtml(crossRef)}
      ${buildAnomaliesHtml(anomalies)}
    </div>
  `;
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[report] RESEND_API_KEY not set, skipping email");
    return;
  }

  const report = readReport();
  const html = buildHtml(report);

  const anomalyTag = report.anomalies.length
    ? ` ⚠️ ${report.anomalies.length}`
    : "";
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to: RECIPIENT,
    subject: `דו״ח אירועים יומי — ${report.totalEvents} אירועים${report.totalNew ? ` (+${report.totalNew} חדשים)` : ""}${anomalyTag}`,
    html,
  });

  if (error) {
    console.error("[report] Failed to send:", error);
    process.exit(1);
  }

  console.log(
    `[report] Email sent — ${report.totalEvents} events, +${report.totalNew}/-${report.totalRemoved} vs yesterday, ${report.anomalies.length} anomalies, cross-ref ${report.crossRef.confirmed}/${report.crossRef.totalFuture}`
  );
}

main();
