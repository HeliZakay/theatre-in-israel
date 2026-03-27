import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const FRESH_DATE = "2026-03-27T01:00:00.000Z";
const STALE_DATE = "2026-03-24T01:00:00.000Z";
const NOW = new Date("2026-03-27T10:00:00.000Z");

const { checkFreshness } = require("../../../scripts/lib/scraper-freshness.js");

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "freshness-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeJson(name: string, content: string) {
  writeFileSync(join(tmpDir, name), content);
}

test("all fresh files returns no stale", () => {
  writeJson("events.json", JSON.stringify({ scrapedAt: FRESH_DATE, events: [] }));
  writeJson("events-gesher.json", JSON.stringify({ scrapedAt: FRESH_DATE, events: [] }));

  const result = checkFreshness(tmpDir, NOW);
  expect(result.total).toBe(2);
  expect(result.stale).toHaveLength(0);
});

test("stale file is detected", () => {
  writeJson("events.json", JSON.stringify({ scrapedAt: FRESH_DATE, events: [] }));
  writeJson("events-gesher.json", JSON.stringify({ scrapedAt: STALE_DATE, events: [] }));

  const result = checkFreshness(tmpDir, NOW);
  expect(result.total).toBe(2);
  expect(result.stale).toHaveLength(1);
  expect(result.stale[0].file).toBe("events-gesher.json");
  expect(result.stale[0].reason).toContain("ago");
});

test("missing scrapedAt is flagged", () => {
  writeJson("events.json", JSON.stringify({ events: [] }));

  const result = checkFreshness(tmpDir, NOW);
  expect(result.stale).toHaveLength(1);
  expect(result.stale[0].reason).toContain("missing");
});

test("unparseable file is flagged", () => {
  writeJson("events.json", "not json");

  const result = checkFreshness(tmpDir, NOW);
  expect(result.stale).toHaveLength(1);
  expect(result.stale[0].reason).toContain("failed");
});

test("non-events files are ignored", () => {
  writeJson("events.json", JSON.stringify({ scrapedAt: FRESH_DATE, events: [] }));
  writeJson("other.json", "whatever");

  const result = checkFreshness(tmpDir, NOW);
  expect(result.total).toBe(1);
  expect(result.stale).toHaveLength(0);
});
