import { test, expect } from "@playwright/test";

test.describe("Cities", () => {
  test("listing renders heading and city links", async ({ page }) => {
    await page.goto("/cities");

    await expect(
      page.getByRole("heading", { name: "תיאטרון לפי עיר", level: 1 }),
    ).toBeVisible();
    // At least one city card link
    const cityLinks = page.locator('a[href^="/cities/"]');
    await expect(cityLinks.first()).toBeVisible();
    expect(await cityLinks.count()).toBeGreaterThan(0);
  });

  test("detail page renders shows for city", async ({ page }) => {
    await page.goto("/cities/tel-aviv");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("תל אביב");
    // Breadcrumb with link back to cities
    await expect(
      page.getByLabel("breadcrumb").getByRole("link", { name: "ערים" }),
    ).toBeVisible();
    // Back link
    await expect(
      page.getByRole("link", { name: "כל הערים" }),
    ).toBeVisible();
  });

  test("invalid slug returns 404", async ({ page }) => {
    const response = await page.goto("/cities/nonexistent");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Genres", () => {
  test("listing renders heading and genre links", async ({ page }) => {
    await page.goto("/genres");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("ז׳אנר");
    const genreLinks = page.locator('a[href^="/genres/"]');
    await expect(genreLinks.first()).toBeVisible();
    expect(await genreLinks.count()).toBeGreaterThan(0);
  });

  test("detail page renders shows for genre", async ({ page }) => {
    await page.goto("/genres/drama");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("דרמה");
    await expect(
      page.getByLabel("breadcrumb").getByRole("link", { name: "ז׳אנרים" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "כל הז׳אנרים" }),
    ).toBeVisible();
  });

  test("invalid slug returns 404", async ({ page }) => {
    const response = await page.goto("/genres/nonexistent");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Theatres", () => {
  test("listing renders heading and theatre links", async ({ page }) => {
    await page.goto("/theatres");

    await expect(
      page.getByRole("heading", { name: "תיאטראות בישראל", level: 1 }),
    ).toBeVisible();
    const theatreLinks = page.locator('a[href^="/theatres/"]');
    await expect(theatreLinks.first()).toBeVisible();
    expect(await theatreLinks.count()).toBeGreaterThan(0);
  });

  test("detail page renders shows for theatre", async ({ page }) => {
    await page.goto("/theatres/cameri");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("קאמרי");
    await expect(
      page.getByLabel("breadcrumb").getByRole("link", { name: "תיאטראות" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "כל התיאטראות" }),
    ).toBeVisible();
  });

  test("invalid slug returns 404", async ({ page }) => {
    const response = await page.goto("/theatres/nonexistent");
    expect(response?.status()).toBe(404);
  });
});
