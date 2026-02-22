import { test, expect } from "@playwright/test";

test.describe("SEO & Meta", () => {
  test("robots.txt contains correct disallow rules", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.ok()).toBe(true);

    const text = await response.text();
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Disallow: /auth/");
    expect(text).toContain("Disallow: /me/");
  });

  test("sitemap.xml contains show URLs", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);

    const text = await response.text();
    expect(text).toContain("/shows/");
    expect(text).toMatch(/<\?xml|<urlset/);
  });

  test("manifest returns valid JSON with app info", async ({ page }) => {
    const response = await page.request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);

    const json = await response.json();
    expect(json).toHaveProperty("name");
    expect(json.icons).toBeInstanceOf(Array);
    expect(json.dir).toBe("rtl");
  });

  test("home page has correct title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("תיאטרון");
  });

  test("show detail page title contains show name", async ({ page }) => {
    await page.goto("/shows");
    await page.locator("a[href^='/shows/']").first().click();

    const title = await page.title();
    expect(title).toContain("ביקורות");
  });
});
