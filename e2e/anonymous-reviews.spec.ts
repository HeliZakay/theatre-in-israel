import { test, expect } from "./fixtures";
import { cleanupAnonymousTestData } from "./helpers/db";

test.describe("Anonymous Reviews", () => {
  test.afterEach(async () => {
    // Clean up any anonymous reviews created during tests
    // E2E tests run against localhost so IP will be 127.0.0.1 or ::1
    await cleanupAnonymousTestData("127.0.0.1");
    await cleanupAnonymousTestData("::1");
    await cleanupAnonymousTestData("::ffff:127.0.0.1");
  });

  test("anonymous user can submit review from show page", async ({
    page,
    firstShow,
  }) => {
    await page.goto(`/shows/${firstShow.slug}`);

    // Click write review button
    await page.getByRole("link", { name: "כתב.י ביקורת" }).click();
    await expect(page).toHaveURL(new RegExp(`/shows/${firstShow.slug}/review`));

    // Gateway shows for anonymous users — click through
    await page.getByRole("link", { name: "המשך בלי חשבון" }).click();
    await expect(page).toHaveURL(new RegExp(`\\?guest=1`));

    // Should see name field (anonymous mode)
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Fill review fields
    await page.locator('input[name="name"]').fill("אורח בדיקה");
    await page.locator('input[name="title"]').fill("ביקורת אנונימית");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill(
        "זוהי ביקורת אנונימית שנכתבה ללא התחברות. בדיקה אוטומטית של תכונת ביקורות אנונימיות.",
      );

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Wait for success
    await expect(page.getByText("הביקורת נשלחה בהצלחה")).toBeVisible();

    // Should redirect to show page
    await page.waitForURL(`/shows/${firstShow.slug}`, { timeout: 10_000 });
  });

  test("anonymous user can submit review with default name", async ({
    page,
    firstShow,
  }) => {
    await page.goto(`/shows/${firstShow.slug}/review?guest=1`);

    // Leave name field empty (should default to "אנונימי")
    await page.locator('input[name="title"]').fill("ביקורת ללא שם");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /3/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill(
        "ביקורת בדיקה עם שם ברירת מחדל. השם אמור להיות אנונימי כשלא ממלאים את השדה.",
      );

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText("הביקורת נשלחה בהצלחה")).toBeVisible();
    await page.waitForURL(`/shows/${firstShow.slug}`, { timeout: 10_000 });
  });

  test("shows sign-in hint for anonymous users", async ({
    page,
    firstShow,
  }) => {
    await page.goto(`/shows/${firstShow.slug}/review?guest=1`);

    await expect(page.getByText("יש לך חשבון?")).toBeVisible();
    await expect(page.getByRole("link", { name: "התחבר.י" })).toBeVisible();
  });

  test("shows auth gateway for anonymous users", async ({
    page,
    firstShow,
  }) => {
    await page.goto(`/shows/${firstShow.slug}/review`);

    // Gateway should be visible
    await expect(
      page.getByRole("heading", { name: "כתיבת ביקורת" }),
    ).toBeVisible();

    // Should show sign-up and sign-in links with correct callbackUrl
    const callbackUrl = encodeURIComponent(`/shows/${firstShow.slug}/review`);
    await expect(page.getByRole("link", { name: "הרשמה" })).toHaveAttribute(
      "href",
      expect.stringContaining(`callbackUrl=${callbackUrl}`),
    );
    await expect(page.getByRole("link", { name: "התחברות" })).toHaveAttribute(
      "href",
      expect.stringContaining(`callbackUrl=${callbackUrl}`),
    );

    // Click continue without account
    await page.getByRole("link", { name: "המשך בלי חשבון" }).click();

    // Should now see the review form
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("authenticated user does not see name field", async ({
    authedPage,
    firstShow,
  }) => {
    const page = authedPage;
    await page.goto(`/shows/${firstShow.slug}/review`);

    // Authenticated users should NOT see the name or honeypot fields
    await expect(page.locator('input[name="name"]')).not.toBeVisible();
    // Should NOT see sign-in hint
    await expect(page.getByText("יש לך חשבון?")).not.toBeVisible();
  });
});
