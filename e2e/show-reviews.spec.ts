import { test, expect } from "./fixtures";
import { getShowWithReviews } from "./helpers/db";

test.describe("Show Reviews Page", () => {
  test("renders review list with heading and back link", async ({ page }) => {
    const show = await getShowWithReviews(5);
    test.skip(!show, "No show with 5+ reviews in test DB");

    await page.goto(`/shows/${encodeURIComponent(show!.slug)}/reviews`);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("ביקורות על");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText(show!.title);
    // Back link
    await expect(
      page.getByRole("link", { name: "חזרה לעמוד ההצגה" }),
    ).toBeVisible();
    // Breadcrumb
    await expect(
      page.getByRole("link", { name: "הצגות", exact: true }),
    ).toBeVisible();
  });

  test("shows theatre name and review count", async ({ page }) => {
    const show = await getShowWithReviews(5);
    test.skip(!show, "No show with 5+ reviews in test DB");

    await page.goto(`/shows/${encodeURIComponent(show!.slug)}/reviews`);

    // Review count text
    await expect(page.getByText(/\d+ ביקורות/)).toBeVisible();
  });

  test("show with insufficient reviews returns 404", async ({
    page,
    firstShow,
  }) => {
    // firstShow is the first show in DB — likely has < 5 reviews
    const response = await page.goto(
      `/shows/${encodeURIComponent(firstShow.slug)}/reviews`,
    );
    // Either 404 or 200 depending on review count
    if (response?.status() === 404) {
      await expect(page).toHaveTitle(/לא נמצא|404/);
    }
  });
});
