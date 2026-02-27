import { test, expect } from "./fixtures";
import { cleanupTestData, createTestReview } from "./helpers/db";

test.describe("Accessibility", () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test("page has correct RTL direction and language", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");
  });

  test("mobile menu dialog has proper aria attributes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const burger = page.getByRole("button", {
      name: "פתיחת תפריט ניווט",
    });
    await burger.click();

    const dialog = page.getByRole("dialog", { name: "תפריט ניווט" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("delete review dialog is keyboard dismissible", async ({
    authedPage,
    testUserId,
    firstShow,
  }) => {
    await createTestReview(testUserId, firstShow.id, {
      title: "ביקורת נגישות",
      text: "בדיקת נגישות של דיאלוג מחיקה",
      rating: 3,
      author: "Test User",
    });

    await authedPage.goto("/me/reviews");
    await authedPage.getByRole("button", { name: "מחיקה" }).click();

    const dialogText = authedPage.getByText("מחק.י ביקורת");
    await expect(dialogText).toBeVisible();

    await authedPage.keyboard.press("Escape");
    await expect(dialogText).not.toBeVisible();
  });

  test("contact form inputs have associated labels", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByRole("textbox", { name: /שם/ })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /אימייל/ })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /הודעה/ })).toBeVisible();
  });

  test("images have alt text on show detail page", async ({ page }) => {
    await page.goto("/shows");

    const firstShowLink = page.locator("a[href^='/shows/']").first();
    await firstShowLink.click();

    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    await expect(images.first()).toHaveAttribute("alt", /.+/);
  });
});
