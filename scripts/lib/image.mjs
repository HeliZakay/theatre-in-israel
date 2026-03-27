/**
 * Image utilities — file existence check, download + WebP conversion,
 * and Puppeteer-based image extraction strategies.
 */

import sharp from "sharp";
import { writeFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateSlug } from "./slug.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

/**
 * Check whether a file exists.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive a Referer header from a URL's domain.
 * @param {string} url
 * @returns {string}
 */
function deriveReferer(url) {
  try {
    const { origin } = new URL(url);
    return `${origin}/`;
  } catch {
    return "";
  }
}

/**
 * Download an image, convert to .webp, and save to public/.
 * Never overwrites existing images.
 *
 * @param {string} title — show title (used to derive slug filename)
 * @param {string} url — image source URL
 * @param {{ verbose?: boolean }} [options]
 * @returns {Promise<"success" | "skipped" | "failed">}
 */
export async function downloadAndConvert(title, url, { verbose = false } = {}) {
  const slug = generateSlug(title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  if (await fileExists(outPath)) {
    if (verbose)
      console.log(`   ⏭️  ${title} → ${slug}.webp already exists, skipping`);
    return "skipped";
  }

  if (verbose) console.log(`⏳ ${title} → ${slug}.webp`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: deriveReferer(url),
      },
    });

    if (!res.ok) {
      if (verbose) console.error(`   ❌ HTTP ${res.status} for ${url}`);
      return "failed";
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    await writeFile(outPath, webpBuffer);

    if (verbose)
      console.log(`   ✅ Saved (${(webpBuffer.length / 1024).toFixed(0)} KB)`);
    return "success";
  } catch (err) {
    if (verbose) console.error(`   ❌ Error: ${err.message}`);
    return "failed";
  }
}

/**
 * Puppeteer page.evaluate function — extracts the best poster image URL
 * from a show page using multiple strategies.
 *
 * Runs inside the browser context so it must be self-contained.
 * @returns {string | null}
 */
export function extractImageFromPage() {
  // Strategy 1: og:image meta tag
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const content = ogImage.getAttribute("content");
    if (content) return content;
  }

  // Strategy 2: twitter:image meta tag
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    const content = twitterImage.getAttribute("content");
    if (content) return content;
  }

  const imgs = Array.from(document.querySelectorAll("img"));

  // Strategy 3: CDN / prdPics images
  for (const img of imgs) {
    const src = img.src || img.dataset?.src || "";
    if (
      src.includes("logo") ||
      src.includes("icon") ||
      src.includes("facebook") ||
      src.includes("instagram")
    )
      continue;
    if (src.includes("cdn77.org")) return src;
    if (src.includes("prdPics")) return src;
  }

  // Strategy 4: First large visible image
  for (const img of imgs) {
    const src = img.src || img.dataset?.src || "";
    if (!src || src.includes("logo") || src.includes("icon")) continue;
    const rect = img.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 100) return src;
  }

  // Strategy 5: Background image in hero/banner section
  const heroSelectors = [
    ".hero",
    ".show-hero",
    ".banner",
    ".header-image",
    '[class*="hero"]',
    '[class*="banner"]',
  ];
  for (const selector of heroSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const bg = getComputedStyle(el).backgroundImage;
      const match = bg.match(/url\(["']?(.*?)["']?\)/);
      if (match) return match[1];
    }
  }

  return null;
}

/**
 * Fix double-protocol URLs (e.g. og:image resolved to
 * "https://www.cameri.co.il/https://cdn.cameri.co.il/image.jpg").
 *
 * @param {string | null} url
 * @returns {string | null}
 */
export function fixDoubleProtocol(url) {
  if (!url) return url;
  const idx = url.indexOf("https://", 8);
  return idx > 0 ? url.substring(idx) : url;
}

/**
 * Use Puppeteer to visit a page and extract the best poster image,
 * then download and convert it.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} title
 * @param {string} pageUrl
 * @param {{ verbose?: boolean }} [options]
 * @returns {Promise<"success" | "skipped" | "failed">}
 */
export async function extractAndDownloadImage(
  browser,
  title,
  pageUrl,
  { verbose = false } = {},
) {
  const slug = generateSlug(title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  if (await fileExists(outPath)) {
    if (verbose)
      console.log(`   ⏭️  ${title} → ${slug}.webp already exists, skipping`);
    return "skipped";
  }

  if (verbose) console.log(`🔍 ${title} → visiting ${pageUrl}`);

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });

    let imageUrl = await page.evaluate(extractImageFromPage);
    await page.close();

    if (!imageUrl) {
      if (verbose) console.error(`   ❌ No image found on page for ${title}`);
      return "failed";
    }

    imageUrl = fixDoubleProtocol(imageUrl);
    if (verbose)
      console.log(`   📸 Found image: ${imageUrl.substring(0, 80)}...`);

    return await downloadAndConvert(title, imageUrl, { verbose });
  } catch (err) {
    if (verbose)
      console.error(`   ❌ Puppeteer error for ${title}: ${err.message}`);
    return "failed";
  }
}
