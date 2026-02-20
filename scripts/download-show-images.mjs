import sharp from "sharp";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

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

// All 40 shows with found image URLs (Cameri #31 השותפה has no image on their site)
const SHOWS = [
  // Direct URLs from initial research
  {
    title: "מעבר לדלת",
    url: "https://www.habima.co.il/wp-content/uploads/2023/01/מעבר-לדלת-חדש-תמונת-שער-למובייל.jpg",
  },
  {
    title: "פריסילה מלכת המדבר",
    url: "https://www.habima.co.il/wp-content/uploads/2024/12/500X575-1-1.jpg",
  },
  {
    title: "גרה עם קושמרו",
    url: "https://www.habima.co.il/wp-content/uploads/2025/01/בנרים-הבימה3.jpg",
  },
  {
    title: "מרציפנים",
    url: "https://www.habima.co.il/wp-content/uploads/2023/08/מרציפנים-חדש-תמונת-שער-למובייל.jpg",
  },
  {
    title: "בית בובות",
    url: "https://www.habima.co.il/wp-content/uploads/2024/03/496_818.png",
  },
  {
    title: "קזבלן",
    url: "https://www.habima.co.il/wp-content/uploads/2022/08/קזבלן-עמוד-הבית-למובייל-A.jpg",
  },

  // Scraped from Habima show pages — batch 1
  {
    title: "הנערה מהדואר",
    url: "https://www.habima.co.il/wp-content/uploads/2025/12/345X465-הנערה-מהדואר.jpg",
  },
  {
    title: "התקלה",
    url: "https://www.habima.co.il/wp-content/uploads/2025/11/תקלה-מובייל.jpg",
  },
  {
    title: "משכנתא",
    url: "https://www.habima.co.il/wp-content/uploads/2025/08/496X818-משכנתא.jpg",
  },
  {
    title: "זו שכותבת אותי",
    url: "https://www.habima.co.il/wp-content/uploads/2026/01/496x818-2.png",
  },
  {
    title: "הג\u05F3יגולו מקונגו",
    url: "https://www.habima.co.il/wp-content/uploads/2025/02/496X818-הגיגולו-מקונגו-e1749456894822.jpg",
  },
  {
    title: "משהו טוב",
    url: "https://www.habima.co.il/wp-content/uploads/2025/04/496X818-משהו-טוב-1.jpg",
  },
  {
    title: "הערת שוליים",
    url: "https://www.habima.co.il/wp-content/uploads/2024/10/345X465-3.jpg",
  },

  // Scraped from Habima show pages — batch 2
  {
    title: "מה שנשאר לך בברלין",
    url: "https://www.habima.co.il/wp-content/uploads/2025/08/496x818.png",
  },
  {
    title: "באמצע הרחוב",
    url: "https://www.habima.co.il/wp-content/uploads/2026/01/496x818.jpg",
  },
  {
    title: "פציעות קטנות",
    url: "https://www.habima.co.il/wp-content/uploads/2025/12/496818.png",
  },
  {
    title: "פעולות פשוטות",
    url: "https://www.habima.co.il/wp-content/uploads/2026/01/496X818-הבימה-מארחת.jpg",
  },
  {
    title: "אחד בלי השני",
    url: "https://www.habima.co.il/wp-content/uploads/2025/02/מובייל-496-רוחב-818-גובה_.png",
  },
  {
    title: "הדב השומר עליי",
    url: "https://www.habima.co.il/wp-content/uploads/2026/01/496_818.jpg",
  },
  {
    title: "מי את חושבת שאת",
    url: "https://www.habima.co.il/wp-content/uploads/2025/08/345X465-מי-את-חושבת-שאת-1.jpg",
  },

  // Scraped from Habima show pages — batch 3
  {
    title: "בחור לחתונה",
    url: "https://www.habima.co.il/wp-content/uploads/2025/04/496_818_V3.jpg",
  },
  {
    title: "הלילה השנים-עשר",
    url: "https://www.habima.co.il/wp-content/uploads/2025/12/496X818-הלילה-השניים-עשר.jpg",
  },
  {
    title: "מעגל הגיר הקווקזי",
    url: "https://www.habima.co.il/wp-content/uploads/2025/04/496X818-מעגל-הגיר-הקווקזי.jpg",
  },
  {
    title: "מלאכים בלבן",
    url: "https://www.habima.co.il/wp-content/uploads/2025/09/496X818-A-מלאכים-בלבן-1.jpg",
  },
  {
    title: "קיצור תהליכים",
    url: "https://www.habima.co.il/wp-content/uploads/2024/05/818X496.jpg",
  },
  {
    title: "רומי + ג\u05F3ולייט",
    url: "https://www.habima.co.il/wp-content/uploads/2024/09/345X465-copy-1.jpg",
  },

  // Beit Lessin shows
  {
    title: "בחורים טובים",
    url: "https://www.lessin.co.il/wp-content/uploads/2024/12/GoodGuys-1500x1000-2.jpg",
  },
  {
    title: "לילה ברומא",
    url: "https://www.lessin.co.il/wp-content/uploads/2024/08/Night-in-Rome-1920X700.jpg",
  },
  {
    title: "בין קודש לחולון",
    url: "https://www.lessin.co.il/wp-content/uploads/2023/08/Kodesh-1500x700-1.jpg",
  },
  {
    title: "אמדאוס",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/09/Amadeus-1900_950.jpg",
  },
  {
    title: "דתילונים",
    url: "https://www.lessin.co.il/wp-content/uploads/2024/03/Datilonim-1500x1000-2.jpg",
  },
  {
    title: "קרנפים",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/04/Rhinoceros-1900_950-1.jpg",
  },
  {
    title: "אפס ביחסי אנוש",
    url: "https://www.lessin.co.il/wp-content/uploads/2019/07/DSC4938-1.jpg",
  },
  {
    title: "אור לגויים",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/07/1900x950OR.jpg",
  },
  {
    title: "הכל אודות איב",
    url: "https://www.lessin.co.il/wp-content/uploads/2024/12/%D7%94%D7%9B%D7%9C-%D7%90%D7%95%D7%93%D7%95%D7%AA-%D7%90%D7%99%D7%91-2.jpg",
  },
  {
    title: "קיר זכוכית",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/12/%D7%A7%D7%99%D7%A8-%D7%96%D7%9B%D7%95%D7%9B%D7%99%D7%AA-GlassWall-1900_950.jpg",
  },
  {
    title: "אף מילה לאמא",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/10/1900x950-%D7%97.jpg",
  },
  {
    title: "חנאל ומכבית",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/12/HM-1900_950.jpg",
  },
  {
    title: "מלכת היופי של ירושלים",
    url: "https://www.lessin.co.il/wp-content/uploads/2025/02/%D7%9E%D7%9C%D7%9B%D7%AA-%D7%9B%D7%A8%D7%9E%D7%9C-1950.jpg",
  },
  {
    title: "משחקים בחצר האחורית",
    url: "https://www.lessin.co.il/wp-content/uploads/2021/08/backyard-squ_sit-copy-e1630595012964.jpg",
  },
];

async function downloadAndConvert(show) {
  const slug = titleToSlug(show.title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  console.log(`⏳ ${show.title} → ${slug}.webp`);

  try {
    const headers = {};
    if (show.url.includes("lessin.co.il")) {
      headers["User-Agent"] =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      headers["Referer"] = "https://www.lessin.co.il/";
    }
    const res = await fetch(show.url, { headers });
    if (!res.ok) {
      console.error(`   ❌ HTTP ${res.status} for ${show.url}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    await writeFile(outPath, webpBuffer);

    console.log(`   ✅ Saved (${(webpBuffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`\nDownloading ${SHOWS.length} show images...\n`);

  let success = 0;
  let failed = 0;

  // Process 4 at a time to avoid overwhelming the server
  for (let i = 0; i < SHOWS.length; i += 4) {
    const batch = SHOWS.slice(i, i + 4);
    const results = await Promise.all(batch.map(downloadAndConvert));
    results.forEach((ok) => (ok ? success++ : failed++));
  }

  console.log(`\n✅ Done: ${success} downloaded, ${failed} failed`);
  console.log(
    `⚠️  #31 השותפה (Cameri) skipped — no image on their website yet\n`,
  );
}

main();
