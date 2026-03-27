import { join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { checkFreshness } = require("./lib/scraper-freshness.js");

const dataDir = join(import.meta.dirname, "..", "prisma", "data");
const { total, stale } = checkFreshness(dataDir);

if (stale.length === 0) {
  console.log(`[freshness] All ${total} scraper files are fresh (< 48h)`);
  process.exit(0);
}

console.error(`[freshness] ${stale.length}/${total} scraper files are STALE:`);
for (const { file, reason } of stale) {
  console.error(`  - ${file}: ${reason}`);
}
process.exit(1);
