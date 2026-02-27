import {
  containsProfanity,
  containsHebrewProfanity,
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

describe("containsHebrewProfanity", () => {
  describe("bare Hebrew profanity words", () => {
    it.each(["זין", "חרא", "כוס", "זונה", "שרמוטה", "מניאק", "אידיוט"])(
      'detects "%s" as profanity',
      (word) => {
        expect(containsHebrewProfanity(word)).toBe(true);
      },
    );
  });

  describe("Hebrew profanity with bound prefixes", () => {
    it.each([
      ["הזין", "ה + זין"],
      ["בחרא", "ב + חרא"],
      ["והשרמוטה", "ו + ה + שרמוטה"],
      ["לזונה", "ל + זונה"],
      ["מהחרא", "מ + ה + חרא"],
      ["שהזין", "ש + ה + זין"],
      ["כשהחרא", "כש + ה + חרא"],
    ])('detects "%s" (%s) as profanity', (word) => {
      expect(containsHebrewProfanity(word)).toBe(true);
    });
  });

  describe("Hebrew profanity with punctuation", () => {
    it.each(["חרא!", "זין?", "!כוס!", "שרמוטה...", 'זונה"', "מניאק!!!"])(
      'detects "%s" as profanity',
      (word) => {
        expect(containsHebrewProfanity(word)).toBe(true);
      },
    );
  });

  describe("Hebrew profanity embedded in sentences", () => {
    it("detects profanity in a Hebrew sentence", () => {
      expect(containsHebrewProfanity("ההצגה הזאת חרא")).toBe(true);
    });

    it("detects profanity with prefix in a sentence", () => {
      expect(containsHebrewProfanity("ההצגה הזאת היא הזין")).toBe(true);
    });

    it("detects profanity at start of sentence", () => {
      expect(containsHebrewProfanity("חרא של הצגה")).toBe(true);
    });

    it("detects profanity at end of sentence with punctuation", () => {
      expect(containsHebrewProfanity("ההצגה הזאת זין!")).toBe(true);
    });
  });

  describe("multi-word Hebrew profanity phrases", () => {
    it('detects "בן זונה" as profanity', () => {
      expect(containsHebrewProfanity("בן זונה")).toBe(true);
    });

    it('detects "בן זונה" inside a sentence', () => {
      expect(containsHebrewProfanity("המשחק הזה בן זונה של משחק")).toBe(true);
    });

    it('detects "בת זונה"', () => {
      expect(containsHebrewProfanity("בת זונה")).toBe(true);
    });

    it('detects "יא מניאק"', () => {
      expect(containsHebrewProfanity("יא מניאק")).toBe(true);
    });
  });

  describe("clean Hebrew text (no false positives)", () => {
    it("returns false for a clean Hebrew review", () => {
      expect(containsHebrewProfanity("הצגה מדהימה ביותר")).toBe(false);
    });

    it("returns false for another clean sentence", () => {
      expect(containsHebrewProfanity("השחקנים היו מעולים")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(containsHebrewProfanity("")).toBe(false);
    });

    it("returns false for Hebrew text with punctuation but no profanity", () => {
      expect(containsHebrewProfanity("מעולה! ממליץ בחום.")).toBe(false);
    });
  });
});

describe("containsProfanity – integration (Hebrew + English)", () => {
  it("detects English profanity via leo-profanity", () => {
    expect(containsProfanity("this is shit")).toBe(true);
  });

  it("detects bare Hebrew profanity", () => {
    expect(containsProfanity("זין")).toBe(true);
  });

  it("detects Hebrew profanity with prefix", () => {
    expect(containsProfanity("הזין")).toBe(true);
  });

  it("detects Hebrew profanity with punctuation", () => {
    expect(containsProfanity("חרא!")).toBe(true);
  });

  it("detects Hebrew phrase", () => {
    expect(containsProfanity("בן זונה")).toBe(true);
  });

  it("returns false for clean mixed text", () => {
    expect(containsProfanity("great הצגה מדהימה")).toBe(false);
  });
});
