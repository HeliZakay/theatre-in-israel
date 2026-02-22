import type { Page, BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "e2e-test-secret-do-not-use-in-production";

/**
 * Sign in via the credentials form UI.
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/signin");
  // Expand credentials form
  await page.getByRole("button", { name: "התחבר עם אימייל וסיסמה" }).click();
  await page.getByPlaceholder("אימייל").fill(email);
  await page.getByPlaceholder("סיסמה").fill(password);
  await page.getByRole("button", { name: "התחבר" }).click();
  // Wait for redirect away from signin
  await page.waitForURL((url) => !url.pathname.includes("/auth/signin"), {
    timeout: 15_000,
  });
}

/**
 * Sign up via the signup form UI.
 */
export async function signUpViaUI(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/signup");
  // Expand credentials form
  await page.getByRole("button", { name: "הרשמה עם אימייל וסיסמה" }).click();
  await page.getByPlaceholder("שם (אופציונלי)").fill(name);
  await page.getByPlaceholder("אימייל").fill(email);
  await page.getByPlaceholder("סיסמה").first().fill(password);
  await page.getByPlaceholder("אימות סיסמה").fill(password);
  await page.getByRole("button", { name: "הרשמה" }).click();
  // Wait for redirect away from signup
  await page.waitForURL((url) => !url.pathname.includes("/auth/signup"), {
    timeout: 15_000,
  });
}

/**
 * Inject a NextAuth JWT session cookie to skip the login UI.
 * Uses NextAuth's own `encode` so the JWE format matches what
 * `getServerSession` / `getToken` expect.
 */
export async function injectSession(
  context: BrowserContext,
  userId: string,
  email: string,
  name: string,
): Promise<void> {
  const token = await encode({
    token: {
      sub: userId,
      name,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    secret: AUTH_SECRET,
  });

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
