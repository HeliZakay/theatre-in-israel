import { test, expect } from "./fixtures";
import { test as baseTest } from "@playwright/test";

test.describe("Profile (authenticated)", () => {
  test("profile page renders for authenticated user", async ({
    authedPage,
  }) => {
    await authedPage.goto("/me");

    await expect(
      authedPage.getByRole("heading", { name: "האזור האישי", level: 1 }),
    ).toBeVisible();
    await expect(
      authedPage.getByText("ניהול פרטי החשבון שלך."),
    ).toBeVisible();
    // Email visible
    await expect(
      authedPage.locator('[dir="ltr"]').first(),
    ).toBeVisible();
  });

  test("display name section visible", async ({ authedPage }) => {
    await authedPage.goto("/me");

    await expect(
      authedPage.getByRole("heading", { name: "שם תצוגה", level: 2 }),
    ).toBeVisible();
    await expect(
      authedPage.getByText("כך השם שלך יופיע בביקורות שתכתוב.י.", {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("stats link to reviews and watchlist", async ({ authedPage }) => {
    await authedPage.goto("/me");

    await expect(
      authedPage.getByRole("link", { name: "ביקורות" }),
    ).toHaveAttribute("href", "/me/reviews");
    await expect(
      authedPage.getByRole("link", { name: "ברשימת צפייה" }),
    ).toHaveAttribute("href", "/me/watchlist");
  });
});

baseTest("unauthenticated user redirected to signin", async ({ page }) => {
  await page.goto("/me");

  await baseTest.expect(page).toHaveURL(/\/auth\/signin/);
  baseTest.expect(page.url()).toContain("reason=auth_required");
});
