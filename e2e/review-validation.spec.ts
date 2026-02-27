import { test, expect } from "./fixtures";
import { cleanupTestData, createTestReview } from "./helpers/db";

test.describe("Review Validation", () => {
  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test("shows validation error when submitting without selecting a show", async ({
    authedPage,
  }) => {
    const page = authedPage;
    await page.goto("/reviews/new");

    // Fill title, rating, and text — but skip show selection
    await page.locator('input[name="title"]').fill("ביקורת ללא הצגה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(
      page.locator('[role="alert"]').or(page.getByText(/שדה חובה|יש לבחור/)),
    ).toBeVisible();
  });

  test("shows validation error when submitting without rating", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto("/reviews/new");

    // Select a show
    const combobox = page.getByPlaceholder("חפש.י הצגה…");
    await combobox.click();
    await combobox.fill(firstShow.title.slice(0, 5));
    await page
      .getByRole("option", { name: new RegExp(firstShow.title) })
      .click();

    // Fill title and text — skip rating
    await page.locator('input[name="title"]').fill("ביקורת ללא דירוג");

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(
      page.locator('[role="alert"]').or(page.getByText(/שדה חובה|יש לבחור/)),
    ).toBeVisible();
  });

  test("shows validation error for too-short review text", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto("/reviews/new");

    // Select a show
    const combobox = page.getByPlaceholder("חפש.י הצגה…");
    await combobox.click();
    await combobox.fill(firstShow.title.slice(0, 5));
    await page
      .getByRole("option", { name: new RegExp(firstShow.title) })
      .click();

    // Fill title and rating
    await page.locator('input[name="title"]').fill("ביקורת עם טקסט קצר");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    // Fill text with too-short content
    await page.locator('textarea[name="text"]').fill("קצר");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(
      page.locator('[role="alert"]').or(page.getByText(/קצר מדי|תווים/)),
    ).toBeVisible();
  });

  test("shows validation error when title is empty", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto("/reviews/new");

    // Select a show
    const combobox = page.getByPlaceholder("חפש.י הצגה…");
    await combobox.click();
    await combobox.fill(firstShow.title.slice(0, 5));
    await page
      .getByRole("option", { name: new RegExp(firstShow.title) })
      .click();

    // Select rating and fill text — skip title
    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    // Leave title empty
    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(
      page.locator('[role="alert"]').or(page.getByText(/שדה חובה/)),
    ).toBeVisible();
  });

  test("prevents duplicate review for same show", async ({
    authedPage,
    testUserId,
    firstShow,
  }) => {
    // Create a review directly in the DB first
    await createTestReview(testUserId, firstShow.id, {
      title: "ביקורת בדיקה",
      text: "טקסט ביקורת לבדיקה אוטומטית",
      rating: 4,
      author: "Test User",
    });

    const page = authedPage;
    await page.goto("/reviews/new");

    // Select the same show
    const combobox = page.getByPlaceholder("חפש.י הצגה…");
    await combobox.click();
    await combobox.fill(firstShow.title.slice(0, 5));
    await page
      .getByRole("option", { name: new RegExp(firstShow.title) })
      .click();

    // Fill all fields
    await page.locator('input[name="title"]').fill("ביקורת כפולה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Should show duplicate error
    await expect(
      page
        .locator('[role="alert"]')
        .or(page.getByText(/כבר כתבת ביקורת|כבר קיימת|unique/i)),
    ).toBeVisible();
  });
});
