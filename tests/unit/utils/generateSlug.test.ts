import { generateSlug } from "@/utils/generateSlug";

describe("generateSlug", () => {
  it("returns a simple Hebrew title as-is", () => {
    expect(generateSlug("קברט")).toBe("קברט");
  });

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("מה קרה לעולם")).toBe("מה-קרה-לעולם");
  });

  it("converts ASCII apostrophe to Hebrew geresh", () => {
    expect(generateSlug("צ'ילבות")).toBe("צ׳ילבות");
  });

  it("strips question marks", () => {
    expect(generateSlug("מה קרה לעולם?")).toBe("מה-קרה-לעולם");
  });

  it("handles em-dash and special chars", () => {
    expect(generateSlug("סיפור הפרברים – המחזמר")).toBe(
      "סיפור-הפרברים-–-המחזמר",
    );
  });

  it("collapses consecutive hyphens", () => {
    expect(generateSlug("רומי + ג׳ולייט")).toBe("רומי-+-ג׳ולייט");
  });

  it("strips leading and trailing hyphens", () => {
    expect(generateSlug(" קברט ")).toBe("קברט");
  });

  it("handles quotes", () => {
    expect(generateSlug('חנה לסלאו היא ד"ר רות')).toBe("חנה-לסלאו-היא-ד-ר-רות");
  });

  it("trims whitespace", () => {
    expect(generateSlug("  קברט  ")).toBe("קברט");
  });

  it("handles parentheses (which are not stripped)", () => {
    expect(generateSlug("המאסטר (אלוף הבונים שלי)")).toBe(
      "המאסטר-(אלוף-הבונים-שלי)",
    );
  });

  it("strips ampersand to avoid invalid XML in sitemap", () => {
    expect(generateSlug("Mix & Match")).toBe("Mix-Match");
  });
});
