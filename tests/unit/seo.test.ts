import {
  getSiteUrl,
  getMetadataBase,
  toAbsoluteUrl,
  toJsonLd,
  getShowImageAlt,
  buildBreadcrumbJsonLd,
  buildCreativeWorkJsonLd,
  SITE_NAME,
  SITE_DESCRIPTION,
  type ShowStats,
} from "@/lib/seo";
import type { Show } from "@/types";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
];

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

const makeShow = (overrides: Partial<Show> = {}): Show => ({
  id: 1,
  slug: "hamlet",
  title: "המלט",
  theatre: "הבימה",
  durationMinutes: 120,
  summary: "הצגה קלאסית",
  description: "תיאור ארוך",
  cast: "שחקן 1, שחקן 2",
  webReviewSummary: null,
  genre: ["דרמה"],
  reviews: [
    {
      id: 1,
      showId: 1,
      userId: "u1",
      author: "יוסי",
      title: "מצוין",
      text: "הצגה נפלאה",
      rating: 5,
      date: "2025-01-15T00:00:00.000Z",
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date("2025-01-15"),
    },
  ],
  ...overrides,
});

describe("seo", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ── Constants ──

  it("exports SITE_NAME", () => {
    expect(SITE_NAME).toBe("תיאטרון בישראל");
  });

  it("exports SITE_DESCRIPTION", () => {
    expect(typeof SITE_DESCRIPTION).toBe("string");
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  // ── getSiteUrl ──

  describe("getSiteUrl", () => {
    it("returns NEXT_PUBLIC_SITE_URL when set", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      expect(getSiteUrl()).toBe("https://example.com");
    });

    it("falls back to SITE_URL", () => {
      process.env.SITE_URL = "https://site-url.com";
      expect(getSiteUrl()).toBe("https://site-url.com");
    });

    it("falls back to VERCEL_PROJECT_PRODUCTION_URL", () => {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";
      expect(getSiteUrl()).toBe("https://myapp.vercel.app");
    });

    it("falls back to localhost when all env vars are missing", () => {
      expect(getSiteUrl()).toBe("http://localhost:3000");
    });

    it("adds https:// when protocol is missing", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "example.com";
      expect(getSiteUrl()).toBe("https://example.com");
    });

    it("preserves existing http://", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:4000";
      expect(getSiteUrl()).toBe("http://localhost:4000");
    });

    it("strips trailing slash", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
      expect(getSiteUrl()).toBe("https://example.com");
    });

    it("handles whitespace-only env var as empty", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "   ";
      expect(getSiteUrl()).toBe("http://localhost:3000");
    });

    it("prefers NEXT_PUBLIC_SITE_URL over SITE_URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://preferred.com";
      process.env.SITE_URL = "https://fallback.com";
      expect(getSiteUrl()).toBe("https://preferred.com");
    });
  });

  // ── getMetadataBase ──

  describe("getMetadataBase", () => {
    it("returns a URL object", () => {
      const url = getMetadataBase();
      expect(url).toBeInstanceOf(URL);
    });

    it("matches getSiteUrl", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      expect(getMetadataBase().toString()).toBe("https://example.com/");
    });
  });

  // ── toAbsoluteUrl ──

  describe("toAbsoluteUrl", () => {
    it("converts relative path to absolute URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      expect(toAbsoluteUrl("/shows/hamlet")).toBe(
        "https://example.com/shows/hamlet",
      );
    });

    it("returns already-absolute URLs unchanged", () => {
      expect(toAbsoluteUrl("https://other.com/page")).toBe(
        "https://other.com/page",
      );
    });

    it("handles paths without leading slash", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      expect(toAbsoluteUrl("shows/hamlet")).toBe(
        "https://example.com/shows/hamlet",
      );
    });
  });

  // ── toJsonLd ──

  describe("toJsonLd", () => {
    it("serializes objects to JSON", () => {
      expect(toJsonLd({ name: "test" })).toBe('{"name":"test"}');
    });

    it("escapes < to prevent XSS", () => {
      expect(toJsonLd("<script>alert</script>")).toContain("\\u003c");
      expect(toJsonLd("<script>alert</script>")).not.toContain("<");
    });

    it("handles nested objects", () => {
      const result = toJsonLd({ a: { b: "<tag>" } });
      expect(result).not.toContain("<");
      expect(result).toContain("\\u003c");
    });
  });

  // ── getShowImageAlt ──

  describe("getShowImageAlt", () => {
    it("returns Hebrew alt text with title", () => {
      expect(getShowImageAlt("המלט")).toBe("פוסטר ההצגה המלט");
    });
  });

  // ── buildBreadcrumbJsonLd ──

  describe("buildBreadcrumbJsonLd", () => {
    it("returns correct schema.org structure", () => {
      const result = buildBreadcrumbJsonLd([
        { name: "ראשי", path: "/" },
        { name: "הצגות", path: "/shows" },
      ]);
      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("BreadcrumbList");
    });

    it("uses 1-indexed positions", () => {
      const result = buildBreadcrumbJsonLd([
        { name: "ראשי", path: "/" },
        { name: "הצגות", path: "/shows" },
      ]);
      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
    });

    it("creates absolute URLs for items", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      const result = buildBreadcrumbJsonLd([{ name: "ראשי", path: "/" }]);
      expect(result.itemListElement[0].item).toContain("https://");
    });

    it("handles empty items array", () => {
      const result = buildBreadcrumbJsonLd([]);
      expect(result.itemListElement).toEqual([]);
    });
  });

  // ── buildCreativeWorkJsonLd ──

  describe("buildCreativeWorkJsonLd", () => {
    const stats: ShowStats = {
      reviewCount: 10,
      avgRating: 4.5,
      latestReviewDate: new Date("2025-06-01"),
    };

    it("returns correct schema.org type", () => {
      const result = buildCreativeWorkJsonLd(
        makeShow(),
        stats,
        "/shows/hamlet",
      );
      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("CreativeWorkSeries");
      expect(result.name).toBe("המלט");
    });

    it("includes aggregateRating when avgRating is not null", () => {
      const result = buildCreativeWorkJsonLd(
        makeShow(),
        stats,
        "/shows/hamlet",
      );
      expect(result.aggregateRating).toBeDefined();
      expect(result.aggregateRating?.["@type"]).toBe("AggregateRating");
      expect(result.aggregateRating?.ratingValue).toBe(4.5);
      expect(result.aggregateRating?.reviewCount).toBe(10);
    });

    it("omits aggregateRating when avgRating is null", () => {
      const noRatingStats: ShowStats = {
        reviewCount: 0,
        avgRating: null,
        latestReviewDate: null,
      };
      const result = buildCreativeWorkJsonLd(
        makeShow({ reviews: [] }),
        noRatingStats,
        "/shows/hamlet",
      );
      expect(result.aggregateRating).toBeUndefined();
    });

    it("limits reviews to first 5", () => {
      const reviews = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        showId: 1,
        userId: `u${i}`,
        author: `author${i}`,
        title: `title${i}`,
        text: `review text ${i}`,
        rating: 4,
        date: "2025-01-01T00:00:00.000Z",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      }));
      const show = makeShow({ reviews });
      const result = buildCreativeWorkJsonLd(show, stats, "/shows/hamlet");
      expect(result.review).toHaveLength(5);
    });

    it("handles show with 0 reviews", () => {
      const result = buildCreativeWorkJsonLd(
        makeShow({ reviews: [] }),
        { reviewCount: 0, avgRating: null, latestReviewDate: null },
        "/shows/hamlet",
      );
      expect(result.review).toHaveLength(0);
    });

    it("rounds rating value to 1 decimal", () => {
      const statsRounded: ShowStats = {
        reviewCount: 3,
        avgRating: 3.6667,
        latestReviewDate: new Date(),
      };
      const result = buildCreativeWorkJsonLd(
        makeShow(),
        statsRounded,
        "/shows/hamlet",
      );
      expect(result.aggregateRating?.ratingValue).toBe(3.7);
    });

    it("includes content location from show theatre", () => {
      const result = buildCreativeWorkJsonLd(
        makeShow(),
        stats,
        "/shows/hamlet",
      );
      expect(result.contentLocation.name).toBe("הבימה");
    });

    it("uses description when available, falls back to summary", () => {
      const withDesc = buildCreativeWorkJsonLd(
        makeShow({ description: "תיאור" }),
        stats,
        "/shows/hamlet",
      );
      expect(withDesc.description).toBe("תיאור");

      const withoutDesc = buildCreativeWorkJsonLd(
        makeShow({ description: null }),
        stats,
        "/shows/hamlet",
      );
      expect(withoutDesc.description).toBe("הצגה קלאסית");
    });
  });
});
