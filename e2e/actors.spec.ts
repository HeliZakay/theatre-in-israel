import { test, expect } from "@playwright/test";

test.describe("Actors", () => {
  test("listing renders heading and actor cards", async ({ page }) => {
    await page.goto("/actors");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("שחקנים");
    // At least one actor card link
    const actorLinks = page.locator('a[href^="/actors/"]');
    await expect(actorLinks.first()).toBeVisible();
    expect(await actorLinks.count()).toBeGreaterThan(0);
  });

  test("search filters results", async ({ page }) => {
    await page.goto("/actors");

    const searchInput = page.getByRole("combobox", { name: "חיפוש שחקן" });
    await searchInput.fill("אבי");

    // Suggestion listbox should appear
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    const options = listbox.getByRole("option");
    expect(await options.count()).toBeGreaterThan(0);
  });

  test("search empty state for no matches", async ({ page }) => {
    await page.goto("/actors");

    const searchInput = page.getByRole("combobox", { name: "חיפוש שחקן" });
    await searchInput.fill("xxxxxxxxx");

    await expect(page.getByText("לא נמצאו שחקנים")).toBeVisible();
  });

  test("detail page renders actor info", async ({ page }) => {
    await page.goto("/actors/%D7%90%D7%91%D7%99-%D7%A7%D7%95%D7%A9%D7%A0%D7%99%D7%A8"); // אבי-קושניר

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("אבי קושניר");
    await expect(
      page.getByLabel("breadcrumb").getByRole("link", { name: "שחקנים" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "כל השחקנים" }),
    ).toBeVisible();
  });

  test("invalid actor slug returns 404", async ({ page }) => {
    const response = await page.goto("/actors/nonexistent");
    expect(response?.status()).toBe(404);
  });
});
