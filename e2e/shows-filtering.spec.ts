import { test, expect } from "@playwright/test";

test.describe("Shows Filtering", () => {
  test("filter by genre updates results", async ({ page }) => {
    await page.goto("/shows");

    // Click a genre chip (not the "הכל" button)
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.filter({ hasNotText: "הכל" }).first();
    await firstGenre.click();

    await page.waitForURL(/genres=/);
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

  test("change sort order updates URL", async ({ page }) => {
    await page.goto("/shows");

    // Open the sort Radix Select
    const sortSelect = page.getByRole("combobox", { name: "מיון" });
    await sortSelect.click();

    // Select "דירוג נמוך"
    await page.getByRole("option", { name: "דירוג נמוך" }).click();

    await page.waitForURL(/sort=rating-asc/);
  });

  test("combine genre and search filters", async ({ page }) => {
    await page.goto("/shows");

    // Type a search query
    const searchInput = page.getByPlaceholder(/חיפוש|חפש/);
    await searchInput.fill("תיאטרון");
    await page.waitForURL(/query=/);

    // Click a genre chip (not "הכל")
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.filter({ hasNotText: "הכל" }).first();
    await firstGenre.click();

    await page.waitForURL(/query=.*genres=|genres=.*query=/);
  });

  test("no matching results shows empty state", async ({ page }) => {
    await page.goto("/shows");

    const searchInput = page.getByPlaceholder(/חיפוש|חפש/);
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

    // Click a genre chip inside the toggle group
    const genreChips = page.getByRole("group").getByRole("button");
    const firstGenre = genreChips.first();
    await firstGenre.click();
    await page.waitForURL(/genres=/);

    // Click the standalone "הכל" genre button (outside the ToggleGroup)
    await page
      .locator('button[aria-current="true"]', { hasText: "הכל" })
      .or(page.locator("button", { hasText: "הכל" }).first())
      .click();

    // genres= should no longer be in the URL
    await page.waitForURL((url) => !url.search.includes("genres="));
    await expect(page).not.toHaveURL(/genres=/);
  });
});
