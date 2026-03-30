import { test, expect } from "./fixtures";
import { cleanupTestData } from "./helpers/db";

test.describe("Watchlist", () => {
  // These tests share the same user and mutate watchlist — must run sequentially
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test("add show to watchlist from detail page", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    // Wait for client-side session to hydrate before clicking session-dependent buttons
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/session")),
      page.goto(`/shows/${firstShow.slug}`),
    ]);

    // Click add to watchlist
    const watchlistBtn = page.getByRole("button", {
      name: "הוסיפ.י לרשימת צפייה",
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

    // Add to watchlist from show page — wait for client session
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/session")),
      page.goto(`/shows/${firstShow.slug}`),
    ]);
    await page.getByRole("button", { name: "הוסיפ.י לרשימת צפייה" }).click();
    await expect(
      page.getByRole("button", { name: "ברשימת הצפייה ✓" }),
    ).toBeVisible({ timeout: 5_000 });

    // Navigate to watchlist page
    await page.goto("/me/watchlist");
    await expect(
      page.getByRole("heading", { name: "רשימת הצפייה שלי" }),
    ).toBeVisible();

    // Show should be listed
    await expect(page.getByText(firstShow.title).first()).toBeVisible();
  });

  test("remove show from watchlist page", async ({ authedPage, firstShow }) => {
    const page = authedPage;

    // First add to watchlist — wait for client session
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/session")),
      page.goto(`/shows/${firstShow.slug}`),
    ]);
    await page.getByRole("button", { name: "הוסיפ.י לרשימת צפייה" }).click();
    await expect(
      page.getByRole("button", { name: "ברשימת הצפייה ✓" }),
    ).toBeVisible({ timeout: 5_000 });

    // Go to watchlist page
    await page.goto("/me/watchlist");
    await expect(page.getByText(firstShow.title).first()).toBeVisible();

    // Click the bookmark toggle to remove from watchlist
    await page.getByRole("button", { name: "הסר מרשימת צפייה" }).click();

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
    await page.getByRole("button", { name: "הוסיפ.י לרשימת צפייה" }).click();

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("empty watchlist shows call to action", async ({ authedPage }) => {
    const page = authedPage;
    // Force a fresh load (previous test's revalidatePath may have stale cache)
    await page.goto("/me/watchlist", { waitUntil: "networkidle" });

    await expect(
      page.getByText("עדיין לא הוספת הצגות לרשימת הצפייה."),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "לכל ההצגות" })).toBeVisible();
  });
});
