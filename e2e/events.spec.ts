import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test("events page renders default view", async ({ page }) => {
    await page.goto("/events");

    await expect(
      page.getByRole("heading", { name: "לוח הופעות תיאטרון", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("מצאו הצגות תיאטרון קרובות לפי תאריך ואזור"),
    ).toBeVisible();
    // DateChips — at least one date filter radio
    await expect(
      page.getByRole("radio").first(),
    ).toBeVisible();
    // FAQ section
    await expect(page.getByText("שאלות נפוצות")).toBeVisible();
    // Skip link
    await expect(
      page.locator('a[href="#events-list"]'),
    ).toBeAttached();
  });

  test("date filter changes title", async ({ page }) => {
    await page.goto("/events/weekend");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("סוף השבוע");
    await expect(
      page.getByRole("link", { name: "נקו סינון" }),
    ).toBeVisible();
  });

  test("region filter changes title", async ({ page }) => {
    await page.goto("/events/center");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("מרכז");
    await expect(
      page.getByRole("link", { name: "נקו סינון" }),
    ).toBeVisible();
  });

  test("combined date and region filter", async ({ page }) => {
    const response = await page.goto("/events/weekend/center");
    expect(response?.ok()).toBe(true);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });

  test("city filter", async ({ page }) => {
    await page.goto("/events/tel-aviv");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("תל אביב");
  });

  test("clear filter navigates to base events page", async ({ page }) => {
    await page.goto("/events/weekend");

    await page.getByRole("link", { name: "נקו סינון" }).click();
    await expect(page).toHaveURL("/events");
  });

  test("invalid filter returns 404", async ({ page }) => {
    const response = await page.goto("/events/nonexistent");
    expect(response?.status()).toBe(404);
  });
});
