import {
  HEBREW_PROFANITY_WORDS,
  HEBREW_PROFANITY_PHRASES,
  HEBREW_PREFIXES,
} from "@/constants/profanityWords";

describe("Profanity words", () => {
  it("HEBREW_PROFANITY_WORDS is non-empty", () => {
    expect(HEBREW_PROFANITY_WORDS.length).toBeGreaterThan(0);
  });

  it("HEBREW_PROFANITY_PHRASES is non-empty", () => {
    expect(HEBREW_PROFANITY_PHRASES.length).toBeGreaterThan(0);
  });

  it("HEBREW_PREFIXES is non-empty", () => {
    expect(HEBREW_PREFIXES.length).toBeGreaterThan(0);
  });

  it("HEBREW_PROFANITY_WORDS has no duplicates", () => {
    const unique = new Set(HEBREW_PROFANITY_WORDS);
    expect(unique.size).toBe(HEBREW_PROFANITY_WORDS.length);
  });

  it("HEBREW_PROFANITY_PHRASES has no duplicates", () => {
    const unique = new Set(HEBREW_PROFANITY_PHRASES);
    expect(unique.size).toBe(HEBREW_PROFANITY_PHRASES.length);
  });

  it("HEBREW_PREFIXES has no duplicates", () => {
    const unique = new Set(HEBREW_PREFIXES);
    expect(unique.size).toBe(HEBREW_PREFIXES.length);
  });

  it("HEBREW_PREFIXES are sorted by length descending", () => {
    for (let i = 1; i < HEBREW_PREFIXES.length; i++) {
      expect(HEBREW_PREFIXES[i].length).toBeLessThanOrEqual(
        HEBREW_PREFIXES[i - 1].length
      );
    }
  });

  it("all entries are non-empty strings", () => {
    const all = [
      ...HEBREW_PROFANITY_WORDS,
      ...HEBREW_PROFANITY_PHRASES,
      ...HEBREW_PREFIXES,
    ];
    for (const entry of all) {
      expect(typeof entry).toBe("string");
      expect(entry.length).toBeGreaterThan(0);
    }
  });
});
