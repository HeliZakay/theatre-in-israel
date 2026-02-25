#!/usr/bin/env node
/**
 * get-cameri-show.mjs
 *
 * Scrapes a single Cameri Theatre show page and extracts
 * the title, duration and description.
 *
 * Usage:
 *   node scripts/get-cameri-show.mjs <show-url>
 *   node scripts/get-cameri-show.mjs <show-url> --json
 *
 * Example:
 *   node scripts/get-cameri-show.mjs "https://www.cameri.co.il/הצגות_הקאמרי/show_11345/מחווה_לנעמי_שמר"
 */

import puppeteer from "puppeteer";

const CAMERI_THEATRE = "תיאטרון הקאמרי";

function printUsage() {
  console.error(
    `Usage: node scripts/get-cameri-show.mjs <cameri-show-url> [--json]\n` +
      `\nExample:\n` +
      `  node scripts/get-cameri-show.mjs "https://www.cameri.co.il/הצגות_הקאמרי/show_11345/מחווה_לנעמי_שמר"`,
  );
}

async function scrapeShow(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Block images / fonts / css to speed things up
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });

  // Wait for the main heading to appear
  await page.waitForSelector("h1", { timeout: 15_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Strip leading "חדש" badge the site sometimes prepends
    title = title.replace(/^חדש\s+/, "");

    // ── Duration ──
    // Look for "משך ההצגה: XX דקות" anywhere in the page text
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    // The description sits between the "על ההצגה" label and the
    // duration / crew section. We grab all the text content from that zone.
    let description = "";

    // Strategy: find the element or text node containing "על ההצגה",
    // then collect subsequent paragraph-level text until we hit a known
    // boundary like "צוות ושחקנים" or "משך ההצגה" or "צילום".
    const aboutMarker = "על ההצגה";
    const stopMarkers = ["צוות ושחקנים", "משך ההצגה", "גלריית תמונות"];

    // The page content area usually has the description as free text
    // after the "על ההצגה" heading. Let's extract it from body text.
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) {
          endIdx = idx;
        }
      }

      description = rest
        .slice(0, endIdx)
        .trim()
        // Collapse multiple newlines into double newlines (paragraph breaks)
        .replace(/\n{3,}/g, "\n\n")
        // Remove lines that are just "*צילום:" credits
        .replace(/\*צילום:.*$/gm, "")
        // Remove lines that start with "*" (usually disclaimers/notes)
        .replace(/^\*[^\n]*$/gm, "")
        // Remove "תכניה" links
        .replace(/תכניה/g, "")
        // Final cleanup
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    return { title, durationMinutes, description };
  });

  await browser.close();
  return data;
}

// ── main ────────────────────────────────────────────────────────
const jsonMode = process.argv.includes("--json");

// Find the URL argument (first arg that isn't a flag)
const showUrl = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (!showUrl) {
  printUsage();
  process.exit(1);
}

// Basic validation
if (!showUrl.includes("cameri.co.il") || !showUrl.includes("/show_")) {
  console.error(
    "❌  URL does not look like a Cameri show page (expected cameri.co.il URL with /show_).",
  );
  printUsage();
  process.exit(1);
}

try {
  const show = await scrapeShow(showUrl);

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          title: show.title,
          theatre: CAMERI_THEATRE,
          durationMinutes: show.durationMinutes,
          description: show.description,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`\n🎭  ${show.title}\n`);
    console.log(`   תיאטרון: ${CAMERI_THEATRE}`);
    console.log(
      `   משך:     ${show.durationMinutes ? `${show.durationMinutes} דקות` : "לא צוין"}`,
    );
    console.log(`\n   תיאור:\n`);

    // Indent description lines for readability
    const lines = show.description.split("\n");
    for (const line of lines) {
      console.log(`   ${line}`);
    }
    console.log();
  }
} catch (err) {
  console.error("❌  Failed to scrape show page:", err.message);
  process.exit(1);
}
