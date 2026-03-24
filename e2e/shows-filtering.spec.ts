import { test, expect } from "@playwright/test";

test.describe("Shows Filtering", () => {
  test("filter by genre updates results", async ({ page }) => {
    await page.goto("/shows");

    // Click a genre chip (not the "הכל" button)
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.filter({ hasNotText: "הכל" }).first();
    await firstGenre.click();

    await page.waitForURL(/genre=/);
    await expect(page.getByText("מסונן לפי:")).toBeVisible();
  });

  test("filter by theatre updates results", async ({ page }) => {
    await page.goto("/shows");

    // Open the theatre Radix Select
    const theatreSelect = page.getByRole("combobox", { name: "תיאטרון" });
    await theatreSelect.click();

    // Pick the first theatre option that isn't "הכל"
    const options = page.getByRole("option");
    const theatreOption = options.filter({ hasNotText: "הכל" }).first();
    await theatreOption.click();

    await page.waitForURL(/theatre=/);
  });

  test("combine genre and search filters", async ({ page }) => {
    await page.goto("/shows");

    // Type a search query
    const searchInput = page.getByRole("searchbox", { name: "חיפוש" });
    await searchInput.fill("תיאטרון");
    await page.waitForURL(/query=/);

    // Click a genre chip (not "הכל")
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.filter({ hasNotText: "הכל" }).first();
    await firstGenre.click();

    await page.waitForURL(/query=.*genre=|genre=.*query=/);
  });

  test("no matching results shows empty state", async ({ page }) => {
    await page.goto("/shows");

    const searchInput = page.getByRole("searchbox", { name: "חיפוש" });
    await searchInput.fill("xyznonexistent123");
    await page.waitForURL(/query=/);

    await expect(page.getByText("לא נמצאו הצגות לפי החיפוש.")).toBeVisible();
  });

  test("direct URL with filters loads correctly", async ({ page }) => {
    await page.goto("/shows?sort=rating-asc");

    // Page should load with shows visible
    await expect(
      page.getByRole("heading", { name: "הצגות", level: 1 }),
    ).toBeVisible();

    const showCards = page.locator('a[href^="/shows/"]');
    const hasShows = await showCards
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Either shows are displayed or the empty state is shown
    if (!hasShows) {
      await expect(page.getByText("לא נמצאו הצגות לפי החיפוש.")).toBeVisible();
    }
  });

  test("clear genre filter shows all results", async ({ page }) => {
    await page.goto("/shows");

    // Click a genre chip (not the "הכל" button)
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.filter({ hasNotText: "הכל" }).first();
    await firstGenre.click();
    await page.waitForURL(/genre=/);

    // Click the standalone "הכל" button (outside the ToggleGroup) to clear filters
    await page.locator("main").getByRole("button", { name: "הכל", exact: true }).click();

    // genre= should no longer be in the URL
    await expect(page).not.toHaveURL(/genre=/, { timeout: 10_000 });
  });
});
