import { test, expect } from "@playwright/test";
import { loginViaUI, signUpViaUI } from "./helpers/auth";
import { TEST_USER } from "./helpers/test-user";
import { getTestPrisma } from "./helpers/db";

test.describe("Authentication", () => {
  test("sign in page renders correctly", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(
      page.getByRole("heading", { name: "התחברות לאתר" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "עם חשבון אפשר לערוך ולמחוק ביקורות, לשמור הצגות לרשימת צפייה ולנהל פרופיל אישי.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "המשך עם Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "התחבר.י עם אימייל וסיסמה" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "הירשמ.י עכשיו" }),
    ).toBeVisible();
  });

  test("sign in with valid credentials", async ({ page }) => {
    await loginViaUI(page, TEST_USER.email, TEST_USER.password);
    // Should redirect to home page
    await expect(page).toHaveURL("/");
  });

  test("sign in with wrong password shows error", async ({ page }) => {
    await page.goto("/auth/signin");
    await page
      .getByRole("button", { name: "התחבר.י עם אימייל וסיסמה" })
      .click();
    await page.getByPlaceholder("אימייל").fill(TEST_USER.email);
    await page.getByPlaceholder("סיסמה").fill("WrongPassword123!");
    await page.getByRole("button", { name: "התחבר.י" }).click();

    await expect(page.getByText("אימייל או סיסמה שגויים")).toBeVisible();
    // Should stay on sign in page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("protected route redirects to sign in with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/me/watchlist");

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
    // URL should contain callbackUrl and reason
    expect(page.url()).toContain("callbackUrl");
    expect(page.url()).toContain("reason=auth_required");

    // Auth required message should show
    await expect(
      page.getByText("כדי להמשיך, צריך להתחבר קודם לחשבון."),
    ).toBeVisible();
  });

  test("sign up with new account", async ({ page }) => {
    const uniqueEmail = `e2e-signup-${Date.now()}@test.com`;

    await signUpViaUI(page, "E2E Signup User", uniqueEmail, "SecurePass123!");

    // Should redirect to home page after auto sign-in
    await expect(page).toHaveURL("/");

    // Clean up: delete the created user
    const prisma = getTestPrisma();
    await prisma.user.deleteMany({ where: { email: uniqueEmail } });
  });

  test("sign up with mismatched passwords shows error", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("button", { name: "הרשמה עם אימייל וסיסמה" }).click();
    await page.getByPlaceholder("אימייל").fill("mismatch@test.com");
    await page.getByPlaceholder("סיסמה").first().fill("Password123!");
    await page.getByPlaceholder("אימות סיסמה").fill("DifferentPass123!");
    await page.getByRole("button", { name: "הרשמה", exact: true }).click();

    await expect(page.getByText("הסיסמאות אינן תואמות")).toBeVisible();
  });

  test("sign up page renders correctly", async ({ page }) => {
    await page.goto("/auth/signup");

    await expect(
      page.getByRole("heading", { name: "הרשמה לאתר" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "הרשמה עם Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "הרשמה עם אימייל וסיסמה" }),
    ).toBeVisible();
  });

  test("auth error page renders with default message", async ({ page }) => {
    await page.goto("/auth/error");

    await expect(
      page.getByRole("heading", { name: "שגיאת התחברות" }),
    ).toBeVisible();
    await expect(
      page.getByText("אירעה שגיאה בלתי צפויה בתהליך ההתחברות. נס.י שוב."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "חזרה לדף ההתחברות" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "חזרה לדף הבית" }),
    ).toBeVisible();
  });

  test("auth error page shows OAuthAccountNotLinked message", async ({
    page,
  }) => {
    await page.goto("/auth/error?error=OAuthAccountNotLinked");

    await expect(
      page.getByText(
        "כתובת האימייל הזו כבר משויכת לחשבון קיים עם שיטת התחברות אחרת.",
        { exact: false },
      ),
    ).toBeVisible();
  });

  test("auth error page shows AccessDenied message", async ({ page }) => {
    await page.goto("/auth/error?error=AccessDenied");

    await expect(
      page.getByText("הגישה נדחתה. אין לך הרשאה להתחבר."),
    ).toBeVisible();
  });
});
