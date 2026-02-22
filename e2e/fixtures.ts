import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";
import { getTestUserId, cleanupTestData, getFirstShow } from "./helpers/db";
import { TEST_USER } from "./helpers/test-user";

type TestFixtures = {
  /** A page already authenticated as the test user. */
  authedPage: Page;
  /** The test user's DB id (resolved at runtime). */
  testUserId: string;
  /** The first show in the DB (for quick test reference). */
  firstShow: { id: number; title: string; slug: string };
};

export const test = base.extend<TestFixtures>({
  testUserId: async ({}, use) => {
    const id = await getTestUserId(TEST_USER.email);
    await use(id);
  },

  authedPage: async ({ browser, testUserId }, use) => {
    const context = await browser.newContext();
    await injectSession(context, testUserId, TEST_USER.email, TEST_USER.name);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  firstShow: async ({}, use) => {
    const show = await getFirstShow();
    await use(show);
  },
});

export { expect } from "@playwright/test";
