import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";
import {
  getTestUserId,
  cleanupTestData,
  getFirstShow,
  getShowByOffset,
} from "./helpers/db";
import { TEST_USER } from "./helpers/test-user";
import { waitForHydration } from "./helpers/hydration";

/**
 * Wrap a Page so that every `goto()` call automatically waits for
 * React Server Components hydration to finish.  In Next.js dev mode,
 * SSR streaming creates hidden `<div id="S:...">` elements that
 * duplicate page content and trip Playwright's strict-mode locators.
 */
function withAutoHydration(page: Page): Page {
  const originalGoto = page.goto.bind(page);
  page.goto = async (...args: Parameters<Page["goto"]>) => {
    const response = await originalGoto(...args);
    await waitForHydration(page);
    return response;
  };
  return page;
}

type TestFixtures = {
  /** A page (unauthenticated) with auto-hydration wait. */
  page: Page;
  /** A page already authenticated as the test user. */
  authedPage: Page;
  /** The test user's DB id (resolved at runtime). */
  testUserId: string;
  /** The first show in the DB (for quick test reference). */
  firstShow: { id: number; title: string; slug: string };
};

/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` fixture helper is not a React hook */
export const test = base.extend<TestFixtures>({
  page: async ({ page }, use) => {
    await use(withAutoHydration(page));
  },

  testUserId: async ({}, use) => {
    const id = await getTestUserId(TEST_USER.email);
    await use(id);
  },

  authedPage: async ({ browser, testUserId }, use) => {
    const context = await browser.newContext();
    await injectSession(context, testUserId, TEST_USER.email, TEST_USER.name);
    const page = withAutoHydration(await context.newPage());
    await use(page);
    await context.close();
  },

  firstShow: async ({}, use) => {
    const show = await getFirstShow();
    await use(show);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect } from "@playwright/test";
