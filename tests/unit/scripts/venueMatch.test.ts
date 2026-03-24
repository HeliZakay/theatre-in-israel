import { matchVenueTitle } from "../../../scripts/lib/venue-match.mjs";

const MOCK_SHOWS = [
  { id: 1, slug: "הלויתן", title: "הלויתן", theatre: "תיאטרון הקאמרי" },
  { id: 2, slug: "קברט", title: "קברט", theatre: "תיאטרון הבימה" },
  { id: 3, slug: "אמא", title: "אמא", theatre: "תיאטרון גשר" },
  { id: 4, slug: "מיס-בלתי-אפשרי", title: "מיס בלתי אפשרי", theatre: "תיאטרון הקאמרי" },
  { id: 5, slug: "האישה-שלפני", title: "האישה שלפני", theatre: "תיאטרון חיפה" },
  { id: 6, slug: "הצוללת-הצהובה", title: "הצוללת הצהובה", theatre: "תיאטרון באר שבע" },
];

describe("matchVenueTitle", () => {
  describe("Phase 1: separator + theatre hint", () => {
    it("matches 'show – theatre' format", () => {
      const result = matchVenueTitle("הלויתן – הקאמרי", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 1,
        showSlug: "הלויתן",
        theatre: "תיאטרון הקאמרי",
      });
    });

    it("matches with em-dash separator", () => {
      const result = matchVenueTitle("קברט — הבימה", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 2,
        showSlug: "קברט",
        theatre: "תיאטרון הבימה",
      });
    });

    it("matches with pipe separator", () => {
      const result = matchVenueTitle("הלויתן | הקאמרי", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 1,
        showSlug: "הלויתן",
        theatre: "תיאטרון הקאמרי",
      });
    });

    it("matches informal theatre names", () => {
      const result = matchVenueTitle("האישה שלפני – חיפה", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 5,
        showSlug: "האישה-שלפני",
        theatre: "תיאטרון חיפה",
      });
    });

    it("matches full theatre name in hint", () => {
      const result = matchVenueTitle("הלויתן – תיאטרון הקאמרי", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 1,
        showSlug: "הלויתן",
        theatre: "תיאטרון הקאמרי",
      });
    });
  });

  describe("Phase 2: broad fuzzy match", () => {
    it("matches exact title without separator", () => {
      const result = matchVenueTitle("מיס בלתי אפשרי", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 4,
        showSlug: "מיס-בלתי-אפשרי",
        theatre: "תיאטרון הקאמרי",
      });
    });
  });

  describe("Phase 3: separator split without hint", () => {
    it("matches a part of a separated title against all shows", () => {
      // "הלויתן – כרטיסים" — no theatre hint, but "הלויתן" exact-matches
      const result = matchVenueTitle("הלויתן – כרטיסים", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 1,
        showSlug: "הלויתן",
        theatre: "תיאטרון הקאמרי",
      });
    });
  });

  describe("edge cases", () => {
    it("returns null for empty string", () => {
      expect(matchVenueTitle("", MOCK_SHOWS)).toBeNull();
    });

    it("returns null for whitespace-only", () => {
      expect(matchVenueTitle("   ", MOCK_SHOWS)).toBeNull();
    });

    it("returns null for no match", () => {
      expect(matchVenueTitle("הצגה שלא קיימת", MOCK_SHOWS)).toBeNull();
    });

    it("returns null for ambiguous broad match", () => {
      // Two shows with overlapping titles
      const ambiguousShows = [
        { id: 10, slug: "test-show", title: "הצגה מיוחדת", theatre: "תיאטרון א" },
        { id: 11, slug: "test-show-2", title: "הצגה מיוחדת", theatre: "תיאטרון ב" },
      ];
      expect(matchVenueTitle("הצגה מיוחדת", ambiguousShows)).toBeNull();
    });

    it("avoids short-title substring false positives", () => {
      // "אמא" is only 3 chars — too short for substring matching
      // Should only match exact
      const result = matchVenueTitle("אמא", MOCK_SHOWS);
      expect(result).toEqual({
        showId: 3,
        showSlug: "אמא",
        theatre: "תיאטרון גשר",
      });
    });
  });
});
