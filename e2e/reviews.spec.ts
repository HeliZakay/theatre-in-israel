import { test, expect } from "./fixtures";
import { cleanupTestData } from "./helpers/db";

test.describe("Create Review", () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
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
      .getByRole("option", { name: new RegExp(firstShow.title) })
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

    // Wait for success
    await expect(page.getByText("הביקורת נשלחה בהצלחה")).toBeVisible();

    // Should redirect to show page
    await page.waitForURL(/\/shows\//, { timeout: 10_000 });
  });

  test("write review from show detail page", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto(`/shows/${firstShow.slug}`);

    // Click write review button
    await page.getByRole("link", { name: "כתב.י ביקורת" }).click();
    await expect(page).toHaveURL(new RegExp(`/shows/${firstShow.slug}/review`));

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

    // Wait for success and redirect
    await expect(page.getByText("הביקורת נשלחה בהצלחה")).toBeVisible();
    await page.waitForURL(`/shows/${firstShow.slug}`, { timeout: 10_000 });
  });

  test("review form is accessible without authentication", async ({ page }) => {
    await page.goto("/reviews/new");

    // Should show the auth gateway first
    await expect(
      page.getByRole("heading", { name: "כתיבת ביקורת" }),
    ).toBeVisible();

    // Click through the gateway as guest
    await page.getByRole("link", { name: "המשך בלי חשבון" }).click();

    // Now the form should be visible
    await expect(
      page.getByRole("heading", { name: "כתב.י ביקורת" }),
    ).toBeVisible();
    // Anonymous users should see the name field
    await expect(page.locator('input[name="name"]')).toBeVisible();
    // Should show sign-in hint
    await expect(page.getByText("יש לך חשבון?")).toBeVisible();
  });
});
