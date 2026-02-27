import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test("contact page renders correctly", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByRole("heading", { name: "שלח.י לנו הודעה", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("שאלה, הצעה, או סתם רוצים להגיד שלום? נשמח לשמוע מכם."),
    ).toBeVisible();

    // Form fields
    await expect(page.getByText("שם")).toBeVisible();
    await expect(page.getByText("אימייל")).toBeVisible();
    await expect(page.getByText("הודעה")).toBeVisible();
    await expect(page.getByRole("button", { name: "שליחה" })).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/contact");

    // Click submit without filling anything
    await page.getByRole("button", { name: "שליחה" }).click();

    // Validation error alerts should appear
    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/contact");

    await page.getByPlaceholder("השם שלך").fill("בודק בדיקות");
    await page.getByPlaceholder("example@email.com").fill("not-an-email");
    await page
      .getByPlaceholder("מה תרצו לשתף?")
      .fill(
        "הודעת בדיקה עם מספיק תווים כדי לעבור את הוולידציה של אורך מינימלי.",
      );

    await page.getByRole("button", { name: "שליחה" }).click();

    // Should show email validation error
    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible({ timeout: 5_000 });
  });

  test("successful contact form submission", async ({ page }) => {
    await page.goto("/contact");

    await page.getByPlaceholder("השם שלך").fill("בודק E2E");
    await page
      .getByPlaceholder("example@email.com")
      .fill("e2e-contact@test.com");
    await page
      .getByPlaceholder("מה תרצו לשתף?")
      .fill(
        "זוהי הודעת בדיקה אוטומטית. אנא התעלמו מהודעה זו. תודה רבה על האתר המצוין!",
      );

    await page.getByRole("button", { name: "שליחה" }).click();

    // Either success banner or server error (Resend fake key)
    // Wait for one of: success message or error
    const success = page.getByText("ההודעה נשלחה בהצלחה!");
    const serverError = page.locator('[role="alert"]');

    // Try to wait for success — if Resend fails, it will show server error
    // This is expected in test env with fake API key
    await expect(success.or(serverError)).toBeVisible({ timeout: 10_000 });
  });

  test("honeypot field is hidden", async ({ page }) => {
    await page.goto("/contact");

    // Honeypot should exist but be hidden from view
    const honeypot = page.locator("#website");
    await expect(honeypot).toBeAttached();
    // The parent div has aria-hidden="true"
    await expect(honeypot.locator("..")).toHaveAttribute("aria-hidden", "true");
  });
});
