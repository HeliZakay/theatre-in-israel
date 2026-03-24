import { test as baseTest, expect } from "./fixtures";
import { cleanupTestData, getShowByOffset } from "./helpers/db";

// Use a different show (offset 1) to avoid conflicts with parallel review test files
const test = baseTest.extend<{ firstShow: { id: number; title: string; slug: string } }>({
  firstShow: async ({}, use) => {
    await use(await getShowByOffset(1));
  },
});

test.describe("Create Review", () => {
  test.describe.configure({ mode: "serial" });
  // Clean before AND after — scope to this file's show to avoid cross-file interference
  test.beforeEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
  });
  test.afterEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
  });

  test("write review from /reviews/new page", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto("/reviews/new");

    await expect(
      page.getByRole("heading", { name: "כתב.י ביקורת" }),
    ).toBeVisible();

    // Select a show via combobox
    const combobox = page.getByPlaceholder("חפש.י הצגה…");
    await combobox.click();
    await combobox.fill(firstShow.title.slice(0, 5));
    // Wait for options and click
    await page
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    // Fill review fields
    await page.locator('input[name="title"]').fill("ביקורת E2E מעולה");

    // Select rating via Radix Select
    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    // Fill text
    await page
      .locator('textarea[name="text"]')
      .fill(
        "זוהי ביקורת שנכתבה על ידי בדיקה אוטומטית. ההצגה הייתה מרשימה מאוד ומומלצת בחום לכל מי שאוהב תיאטרון.",
      );

    // Submit
    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Should redirect to show page with success banner
    await page.waitForURL(/\/shows\/.*review=success/, { timeout: 10_000 });
    await expect(page.getByText("הביקורת שלך פורסמה")).toBeVisible();
  });

  test("write review from show detail page", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    // Navigate directly to the review page (StickyReviewCTA uses #write-review anchor)
    await page.goto(`/shows/${firstShow.slug}/review`);

    // Show should be pre-selected (no combobox visible)
    await expect(page.getByPlaceholder("חפש.י הצגה…")).not.toBeVisible();

    // Fill review
    await page.locator('input[name="title"]').fill("ביקורת מדף ההצגה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /5/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill(
        "ביקורת בדיקה שנכתבה ישירות מעמוד ההצגה. חוויה תיאטרלית מדהימה, שחקנים מעולים ובמאי מבריק.",
      );

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Should redirect to show page with success banner
    await page.waitForURL(/\/shows\/.*review=success/, { timeout: 10_000 });
    await expect(page.getByText("הביקורת שלך פורסמה")).toBeVisible();
  });

  test("review form is accessible without authentication", async ({ page }) => {
    await page.goto("/reviews/new");

    // Anonymous users go straight to the form (gateway is disabled)
    await expect(
      page.getByRole("heading", { name: "כתב.י ביקורת" }),
    ).toBeVisible();
    // Anonymous users should see the name field
    await expect(page.locator('input[name="name"]')).toBeVisible();
    // Should show sign-in hint
    await expect(page.getByText("יש לך חשבון?")).toBeVisible();
  });
});
