const { readFileSync, readdirSync } = require("fs");
const { join } = require("path");

const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

function checkFreshness(dataDir, now = new Date()) {
  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith("events") && f.endsWith(".json")
  );
  const stale = [];

  for (const file of files) {
    try {
      const raw = readFileSync(join(dataDir, file), "utf-8");
      const data = JSON.parse(raw);
      const scrapedAt = data.scrapedAt ? new Date(data.scrapedAt) : null;

      if (!scrapedAt || isNaN(scrapedAt.getTime())) {
        stale.push({ file, reason: "missing or invalid scrapedAt" });
        continue;
      }

      const ageMs = now - scrapedAt;
      if (ageMs > STALE_THRESHOLD_MS) {
        const ageHours = Math.round(ageMs / (60 * 60 * 1000));
        stale.push({
          file,
          reason: `last scraped ${ageHours}h ago (${data.scrapedAt})`,
        });
      }
    } catch {
      stale.push({ file, reason: "failed to read or parse" });
    }
  }

  return { total: files.length, stale };
}

module.exports = { checkFreshness };
