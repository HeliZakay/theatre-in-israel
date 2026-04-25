import { test, expect } from "./fixtures";

test.describe("Navigation", () => {
  test("header logo links to home page", async ({ page }) => {
    await page.goto("/shows");
    // Logo link has aria-label="דף הבית" — scope to header to avoid footer duplicate
    await page.locator("header").getByRole("link", { name: "דף הבית" }).click();
    await expect(page).toHaveURL("/");
  });

  test("desktop nav links navigate correctly", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");

    await header.getByRole("link", { name: "קטלוג הצגות" }).click();
    await expect(page).toHaveURL("/shows");

    await header.getByRole("link", { name: "צר.י קשר" }).click();
    await expect(page).toHaveURL("/contact");

    await header.getByRole("link", { name: "עמוד הבית" }).click();
    await expect(page).toHaveURL("/");
  });

  test("header shows sign-in link when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "התחברות" }).first(),
    ).toBeVisible();
  });

  test("header shows user name when authenticated", async ({ authedPage }) => {
    const page = authedPage;
    await page.goto("/");
    await expect(page.getByRole("button", { name: /מחובר\/ת/ })).toBeVisible();
  });

  test("sign out flow", async ({ authedPage }) => {
    const page = authedPage;
    await page.goto("/");

    await page.getByRole("button", { name: /מחובר\/ת|פעולות חשבון/ }).click();
    await page.getByRole("menuitem", { name: "התנתקות" }).click();

    // After sign out, should be redirected to home
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    // Verify session is cleared — sign-in link should be visible instead of user name
    await expect(
      page.getByRole("link", { name: "התחברות" }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.getByRole("button", { name: "פתיחת תפריט ניווט" }).click();

    await expect(
      page.getByRole("dialog", { name: "תפריט ניווט" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("dialog", { name: "תפריט ניווט" }),
    ).not.toBeVisible();
  });

  test("mobile menu links navigate correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.getByRole("button", { name: "פתיחת תפריט ניווט" }).click();

    await page.getByRole("link", { name: "צר.י קשר" }).click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("footer links navigate correctly", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");

    await footer.getByRole("link", { name: "קטלוג הצגות" }).click();
    await expect(page).toHaveURL("/shows");

    await page.goto("/");

    await footer.getByRole("link", { name: "צר.י קשר" }).click();
    await expect(page).toHaveURL("/contact");
  });
});
