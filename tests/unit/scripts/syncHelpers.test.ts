const { normalizeVenue, CITY_REGIONS_MAP, VENUE_ALIASES } = require("../../../prisma/sync-helpers");

describe("normalizeVenue", () => {
  it("returns canonical form for known alias", () => {
    expect(normalizeVenue('בית החייל ת"א', "תל אביב")).toEqual({
      name: "בית החייל תל אביב",
      city: "תל אביב",
    });
  });

  it("fixes typo אומנוית → אמנויות for Herzliya", () => {
    expect(normalizeVenue("היכל אומנוית הבמה - הרצליה", "הרצליה")).toEqual({
      name: "היכל אמנויות הבמה הרצליה",
      city: "הרצליה",
    });
  });

  it("fixes wrong city for venues listed as תל אביב", () => {
    expect(normalizeVenue("היכל התרבות כרמיאל", "תל אביב")).toEqual({
      name: "היכל התרבות כרמיאל",
      city: "כרמיאל",
    });
  });

  it("fixes wrong city לא ידוע", () => {
    expect(normalizeVenue("אולם מופעים גבעת ברנר", "לא ידוע")).toEqual({
      name: "אולם מופעים גבעת ברנר",
      city: "גבעת ברנר",
    });
  });

  it("normalises toMix short name to full name", () => {
    expect(normalizeVenue("תיאטרון toMix", "תל אביב")).toEqual({
      name: "תיאטרון toMix אקספו ת״א",
      city: "תל אביב",
    });
  });

  it("normalises Tzavta short name", () => {
    expect(normalizeVenue("צוותא", "תל אביב")).toEqual({
      name: "תיאטרון צוותא",
      city: "תל אביב",
    });
  });

  it("passes through unknown venues unchanged", () => {
    expect(normalizeVenue("מקום חדש", "עיר חדשה")).toEqual({
      name: "מקום חדש",
      city: "עיר חדשה",
    });
  });

  it("fixes Kiryat Motzkin spelling variant", () => {
    expect(normalizeVenue("היכל התיאטרון", "קרית מוצקין")).toEqual({
      name: "היכל התיאטרון קריית מוצקין",
      city: "קריית מוצקין",
    });
  });
});

describe("CITY_REGIONS_MAP", () => {
  it("maps Tel Aviv to center", () => {
    expect(CITY_REGIONS_MAP["תל אביב"]).toEqual(["center"]);
  });

  it("maps Jerusalem to jerusalem", () => {
    expect(CITY_REGIONS_MAP["ירושלים"]).toEqual(["jerusalem"]);
  });

  it("maps Haifa to north", () => {
    expect(CITY_REGIONS_MAP["חיפה"]).toEqual(["north"]);
  });

  it("maps Beer Sheva to south", () => {
    expect(CITY_REGIONS_MAP["באר שבע"]).toEqual(["south"]);
  });

  it("maps Herzliya to both sharon and center", () => {
    expect(CITY_REGIONS_MAP["הרצליה"]).toEqual(["sharon", "center"]);
  });

  it("maps Ashdod to both south and shfela", () => {
    expect(CITY_REGIONS_MAP["אשדוד"]).toEqual(["south", "shfela"]);
  });

  it("returns undefined for unknown city", () => {
    expect(CITY_REGIONS_MAP["עיר שלא קיימת"]).toBeUndefined();
  });
});

describe("VENUE_ALIASES completeness", () => {
  it("has entries for all documented alias categories", () => {
    // Spot-check that each documented category has at least one entry
    const keys = [...VENUE_ALIASES.keys()];
    expect(keys.some((k: string) => k.startsWith("בית החייל"))).toBe(true);
    expect(keys.some((k: string) => k.startsWith("בית ציוני"))).toBe(true);
    expect(keys.some((k: string) => k.includes("toMix"))).toBe(true);
    expect(keys.some((k: string) => k.startsWith("צוותא"))).toBe(true);
  });
});
