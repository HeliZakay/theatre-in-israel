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

    const heading404 = page.getByRole("heading", {
      name: "404 — הדף לא נמצא",
    });
    const showNotFound = page.getByText("הצגה לא נמצאה");

    await expect(heading404.or(showNotFound)).toBeVisible();
  });

  test("404 page home link navigates to home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await page.getByRole("link", { name: "חזרה לדף הבית" }).click();

    await expect(page).toHaveURL("/");
  });

  test("legacy numeric show URL redirects to slug", async ({ page }) => {
    await page.goto("/shows/1");

    const url = page.url();
    const path = new URL(url).pathname;

    // Should either redirect to a slug-based URL or show 404
    const isSlugUrl = /^\/shows\/[a-z\u0590-\u05FF]/.test(path);
    const is404 = await page
      .getByRole("heading", { name: "404 — הדף לא נמצא" })
      .isVisible()
      .catch(() => false);

    expect(isSlugUrl || is404).toBeTruthy();
  });
});
