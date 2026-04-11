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

function readReport() {
  const rows = [];
  let totalEvents = 0;
  let totalShows = 0;
  let totalNew = 0;
  let totalRemoved = 0;

  for (const { file, label } of FILES) {
    const relPath = `prisma/data/${file}`;
    try {
      const raw = readFileSync(join(DATA_DIR, file), "utf-8");
      const current = parseEvents(raw);
      const shows = new Set(current.events.map((e) => e.showId)).size;

      // Compare with previous version
      let added = [];
      let removed = [];
      const prevRaw = readPreviousFile(relPath);
      if (prevRaw) {
        const prev = parseEvents(prevRaw);
        added = current.events.filter((e) => !prev.map.has(eventKey(e)));
        removed = prev.events.filter((e) => !current.map.has(eventKey(e)));
      }

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
    }
  }

  return { rows, totalEvents, totalShows, totalNew, totalRemoved };
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

function buildHtml({ rows, totalEvents, totalShows, totalNew, totalRemoved }) {
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

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to: RECIPIENT,
    subject: `דו״ח אירועים יומי — ${report.totalEvents} אירועים${report.totalNew ? ` (+${report.totalNew} חדשים)` : ""}`,
    html,
  });

  if (error) {
    console.error("[report] Failed to send:", error);
    process.exit(1);
  }

  console.log(
    `[report] Email sent — ${report.totalEvents} events, +${report.totalNew}/-${report.totalRemoved} vs yesterday`
  );
}

main();
