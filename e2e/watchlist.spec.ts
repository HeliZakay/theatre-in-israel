import { test, expect } from "./fixtures";
import { cleanupTestData } from "./helpers/db";

test.describe("Watchlist", () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test("add show to watchlist from detail page", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto(`/shows/${firstShow.slug}`);

    // Click add to watchlist
    const watchlistBtn = page.getByRole("button", {
      name: "הוספה לרשימת צפייה",
    });
    await expect(watchlistBtn).toBeVisible();
    await watchlistBtn.click();

    // Button should toggle to "in watchlist" state
    await expect(
      page.getByRole("button", { name: "ברשימת הצפייה ✓" }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("show appears in my watchlist page after adding", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;

    // Add to watchlist from show page
    await page.goto(`/shows/${firstShow.slug}`);
    await page.getByRole("button", { name: "הוספה לרשימת צפייה" }).click();
    await expect(
      page.getByRole("button", { name: "ברשימת הצפייה ✓" }),
    ).toBeVisible({ timeout: 5_000 });

    // Navigate to watchlist page
    await page.goto("/me/watchlist");
    await expect(
      page.getByRole("heading", { name: "רשימת הצפייה שלי" }),
    ).toBeVisible();

    // Show should be listed
    await expect(page.getByText(firstShow.title)).toBeVisible();
  });

  test("remove show from watchlist page", async ({ authedPage, firstShow }) => {
    const page = authedPage;

    // First add to watchlist
    await page.goto(`/shows/${firstShow.slug}`);
    await page.getByRole("button", { name: "הוספה לרשימת צפייה" }).click();
    await expect(
      page.getByRole("button", { name: "ברשימת הצפייה ✓" }),
    ).toBeVisible({ timeout: 5_000 });

    // Go to watchlist page
    await page.goto("/me/watchlist");
    await expect(page.getByText(firstShow.title)).toBeVisible();

    // Click remove
    await page.getByRole("button", { name: "הסרה מהרשימה" }).click();

    // Confirmation dialog
    await expect(page.getByText("הסרה מרשימת הצפייה")).toBeVisible();
    await expect(page.getByText("להסיר את ההצגה מרשימת הצפייה?")).toBeVisible();

    // Confirm
    await page.getByRole("button", { name: "הסרה" }).nth(1).click();

    // Show should be gone, empty state should appear
    await expect(
      page.getByText("עדיין לא הוספת הצגות לרשימת הצפייה."),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("watchlist button redirects to signin for unauthenticated user", async ({
    page,
  }) => {
    // Use the default non-authenticated page
    await page.goto("/shows");
    // Navigate to any show
    await page.locator('a[href^="/shows/"]').first().click();
    await page.waitForURL(/\/shows\/.+/);

    // Click watchlist button
    await page.getByRole("button", { name: "הוספה לרשימת צפייה" }).click();

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("empty watchlist shows call to action", async ({ authedPage }) => {
    const page = authedPage;
    await page.goto("/me/watchlist");

    await expect(
      page.getByText("עדיין לא הוספת הצגות לרשימת הצפייה."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "לכל ההצגות" })).toBeVisible();
  });
});
