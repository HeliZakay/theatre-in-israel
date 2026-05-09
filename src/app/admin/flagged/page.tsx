import { notFound } from "next/navigation";
import { join } from "path";
import { requireAuth } from "@/lib/auth";
import { readReport } from "@/lib/event-anomalies.mjs";
import { THEATRES } from "../../../../scripts/lib/theatres-config.mjs";
import styles from "./page.module.css";

const ADMIN_EMAIL = "helizakay1@gmail.com";

type AnomalyEvent = {
  showSlug?: string;
  showId?: number;
  date?: string;
  hour?: string;
  sourceUrl?: string;
  ticketUrl?: string;
  venueName?: string;
  venueCity?: string;
};

type Issue = {
  kind: string;
  summary: string;
  events: AnomalyEvent[];
};

type FileAnomaly = {
  label: string;
  file: string;
  issues: Issue[];
};

type Report = {
  totalEvents: number;
  totalShows: number;
  anomalies: FileAnomaly[];
  crossRef: { confirmed: number; totalFuture: number };
  rows: { label: string; events: number; ok: boolean }[];
};

export const dynamic = "force-dynamic";

export default async function FlaggedEventsPage() {
  const session = await requireAuth("/admin/flagged");
  if (session.user.email !== ADMIN_EMAIL) {
    notFound();
  }

  const dataDir = join(process.cwd(), "prisma", "data");
  const report = readReport({ dataDir, theatres: THEATRES }) as Report;

  const { totalEvents, totalShows, anomalies, crossRef } = report;
  const crossRefPct =
    crossRef.totalFuture > 0
      ? Math.round((crossRef.confirmed / crossRef.totalFuture) * 100)
      : 0;

  return (
    <main className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1>אירועים מסומנים</h1>
        <p className={styles.summary}>
          סה״כ {totalEvents} אירועים, {totalShows} הצגות.{" "}
          <span className={styles.muted}>
            צולב בין מקורות: {crossRef.confirmed}/{crossRef.totalFuture} (
            {crossRefPct}%)
          </span>
        </p>
      </header>

      {anomalies.length === 0 ? (
        <div className={styles.empty}>
          <p>✓ אין אנומליות. כל הסקרייפרים מחזירים נתונים תקינים.</p>
        </div>
      ) : (
        <section className={styles.anomalies}>
          <h2>{anomalies.length} קבצים עם בעיות</h2>
          {anomalies.map(({ label, file, issues }) => (
            <article key={file} className={styles.file}>
              <h3>
                {label}{" "}
                <span className={styles.fileName}>({file})</span>
              </h3>
              {issues.map((issue, i) => (
                <div key={i} className={styles.issue}>
                  <div className={styles.issueSummary}>
                    <span className={styles.kind}>{issue.kind}</span>{" "}
                    {issue.summary}
                  </div>
                  {issue.events.length > 0 && (
                    <ul className={styles.eventList}>
                      {issue.events.slice(0, 20).map((e, j) => (
                        <li key={j} className={styles.eventRow}>
                          <span className={styles.eventMeta}>
                            {e.showSlug ?? `show-${e.showId}`}
                          </span>
                          <span className={styles.eventMeta}>
                            {e.date} {e.hour}
                          </span>
                          {e.venueName && (
                            <span className={styles.eventMeta}>
                              @ {e.venueName}
                            </span>
                          )}
                          {e.sourceUrl && (
                            <a
                              href={e.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.link}
                            >
                              מקור ↗
                            </a>
                          )}
                          {e.ticketUrl && (
                            <a
                              href={e.ticketUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.link}
                            >
                              כרטיסים ↗
                            </a>
                          )}
                        </li>
                      ))}
                      {issue.events.length > 20 && (
                        <li className={styles.muted}>
                          ועוד {issue.events.length - 20} אירועים…
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
