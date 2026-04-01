import { normalizeQuotes } from "@/utils/normalizeQuery";

describe("normalizeQuotes", () => {
  it("replaces Hebrew geresh (U+05F3) with ASCII apostrophe", () => {
    expect(normalizeQuotes("צ\u05F3ילבות")).toBe("צ'ילבות");
  });

  it("replaces right single quote (U+2019) with ASCII apostrophe", () => {
    expect(normalizeQuotes("צ\u2019ילבות")).toBe("צ'ילבות");
  });

  it("replaces modifier letter apostrophe (U+02BC) with ASCII apostrophe", () => {
    expect(normalizeQuotes("צ\u02BCילבות")).toBe("צ'ילבות");
  });

  it("leaves ASCII apostrophe unchanged", () => {
    expect(normalizeQuotes("צ'ילבות")).toBe("צ'ילבות");
  });

  it("leaves strings without quotes unchanged", () => {
    expect(normalizeQuotes("המלט")).toBe("המלט");
  });
});
