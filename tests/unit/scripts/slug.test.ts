import { generateSlug } from "../../../scripts/lib/slug.mjs";

describe("generateSlug", () => {
  it("keeps Hebrew characters", () => {
    expect(generateSlug("קברט")).toBe("קברט");
  });

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("מה קרה לעולם")).toBe("מה-קרה-לעולם");
  });

  it("normalises ASCII apostrophe to Hebrew geresh", () => {
    expect(generateSlug("צ'ילבות")).toBe("צ׳ילבות");
  });

  it("strips URL-unsafe characters", () => {
    expect(generateSlug("מה קרה לעולם?")).toBe("מה-קרה-לעולם");
    expect(generateSlug('show "title" here')).toBe("show-title-here");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("a - - b")).toBe("a-b");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug(" ?hello? ")).toBe("hello");
  });

  it("handles English titles", () => {
    expect(generateSlug("The Lion King")).toBe("The-Lion-King");
  });

  it("handles mixed Hebrew and English", () => {
    expect(generateSlug("שלום Hello")).toBe("שלום-Hello");
  });

  it("collapses whitespace before converting to hyphens", () => {
    expect(generateSlug("a   b")).toBe("a-b");
  });
});
