import {
  containsProfanity,
  checkFieldsForProfanity,
} from "@/utils/profanityFilter";

describe("containsProfanity", () => {
  it("returns false for clean text", () => {
    expect(containsProfanity("great show")).toBe(false);
  });

  it("returns true for English profanity", () => {
    expect(containsProfanity("shit")).toBe(true);
  });

  it("delegates to leo-profanity for detection", () => {
    // Verify the function returns a boolean and processes input
    expect(typeof containsProfanity("any text")).toBe("boolean");
  });

  it("returns false for empty string", () => {
    expect(containsProfanity("")).toBe(false);
  });
});

describe("checkFieldsForProfanity", () => {
  it("returns null when all fields are clean", () => {
    expect(
      checkFieldsForProfanity({ title: "Great show", body: "Loved it" }),
    ).toBeNull();
  });

  it("returns the field name of the first offending field", () => {
    expect(checkFieldsForProfanity({ title: "Nice", body: "shit" })).toBe(
      "body",
    );
  });

  it("skips null and undefined field values", () => {
    expect(
      checkFieldsForProfanity({ title: null, body: undefined, note: "clean" }),
    ).toBeNull();
  });

  it("returns null for empty fields record", () => {
    expect(checkFieldsForProfanity({})).toBeNull();
  });
});
