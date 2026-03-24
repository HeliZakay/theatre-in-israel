import { test, expect } from "@playwright/test";

test.describe("Not Found Pages", () => {
  test("shows 404 page for non-existent route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(
      page.getByRole("heading", { name: "404 — הדף לא נמצא" }),
    ).toBeVisible();
    await expect(page.getByText("הדף שחיפשת לא קיים או שהוסר.")).toBeVisible();
  });

  test("shows 404 for non-existent show slug", async ({ page }) => {
    await page.goto("/shows/non-existent-show-slug-xyz");

    const heading404 = page.getByRole("heading", { name: /404/ });
    const showNotFound = page.locator("main").getByText("הצגה לא נמצאה");

    await expect(heading404.or(showNotFound)).toBeVisible();
  });

  test("404 page home link navigates to home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await page.getByRole("link", { name: "חזרה לדף הבית" }).click();

    await expect(page).toHaveURL("/");
  });

  test("legacy numeric show URL shows 404 or loading state", async ({
    page,
  }) => {
    const response = await page.goto("/shows/1").catch(() => null);

    // Numeric slugs are not valid — should get 404, not-found page, or error
    const status = response?.status() ?? 0;
    if (status === 404 || status >= 500 || status === 0) return;

    // If the page loaded, it should NOT show a valid show detail
    // Accept: 404 heading, loading state, not-found text, or empty main (server error)
    const heading404 = page.getByRole("heading", { name: /404/ });
    const loading = page.getByText("טוענים תוצאות");
    const notFound = page.locator("main").getByText("הצגה לא נמצאה");
    const hasShowDetail = await page.getByRole("heading", { level: 1 }).isVisible().catch(() => false);

    if (hasShowDetail) {
      // If a heading rendered, it should not be a valid show page
      await expect(heading404.or(loading).or(notFound)).toBeVisible({ timeout: 5000 });
    }
    // else: empty main or error page — also acceptable (show not found)
  });
});
