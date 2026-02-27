import { test, expect } from "./fixtures";

test.describe("Navigation", () => {
  test("header logo links to home page", async ({ page }) => {
    await page.goto("/shows");
    // Logo link has aria-label="דף הבית"
    await page.getByRole("link", { name: "דף הבית" }).click();
    await expect(page).toHaveURL("/");
  });

  test("desktop nav links navigate correctly", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");

    await header.getByRole("link", { name: "כל ההצגות" }).click();
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
    await expect(page.getByRole("link", { name: /מחובר\/ת/ })).toBeVisible();
  });

  test("sign out flow", async ({ authedPage }) => {
    const page = authedPage;
    await page.goto("/");

    await page.getByRole("button", { name: "פעולות חשבון" }).click();
    await page.getByRole("menuitem", { name: "התנתקות" }).click();

    await page.waitForURL(/\//);

    await page.goto("/me/reviews");
    await expect(page).toHaveURL(/\/auth\/signin/);
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

    await footer.getByRole("link", { name: "כל ההצגות" }).click();
    await expect(page).toHaveURL("/shows");

    await page.goto("/");

    await footer.getByRole("link", { name: "שלח.י לנו הודעה" }).click();
    await expect(page).toHaveURL("/contact");
  });
});
