/**
 * Probes candidate venue/theatre sites for public APIs.
 * - WordPress: /wp-json/wp/v2/ (and /wp-json/wp/v2/shows, /wp-json/tribe/events/v1/events)
 * - SmartTicket: /api/shows
 *
 * Run: node scripts/probe-apis.mjs
 */

const WP_SITES = [
  { name: "Beer Sheva (b7t)", base: "https://b7t.co.il" },
  { name: "Or Akiva", base: "https://htorakiva.co.il" },
  { name: "Holon (hth)", base: "https://hth.co.il" },
  { name: "Nes Ziona", base: "https://tarbut-nz.co.il" },
  { name: "Rishon LeZion", base: "https://htrl.co.il" },
  { name: "Cameri", base: "https://cameri.co.il" },
  { name: "Haifa (ht1)", base: "https://ht1.co.il" },
  { name: "Hasimta (known good)", base: "https://hasimta.com" },
  { name: "Tomix", base: "https://to-mix.co.il" },

  // Theatres not yet probed
  { name: "Lessin", base: "https://www.lessin.co.il" },
  { name: "Khan", base: "https://www.khan.co.il" },
  { name: "Gesher", base: "https://www.gesher-theatre.co.il" },
  { name: "Tmuna (ASP)", base: "https://www.tmu-na.org.il" },
  { name: "Tzavta", base: "https://www.tzavta.co.il" },
  { name: "Habima", base: "https://www.habima.co.il" },
  { name: "Malenki (Wix)", base: "https://www.malenky.co.il" },
  { name: "Davai (WP/Bridge)", base: "https://davai-group.org" },
  { name: "Meshulash (Wix)", base: "https://www.hameshulash.com" },
  { name: "Hebrew Theatre", base: "https://www.teatron.org.il" },
  { name: "Incubator", base: "https://incubator.org.il" },
  { name: "Jerusalem Theatre Group", base: "https://www.tcj.org.il" },
  { name: "Elad (Wix)", base: "https://www.elad-theater.co.il" },

  // Venues not yet probed
  { name: "Ashdod (ASP)", base: "https://www.mishkan-ashdod.co.il" },
  { name: "Ashkelon (Umbraco)", base: "https://www.htash.co.il" },
  { name: "Theatron HaZafon (ASP)", base: "https://www.theatron-hazafon.co.il" },
  { name: "Airport City (PHP)", base: "https://heichal-hm.co.il" },
  { name: "Kiryat Motzkin", base: "https://www.mozkin-theater.co.il" },
  { name: "Herzliya (Joomla)", base: "https://www.hoh-herzliya.co.il" },
  { name: "Jerusalem Theatre", base: "https://www.jerusalem-theatre.co.il" },
];

const SMARTICKET_SITES = [
  { name: "Hashaa (known good)", base: "https://teatron-hashaa.smarticket.co.il" },
  { name: "Petah Tikva", base: "https://petah-tikva.smarticket.co.il" },
  { name: "Kfar Saba", base: "https://ksaba.smarticket.co.il" },
  { name: "Ganei Tikva (habama)", base: "https://habama.smarticket.co.il" },
  { name: "Or Yehuda", base: "https://oryehuda.smarticket.co.il" },
  { name: "Elad", base: "https://elad-theater.smarticket.co.il" },
  { name: "Rehovot", base: "https://rehovot.smarticket.co.il" },
  { name: "Niko Nitai", base: "https://nikonitai.smarticket.co.il" },
  { name: "Incubator", base: "https://incubator.smarticket.co.il" },
  { name: "Haifa SmartTicket", base: "https://ht1.smarticket.co.il" },
];

const TIMEOUT_MS = 10_000;

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json,*/*",
      },
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "";
    let bodySample = "";
    let parsed = null;
    let count = null;
    try {
      const text = await res.text();
      bodySample = text.slice(0, 200).replace(/\s+/g, " ");
      if (ct.includes("json") || text.trim().startsWith("[") || text.trim().startsWith("{")) {
        try {
          parsed = JSON.parse(text);
          if (Array.isArray(parsed)) count = parsed.length;
          else if (parsed && typeof parsed === "object") count = Object.keys(parsed).length;
        } catch {}
      }
    } catch {}
    return {
      ok: res.ok,
      status: res.status,
      contentType: ct,
      isJson: parsed !== null,
      count,
      sample: bodySample,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(t);
  }
}

function summarize(name, url, r) {
  const tag = r.isJson
    ? `JSON ✓ (${r.count ?? "?"} items)`
    : r.ok
      ? `${r.status} non-json (${r.contentType})`
      : `${r.status || "ERR"} ${r.error || ""}`;
  console.log(`  ${tag.padEnd(30)} ${name}`);
  console.log(`    ${url}`);
  if (r.sample && !r.isJson) console.log(`    sample: ${r.sample.slice(0, 120)}`);
}

async function main() {
  console.log("\n=== WordPress REST API probe ===\n");
  for (const site of WP_SITES) {
    console.log(`\n[${site.name}] ${site.base}`);
    const endpoints = [
      "/wp-json/",
      "/wp-json/wp/v2/shows?per_page=3",
      "/wp-json/wp/v2/posts?per_page=3",
      "/wp-json/tribe/events/v1/events?per_page=3",
    ];
    for (const ep of endpoints) {
      const url = site.base + ep;
      const r = await probe(url);
      summarize(ep, url, r);
    }
  }

  console.log("\n\n=== SmartTicket /api/shows probe ===\n");
  for (const site of SMARTICKET_SITES) {
    console.log(`\n[${site.name}] ${site.base}`);
    const url = site.base + "/api/shows";
    const r = await probe(url);
    summarize("/api/shows", url, r);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
