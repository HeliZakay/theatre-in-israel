import sharp from "sharp";
import { writeFile, access } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Slug logic matching src/utils/getShowImagePath.ts
function titleToSlug(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ─── Shows with known image URLs ────────────────────────────────────────────

const SHOWS_WITH_URLS = [
  // ── תיאטרון החאן (Khan Theatre) ──
  {
    title: "יעקובי ולידנטל",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/567_205569_event_gallery_1.jpg",
  },
  {
    title: "נער האופניים",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/406_931234_event_gallery_1.jpg",
  },
  {
    title: "הסבתות",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/264_511322_event_gallery_1.jpg",
  },
  {
    title: "מחכים לגודו",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/568_647872_event_gallery_1.jpg",
  },
  {
    title: "הכי בבית בעולם",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/608_660065_event_gallery_1.jpg",
  },
  {
    title: "אם זה אדם",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/173_559526_event_gallery_1.jpg",
  },
  {
    title: "דרייפוס",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/462_155345_event_gallery_1.jpg",
  },
  {
    title: "הורים יקרים",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/527_126552_event_gallery_1.jpg",
  },
  {
    title: "משרתם של שני אדונים",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/544_204014_event_gallery_1.jpg",
  },
  {
    title: "מיתה טובה",
    url: "https://www.khan.co.il/prdPics/eventsClass/gallery/492_152748_event_gallery_1.jpg",
  },

  // ── צוותא (Tzavta) ──
  {
    title: "סביצ\u05F3ה",
    url: "https://www.tzavta.co.il/download/events/Event_Image_10f94676-0f66-487f-ae52-041b0c750b2a.jpg",
  },
  {
    title: "שושי בחלל",
    url: "https://www.tzavta.co.il/download/events/Event_Image_7adf94ef-0ccb-4321-931d-5026625e1aa1.jpg",
  },
  {
    title: "אנטי אייג\u05F3ינג",
    url: "https://www.tzavta.co.il/download/events/Event_Image_c5f76282-4900-403b-a0ee-b92fc9817725.jpg",
  },
  {
    title: "משחקי נישואים",
    url: "https://www.tzavta.co.il/download/events/Event_Image_ff84885f-5711-4c89-91ae-74929d1bb75c.jpg",
  },

  // ── תיאטרון באר שבע (Beer Sheva Theatre) ──
  {
    title: "מקומות שמורים",
    url: "https://b7t.co.il/wp-content/uploads/2025/06/%D7%A2%D7%9E%D7%95%D7%93-%D7%94%D7%91%D7%99%D7%AA-%D7%98%D7%9E%D7%A4%D7%9C%D7%98-%D7%AA%D7%9E%D7%95%D7%A0%D7%95%D7%AA-3.png",
  },
  {
    title: "העלמה והמוות",
    url: "https://b7t.co.il/wp-content/uploads/2025/09/%D7%A2%D7%9E%D7%95%D7%93-%D7%94%D7%91%D7%99%D7%AA-%D7%98%D7%9E%D7%A4%D7%9C%D7%98-%D7%AA%D7%9E%D7%95%D7%A0%D7%95%D7%AA-4.png",
  },

  // ── תיאטרון חיפה (Haifa Theatre — ht1.co.il) ──
  {
    title: "שם פרטי",
    url: "https://www.ht1.co.il/download/events/Event_Image_f480e5cd-f14b-49a5-8092-40dd6bde5b26.jpg",
  },
  {
    title: 'חנה לסלאו היא ד"ר רות ווסטהיימר',
    url: "https://www.ht1.co.il/download/events/Event_Image_73a686e0-b752-476a-b77a-57243393327a.jpg",
  },
  {
    title: "המאסטר (אלוף הבונים שלי)",
    url: "https://www.ht1.co.il/download/events/Event_Image_8b57f194-5f2d-4692-8e71-e93d2891a46c.jpg",
  },
  {
    title: "לשחרר את נחמה",
    url: "https://www.ht1.co.il/download/events/Event_Image_eaaedf65-6373-42df-800a-2042e085424c.jpg",
  },
  {
    title: "משתגעים מאהבה",
    url: "https://www.ht1.co.il/download/events/Event_Image_741c7821-7895-4755-aafd-dff8167d943e.jpg",
  },
  {
    title: "לילסדה",
    url: "https://www.ht1.co.il/download/events/Event_Image_d7f8e6d0-f286-4e0f-8109-a304b7d21fe0.jpg",
  },
  {
    title: "הזוג המוזר",
    url: "https://www.ht1.co.il/download/events/Event_Image_6c4529c9-9e7c-4b35-bad7-9d22c80c0404.jpg",
  },
  {
    title: "היומן",
    url: "https://www.ht1.co.il/download/events/Event_Image_97fe4a38-c41e-498e-9f41-c085328074fb.jpg",
  },

  // ── תמונע (Tmuna Theatre — tmu-na.org.il) ──
  {
    title: "בת של אבא",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_BATTT.jpg",
  },
  {
    title: "רצח במועדון הטרנספר",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_MOADON(1).JPG",
  },
  {
    title: "פריקואל וסיקואל יורשים כת",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_JDJDJDJDC(1).jpg",
  },
  {
    title: "דיק פיק",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_1000087826.jpg",
  },
  {
    title: "בית בעזה",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_DANBENARIRASHIT.jpg",
  },
  {
    title: "אבא יצא מהקבוצה",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_abbakatan.jpg",
  },
  {
    title: "האוויר הוא של כולם",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_RBVVV(1).jpg",
  },
  {
    title: "השתקפויות",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_DFDDDDD.jpg",
  },
  {
    title: "אקספוז\u05F3ר",
    url: "https://www.tmu-na.org.il/_Uploads/dbsArticles/_cut/F0_1200_0630_EKSPIZERRASHI.jpg",
  },

  // ── התיאטרון העברי (Hebrew Theatre — teatron.org.il) ──
  {
    title: "גבירתי הנאווה",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/10/MFL-1140x400-1.jpg",
  },
  {
    title: "בגלל הרוח",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/08/1140X400.jpg",
  },
  {
    title: "עפרה",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/08/Ofra-1140x400-2.jpg",
  },
  {
    title: "התשמע קולי",
    url: "https://www.teatron.org.il/wp-content/uploads/2024/11/Tishma-1140x400-1.png",
  },
  {
    title: "אהבה בהפתעה",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/10/AB-1140x400-1.jpg",
  },
  {
    title: "הלב שלי בחר",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/07/myheart-1140x400-1.jpg",
  },
  {
    title: "אני פה בגלל אשתי",
    url: "https://www.teatron.org.il/wp-content/uploads/2022/12/HT_ANI_PO_BANNER.webp",
  },
  {
    title: "זוגיות AI",
    url: "https://www.teatron.org.il/wp-content/uploads/2026/01/ZAI-1140x400-1.jpg",
  },
  {
    title: "הברונית רוטשילד",
    url: "https://www.teatron.org.il/wp-content/uploads/2026/01/BAR-1140x400-2.jpg",
  },
  {
    title: "מראה מעל הגשר",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/01/AVFTB-1140x400-1.jpg",
  },
  {
    title: "צלילי המוסיקה",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/08/%D7%97%D7%92%D7%99%D7%92%D7%95%D7%AA-%D7%94-60-%D7%A9%D7%A0%D7%94-3.png",
  },
  {
    title: "השוטר אזולאי",
    url: "https://www.teatron.org.il/wp-content/uploads/2024/12/Hashoter-1140x400-2.jpg",
  },
  {
    title: "כנר על הגג \u2013 המחזמר",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/08/HT_FIDDLER_BANNER.webp",
  },
  {
    title: "שוקו וניל",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/08/HT_SHOKO_BANNER.webp",
  },
  {
    title: "הפרח בגני",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/08/HT_HAPERACH_BANNER-1.webp",
  },
  {
    title: "רוחל\u05F3ה מתחתנת",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/12/HT-ROCHALE-1140x400-1.jpg",
  },
  {
    title: "שיעור באהבה",
    url: "https://www.teatron.org.il/wp-content/uploads/2023/08/IMG_9549.png",
  },
  {
    title: "קברט ז\u05F3בוטינסקי",
    url: "https://www.teatron.org.il/wp-content/uploads/2025/02/%D7%A7%D7%91%D7%A8%D7%98-%D7%96%D7%91%D7%95%D7%98%D7%99%D7%A0%D7%A1%D7%A7%D7%99-1140-%D7%A2%D7%9C-400.png",
  },
];

// ─── Shows that need Puppeteer (no direct URL found) ────────────────────────

const SHOWS_NEEDING_PUPPETEER = [
  // Gesher Theatre
  {
    title: "נשמות",
    pageUrl:
      "https://www.gesher-theatre.co.il/he/repertoire/a/view/?ContentID=2839",
  },
  {
    title: "סלומה",
    pageUrl:
      "https://www.gesher-theatre.co.il/he/repertoire/a/view/?ContentID=2856",
  },
  {
    title: "החטא ועונשו",
    pageUrl:
      "https://www.gesher-theatre.co.il/he/repertoire/a/view/?ContentID=2822",
  },
  // Cameri
  {
    title: "השותפה",
    pageUrl:
      "https://www.cameri.co.il/%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%94%D7%A7%D7%90%D7%9E%D7%A8%D7%99/show_11355/%D7%94%D7%A9%D7%95%D7%AA%D7%A4%D7%94",
  },
];

// ─── Download and convert to webp ───────────────────────────────────────────

async function downloadAndConvert(title, url) {
  const slug = titleToSlug(title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  // NEVER overwrite existing images
  if (await fileExists(outPath)) {
    console.log(`   ⏭️  ${title} → ${slug}.webp already exists, skipping`);
    return "skipped";
  }

  console.log(`⏳ ${title} → ${slug}.webp`);

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Add referer for specific domains
    const domain = new URL(url).hostname;
    if (domain.includes("khan.co.il")) {
      headers["Referer"] = "https://www.khan.co.il/";
    } else if (domain.includes("tzavta.co.il")) {
      headers["Referer"] = "https://www.tzavta.co.il/";
    } else if (domain.includes("b7t.co.il")) {
      headers["Referer"] = "https://b7t.co.il/";
    } else if (domain.includes("ht1.co.il")) {
      headers["Referer"] = "https://www.ht1.co.il/";
    } else if (domain.includes("tmu-na.org.il")) {
      headers["Referer"] = "https://www.tmu-na.org.il/";
    } else if (domain.includes("teatron.org.il")) {
      headers["Referer"] = "https://www.teatron.org.il/";
    } else if (domain.includes("gesher-theatre.co.il")) {
      headers["Referer"] = "https://www.gesher-theatre.co.il/";
    } else if (domain.includes("cameri.co.il")) {
      headers["Referer"] = "https://www.cameri.co.il/";
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`   ❌ HTTP ${res.status} for ${url}`);
      return "failed";
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    await writeFile(outPath, webpBuffer);

    console.log(`   ✅ Saved (${(webpBuffer.length / 1024).toFixed(0)} KB)`);
    return "success";
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return "failed";
  }
}

// ─── Puppeteer-based image extraction ───────────────────────────────────────

async function extractImageWithPuppeteer(browser, title, pageUrl) {
  const slug = titleToSlug(title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  // NEVER overwrite existing images
  if (await fileExists(outPath)) {
    console.log(`   ⏭️  ${title} → ${slug}.webp already exists, skipping`);
    return "skipped";
  }

  console.log(`🔍 ${title} → visiting ${pageUrl}`);

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Try multiple strategies to find the main poster image
    let imageUrl = await page.evaluate(() => {
      // Strategy 1: og:image meta tag (use getAttribute to avoid URL resolution)
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

      // Strategy 3: First large img in main content
      // For Gesher: look for CDN images
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        // Skip tiny icons, logos, and social media images
        if (
          src.includes("logo") ||
          src.includes("icon") ||
          src.includes("facebook") ||
          src.includes("instagram")
        )
          continue;
        // Prefer CDN77 images (Gesher)
        if (src.includes("cdn77.org")) return src;
        // Prefer large images from prdPics (Cameri/Khan)
        if (src.includes("prdPics")) return src;
      }

      // Strategy 4: First large visible image
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (!src || src.includes("logo") || src.includes("icon")) continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 100) return src;
      }

      // Strategy 5: Background image in hero section
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
    });

    await page.close();

    if (!imageUrl) {
      console.error(`   ❌ No image found on page for ${title}`);
      return "failed";
    }

    // Fix double-protocol URLs (e.g. Gesher og:image resolved incorrectly)
    const doubleProtoIdx = imageUrl.indexOf("https://", 8);
    if (doubleProtoIdx > 0) {
      imageUrl = imageUrl.substring(doubleProtoIdx);
    }

    console.log(`   📸 Found image: ${imageUrl.substring(0, 80)}...`);

    // Download the found image
    return await downloadAndConvert(title, imageUrl);
  } catch (err) {
    console.error(`   ❌ Puppeteer error for ${title}: ${err.message}`);
    return "failed";
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const stats = { success: 0, failed: 0, skipped: 0 };

  // Phase 1: Direct downloads (no Puppeteer needed)
  console.log(
    `\n═══ Phase 1: Direct downloads (${SHOWS_WITH_URLS.length} shows) ═══\n`,
  );

  // Process 4 at a time to avoid overwhelming servers
  for (let i = 0; i < SHOWS_WITH_URLS.length; i += 4) {
    const batch = SHOWS_WITH_URLS.slice(i, i + 4);
    const results = await Promise.all(
      batch.map((show) => downloadAndConvert(show.title, show.url)),
    );
    results.forEach((result) => stats[result]++);
  }

  // Phase 2: Puppeteer-based extraction
  console.log(
    `\n═══ Phase 2: Puppeteer extraction (${SHOWS_NEEDING_PUPPETEER.length} shows) ═══\n`,
  );

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (const show of SHOWS_NEEDING_PUPPETEER) {
      const result = await extractImageWithPuppeteer(
        browser,
        show.title,
        show.pageUrl,
      );
      stats[result]++;
    }
  } catch (err) {
    console.error(`\n❌ Puppeteer launch error: ${err.message}`);
    console.log("   Skipping Puppeteer shows...");
    stats.failed += SHOWS_NEEDING_PUPPETEER.length;
  } finally {
    if (browser) await browser.close();
  }

  // Summary
  const total = SHOWS_WITH_URLS.length + SHOWS_NEEDING_PUPPETEER.length;
  console.log(`\n═══ Summary ═══`);
  console.log(`Total: ${total} shows`);
  console.log(`✅ Downloaded: ${stats.success}`);
  console.log(`⏭️  Skipped (already exists): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(
    `\n⚠️  מי שסוכתו נופלת (Khan) — no image available yet (show premieres March 21, 2026)\n`,
  );
}

main();
