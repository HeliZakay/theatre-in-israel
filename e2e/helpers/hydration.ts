import type { Page } from "@playwright/test";

/**
 * Wait for React Server Components hydration to complete.
 *
 * In Next.js dev mode, SSR streaming creates hidden `<div id="S:...">` elements
 * that briefly duplicate page content. This causes Playwright's strict-mode
 * locators to find 2 elements instead of 1.
 *
 * Call this after `page.goto()` on pages that use interactive client components.
 * Uses a hard wall-clock timeout (not Playwright's waitForFunction timeout,
 * which can reset when RSC streaming replaces execution contexts).
 */
export async function waitForHydration(page: Page): Promise<void> {
  await Promise.race([
    page
      .waitForFunction(() => !document.querySelector('div[id^="S:"]'))
      .catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
}
