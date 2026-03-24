import { test, expect } from "./fixtures";
import { cleanupTestData, createTestReview, getFirstShow } from "./helpers/db";

test.describe("My Reviews", () => {
  // These tests share the same user and mutate reviews — must run sequentially
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ testUserId }) => {
    await cleanupTestData(testUserId);
  });

  test("shows empty state when user has no reviews", async ({ authedPage }) => {
    const page = authedPage;
    await page.goto("/me/reviews");

    await expect(
      page.getByRole("heading", { name: "הביקורות שלי" }),
    ).toBeVisible();
    await expect(page.getByText("עדיין לא כתבת ביקורות.")).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: "כתב.י ביקורת" }),
    ).toBeVisible();
  });

  test("shows existing review in list", async ({
    authedPage,
    testUserId,
    firstShow,
  }) => {
    // Create a review directly in DB
    await createTestReview(testUserId, firstShow.id, {
      title: "ביקורת בדיקה",
      text: "טקסט ביקורת לבדיקה אוטומטית",
      rating: 4,
      author: "Test User",
    });

    const page = authedPage;
    await page.goto("/me/reviews");

    await expect(
      page.getByRole("heading", { name: "הביקורות שלי" }),
    ).toBeVisible();

    // Review card should be visible
    await expect(page.getByText("ביקורת בדיקה").first()).toBeVisible();
    await expect(page.getByText("טקסט ביקורת לבדיקה אוטומטית")).toBeVisible();
    await expect(page.getByText("★4")).toBeVisible();

    // Edit and delete buttons
    await expect(page.getByRole("link", { name: "עריכה" })).toBeVisible();
    await expect(page.getByRole("button", { name: "מחיקה" })).toBeVisible();
  });

  test("delete a review via confirmation dialog", async ({
    authedPage,
    testUserId,
    firstShow,
  }) => {
    await createTestReview(testUserId, firstShow.id, {
      title: "ביקורת למחיקה",
      text: "ביקורת שתימחק בבדיקה",
      rating: 3,
      author: "Test User",
    });

    const page = authedPage;
    await page.goto("/me/reviews");

    // Verify review is present
    await expect(page.getByText("ביקורת למחיקה").first()).toBeVisible();

    // Click delete
    await page.getByRole("button", { name: "מחיקה" }).click();

    // Confirmation dialog should appear
    await expect(page.getByText("מחק.י ביקורת")).toBeVisible();
    await expect(
      page.getByText("למחוק את הביקורת? לא ניתן לשחזר פעולה זו."),
    ).toBeVisible();

    // Confirm deletion in the dialog
    await page.getByRole("alertdialog").getByRole("button", { name: "מחיקה" }).click();

    // Review should disappear, empty state should show
    await expect(page.getByText("ביקורת למחיקה")).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test("edit a review", async ({ authedPage, testUserId, firstShow }) => {
    const review = await createTestReview(testUserId, firstShow.id, {
      title: "ביקורת לעריכה",
      text: "טקסט מקורי שיערך בבדיקה",
      rating: 2,
      author: "Test User",
    });

    const page = authedPage;
    await page.goto("/me/reviews");

    // Click edit
    await page.getByRole("link", { name: "עריכה" }).click();
    await expect(page).toHaveURL(new RegExp(`/me/reviews/${review.id}/edit`));

    // Update the title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill("ביקורת ערוכה");

    // Update the text
    const textArea = page.locator('textarea[name="text"]');
    await textArea.clear();
    await textArea.fill(
      "טקסט ביקורת שעודכן על ידי בדיקה אוטומטית. התוכן החדש של הביקורת.",
    );

    // Submit (look for a save/submit button)
    await page.getByRole("button", { name: /שמר.י שינויים|שמירה|עדכון/ }).click();

    // Should redirect back to my reviews or show page
    await page.waitForURL(/\/me\/reviews|\/shows\//, { timeout: 10_000 });
  });
});
