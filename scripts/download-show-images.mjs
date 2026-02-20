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

// All 26 shows with found image URLs (Cameri #31 השותפה has no image on their site)
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
];

async function downloadAndConvert(show) {
  const slug = titleToSlug(show.title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  console.log(`⏳ ${show.title} → ${slug}.webp`);

  try {
    const res = await fetch(show.url);
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
