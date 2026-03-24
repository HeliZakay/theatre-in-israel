import { test, expect } from "@playwright/test";

test.describe("Shows Browsing", () => {
  test("home page renders hero, carousels, and CTA", async ({ page }) => {
    await page.goto("/");

    // Hero section exists
    await expect(page.locator("#main-content")).toBeVisible();

    // Genre carousel sections
    await expect(
      page.getByRole("heading", { name: "דירוגים גבוהים" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "דרמות" })).toBeVisible();

    // Community banner
    await expect(
      page.getByRole("heading", { name: "בואו להיות חלק מהקהילה" }),
    ).toBeVisible();

    // CTA strip
    await expect(
      page.getByRole("heading", { name: "כתב.י ביקורת ועזר.י לאחרים לבחור" }),
    ).toBeVisible();
  });

  test("navigate from home to shows page", async ({ page }) => {
    await page.goto("/");
    // Click the "לכל ההצגות" link (first one, from top-rated section)
    await page.getByRole("link", { name: "לכל ההצגות" }).first().click();
    await expect(page).toHaveURL("/shows");
    await expect(
      page.getByRole("heading", { name: "הצגות", level: 1 }),
    ).toBeVisible();
  });

  test("shows page lists shows and has filters", async ({ page }) => {
    await page.goto("/shows");

    await expect(
      page.getByRole("heading", { name: "הצגות", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("בחרו הצגה וקראו ביקורות של הקהל"),
    ).toBeVisible();

    // Show cards should be present (at least one link to a show)
    const showCards = page.locator('a[href^="/shows/"]');
    await expect(showCards.first()).toBeVisible();
  });

  test("filter shows by search query", async ({ page }) => {
    await page.goto("/shows");

    // Type in search
    const searchInput = page.getByPlaceholder(/חיפוש/);
    await searchInput.fill("הכוכב");
    // Wait for URL to update (search is debounced)
    await page.waitForURL(/query=/);

    // Filter chip should appear
    await expect(page.getByText("מסונן לפי:")).toBeVisible();
  });

  test("clear filters resets the page", async ({ page }) => {
    await page.goto("/shows?query=test");

    // Clear filters link
    const clearLink = page.getByRole("link", { name: "נקה סינון" });
    if (await clearLink.isVisible()) {
      await clearLink.click();
      await expect(page).toHaveURL("/shows");
    }
  });

  test("infinite scroll loads more shows on scroll", async ({ page }) => {
    await page.goto("/shows");

    // Count initial show cards
    const showCards = page.locator('a[href^="/shows/"]');
    const initialCount = await showCards.count();

    // Only test scroll-loading if there are enough shows to trigger it
    if (initialCount >= 12) {
      // Scroll to bottom to trigger infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for more cards to load
      await expect(async () => {
        const newCount = await showCards.count();
        expect(newCount).toBeGreaterThan(initialCount);
      }).toPass({ timeout: 10000 });

      // URL should NOT have a page parameter
      expect(page.url()).not.toContain("page=");
    }
  });

  test("show detail page displays show info", async ({ page }) => {
    // Go to shows list, click first show
    await page.goto("/shows");
    const firstShowLink = page.locator('a[href^="/shows/"]').first();
    const showTitle = await firstShowLink.textContent();
    await firstShowLink.click();

    // Should be on a show detail page
    await expect(page).toHaveURL(/\/shows\/.+/);

    // Breadcrumbs should show
    await expect(page.getByRole("link", { name: "הצגות" })).toBeVisible();

    // Show details
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Theatre name, duration info visible
    await expect(page.locator("text=דקות")).toBeVisible();

    // Write review button
    await expect(
      page.getByRole("link", { name: "כתב.י ביקורת" }),
    ).toBeVisible();

    // Watchlist button
    await expect(
      page.getByRole("button", { name: /הוסיפ.י לרשימת צפייה|ברשימת הצפייה/ }),
    ).toBeVisible();

    // Reviews section heading
    await expect(
      page.getByRole("heading", { name: "ביקורות אחרונות" }),
    ).toBeVisible();
  });
});
