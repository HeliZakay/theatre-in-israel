import { join } from "path";
import { Resend } from "resend";
import { THEATRES } from "./lib/theatres-config.mjs";
import { readReport } from "../src/lib/event-anomalies.mjs";

const DATA_DIR = join(import.meta.dirname, "..", "prisma", "data");

const RECIPIENT = "helizakay1@gmail.com";
const FROM = "תיאטרון בישראל <onboarding@resend.dev>";

function showName(slug) {
  return slug.replace(/-/g, " ");
}

function buildDiffHtml(added, removed) {
  if (!added.length && !removed.length) return "";

  const lines = [];

  if (added.length) {
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
        `<li><strong>${label}:</strong> ${issues.map((i) => i.summary).join("; ")}</li>`,
    )
    .join("\n");
  return `
    <div style="margin-top: 24px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
      <h3 style="margin: 0 0 8px; color: #b91c1c;">⚠️ אנומליות (${anomalies.length})</h3>
      <ul style="margin: 0; padding-right: 20px; color: #7f1d1d;">${items}</ul>
    </div>
  `;
}

function buildLlmStatusHtml(summary) {
  if (!summary) return "";
  const agree = Number(summary.agree) || 0;
  const disagree = Number(summary.disagree) || 0;
  const uncertain = Number(summary.uncertain) || 0;
  const total = agree + disagree + uncertain;
  if (total === 0) return "";
  const broken = agree + disagree === 0 && uncertain > 10;
  const pct = (n) => Math.round((n / total) * 100);
  const color = broken ? "#b91c1c" : "#15803d";
  const icon = broken ? "⚠️" : "✓";
  const label = broken
    ? `LLM verifier produced 0 valid verdicts across ${uncertain} events — check workflow logs`
    : `LLM verified ${total} events on ${summary.pagesVerified ?? "?"} pages (${pct(agree)}% agree, ${pct(disagree)}% disagree, ${pct(uncertain)}% uncertain)`;
  return `
    <p style="margin-top: 8px; color: ${color}; font-size: 0.9em;">
      ${icon} ${label}
    </p>
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

function buildHtml({ rows, totalEvents, totalShows, totalNew, totalRemoved, anomalies, crossRef, llmSummary }) {
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
      ${buildLlmStatusHtml(llmSummary)}
      ${buildAnomaliesHtml(anomalies)}
    </div>
  `;
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[report] RESEND_API_KEY not set, skipping email");
    return;
  }

  const report = readReport({ dataDir: DATA_DIR, theatres: THEATRES });
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
