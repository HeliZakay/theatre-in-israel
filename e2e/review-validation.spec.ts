import { test as baseTest, expect } from "./fixtures";
import { cleanupTestData, createTestReview, getShowByOffset } from "./helpers/db";

// Use a different show (offset 2) to avoid conflicts with parallel review test files
const test = baseTest.extend<{ firstShow: { id: number; title: string; slug: string } }>({
  firstShow: async ({}, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(await getShowByOffset(2));
  },
});

test.describe("Review Validation", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
  });
  test.afterEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
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

    await expect(page.getByText("יש לבחור הצגה")).toBeVisible();
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    // Fill title and text — skip rating
    await page.locator('input[name="title"]').fill("ביקורת ללא דירוג");

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText("בחר.י דירוג")).toBeVisible();
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    // Fill title and rating
    await page.locator('input[name="title"]').fill("ביקורת עם טקסט קצר");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    // Fill text with too-short content (min 2 chars)
    await page.locator('textarea[name="text"]').fill("א");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText("תגובה צריכה להכיל לפחות 2 תווים")).toBeVisible();
  });

  test("allows submission with empty title (defaults to show name)", async ({
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    // Select rating and fill text — leave title empty
    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    // Leave title empty
    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Should succeed — title auto-filled with show name
    await page.waitForURL(/\/shows\/.*review=success/, { timeout: 10_000 });
    await expect(page.getByText(/הביקורת שלך פורסמה/)).toBeVisible();
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
      .getByRole("option", { name: firstShow.title, exact: true })
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
    await expect(page.getByText("כבר כתבת ביקורת להצגה זו")).toBeVisible({ timeout: 10_000 });
  });
});

// Use a DIFFERENT show (offset 4) for profanity tests to avoid conflict with Review Validation
const profanityTest = baseTest.extend<{ firstShow: { id: number; title: string; slug: string } }>({
  firstShow: async ({}, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(await getShowByOffset(4));
  },
});

profanityTest.describe("Profanity Validation", () => {
  profanityTest.describe.configure({ mode: "serial" });
  profanityTest.beforeEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
  });
  profanityTest.afterEach(async ({ testUserId, firstShow }) => {
    await cleanupTestData(testUserId, firstShow.id);
  });

  profanityTest("rejects review with Hebrew profanity in title (client-side)", async ({
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    // Fill profanity in the title
    await page.locator('input[name="title"]').fill("הצגה של חרא");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("טקסט ביקורת ארוך מספיק כדי לעבור ולידציה של אורך מינימלי");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText(/שפה לא הולמת/)).toBeVisible();
  });

  profanityTest("rejects review with Hebrew profanity in text (client-side)", async ({
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    await page.locator('input[name="title"]').fill("כותרת נקייה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    // Fill profanity in the text
    await page
      .locator('textarea[name="text"]')
      .fill("ההצגה הזאת זין, אי אפשר לראות את הבמה כלל");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText(/שפה לא הולמת/)).toBeVisible();
  });

  profanityTest("rejects review with multi-word Hebrew profanity phrase", async ({
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    await page.locator('input[name="title"]').fill("כותרת נקייה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /4/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill("הבמאי הוא בן זונה ואי אפשר לסבול את ההצגה");

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    await expect(page.getByText(/שפה לא הולמת/)).toBeVisible();
  });

  profanityTest("allows clean Hebrew review to pass", async ({
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
      .getByRole("option", { name: firstShow.title, exact: true })
      .click();

    await page.locator('input[name="title"]').fill("הצגה מעולה");

    await page.getByRole("combobox", { name: "דירוג" }).click();
    await page.getByRole("option", { name: /5/ }).click();

    await page
      .locator('textarea[name="text"]')
      .fill(
        "הצגה מדהימה, השחקנים היו מעולים ואני ממליץ בחום לכל מי שאוהב תיאטרון",
      );

    await page.getByRole("button", { name: "שלח.י ביקורת" }).click();

    // Should see success (no profanity error)
    await page.waitForURL(/\/shows\/.*review=success/, { timeout: 10_000 });
    await expect(page.getByText(/הביקורת שלך פורסמה/)).toBeVisible();
  });
});
