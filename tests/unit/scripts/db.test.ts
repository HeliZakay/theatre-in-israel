import { normalise, normaliseForMatch, escapeSql } from "../../../scripts/lib/normalize.mjs";

describe("normalise", () => {
  it("unifies Hebrew geresh to ASCII apostrophe", () => {
    expect(normalise("צ׳ילבות")).toBe("צ'ילבות");
  });

  it("unifies right single quotation mark", () => {
    expect(normalise("צ\u2019ילבות")).toBe("צ'ילבות");
  });

  it("unifies modifier letter apostrophe", () => {
    expect(normalise("צ\u02BCילבות")).toBe("צ'ילבות");
  });

  it("strips special URL characters", () => {
    expect(normalise("מה קרה?")).toBe("מה קרה");
  });

  it("collapses whitespace", () => {
    expect(normalise("  a   b  ")).toBe("a b");
  });
});

describe("normaliseForMatch", () => {
  it("unifies all apostrophe variants to ASCII", () => {
    expect(normaliseForMatch("צ׳ילבות")).toBe("צ'ילבות");
    expect(normaliseForMatch("צ'ילבות")).toBe("צ'ילבות");
  });

  it("strips niqqud", () => {
    // שָׁלוֹם → שלום
    expect(normaliseForMatch("\u05E9\u05C1\u05B8\u05DC\u05D5\u05B9\u05DD")).toBe("שלום");
  });

  it("normalises dashes", () => {
    expect(normaliseForMatch("a–b—c-d")).toBe("a-b-c-d");
  });

  it("collapses repeated vav", () => {
    expect(normaliseForMatch("שוורץ")).toBe("שורץ");
  });

  it("collapses repeated yod", () => {
    expect(normaliseForMatch("ביילנייקי")).toBe("בילניקי");
  });

  it("strips trailing punctuation", () => {
    expect(normaliseForMatch("מי בעד?")).toBe("מי בעד");
    expect(normaliseForMatch("שלום!")).toBe("שלום");
    expect(normaliseForMatch("test...")).toBe("test");
  });

  it("trims and collapses whitespace", () => {
    expect(normaliseForMatch("  a   b  ")).toBe("a b");
  });
});

describe("escapeSql", () => {
  it("escapes single quotes", () => {
    expect(escapeSql("it's")).toBe("it''s");
  });

  it("handles multiple quotes", () => {
    expect(escapeSql("it's a 'test'")).toBe("it''s a ''test''");
  });

  it("returns unchanged string without quotes", () => {
    expect(escapeSql("hello")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(escapeSql("")).toBe("");
  });
});
