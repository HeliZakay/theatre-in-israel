import { GENRE_SECTIONS } from "@/constants/genreGroups";

describe("GENRE_SECTIONS", () => {
  const keys = Object.keys(GENRE_SECTIONS);

  it("has exactly 5 keys: dramas, comedies, musicals, israeli, kids", () => {
    expect(keys.sort()).toEqual(
      ["comedies", "dramas", "israeli", "kids", "musicals"].sort()
    );
  });

  it.each(keys)("section '%s' has genres, kicker, title, linkText", (key) => {
    const section = GENRE_SECTIONS[key as keyof typeof GENRE_SECTIONS];
    expect(Array.isArray(section.genres)).toBe(true);
    expect(section.genres.length).toBeGreaterThan(0);
    expect(typeof section.kicker).toBe("string");
    expect(typeof section.title).toBe("string");
    expect(typeof section.linkText).toBe("string");
  });

  it("all genre entries are strings", () => {
    for (const key of keys) {
      const section = GENRE_SECTIONS[key as keyof typeof GENRE_SECTIONS];
      for (const genre of section.genres) {
        expect(typeof genre).toBe("string");
      }
    }
  });
});
