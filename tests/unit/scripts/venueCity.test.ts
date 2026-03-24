import { resolveVenueCity } from "../../../scripts/lib/venues.mjs";

describe("resolveVenueCity", () => {
  // Tier 1: exact match
  it("resolves exact match from VENUE_CITY_MAP", () => {
    expect(resolveVenueCity("תיאטרון הבימה")).toBe("תל אביב");
  });

  it("resolves exact match for Jerusalem venue", () => {
    expect(resolveVenueCity("תיאטרון החאן")).toBe("ירושלים");
  });

  it("normalizes whitespace before matching", () => {
    expect(resolveVenueCity("תיאטרון  הבימה")).toBe("תל אביב");
  });

  it("trims leading/trailing whitespace", () => {
    expect(resolveVenueCity("  תיאטרון הבימה  ")).toBe("תל אביב");
  });

  // Tier 2: partial/contains match
  it("matches when venue name contains a known key (partial match)", () => {
    // Tier 2 partial match: "המשכן לאמנויות הבמה אשדוד - אולם 1" contains "המשכן לאמנויות הבמה אשדוד"
    expect(resolveVenueCity("המשכן לאמנויות הבמה אשדוד - אולם 1")).toBe("אשדוד");
  });

  it("matches when known key contains the venue name", () => {
    // "צוותא" is a key in the map
    expect(resolveVenueCity("צוותא")).toBe("תל אביב");
  });

  // Tier 3: trailing city heuristic
  it("matches trailing city name from KNOWN_CITIES", () => {
    expect(resolveVenueCity("אולם מופעים חיפה")).toBe("חיפה");
  });

  it("matches longer city names before shorter ones", () => {
    // "ראשון לציון" should match before "ציון" (if it were in the list)
    expect(resolveVenueCity("מרכז תרבות ראשון לציון")).toBe("ראשון לציון");
  });

  // Tier 4: fallback
  it("returns 'לא ידוע' for completely unknown venue", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    expect(resolveVenueCity("מקום שלא קיים בשום מקום")).toBe("לא ידוע");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
