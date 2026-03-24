import {
  DATE_SLUGS,
  REGION_SLUGS,
  CITY_SLUGS,
  DEFAULT_DATE_PRESET,
} from "@/lib/eventsConstants";

describe("eventsConstants", () => {
  it("DATE_SLUGS has no duplicate values", () => {
    const values = Object.values(DATE_SLUGS);
    expect(new Set(values).size).toBe(values.length);
  });

  it("REGION_SLUGS has no duplicate values", () => {
    const values = Object.values(REGION_SLUGS);
    expect(new Set(values).size).toBe(values.length);
  });

  it("CITY_SLUGS has no duplicate keys", () => {
    const keys = Object.keys(CITY_SLUGS);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("DEFAULT_DATE_PRESET exists as a key in DATE_SLUGS", () => {
    expect(DATE_SLUGS).toHaveProperty(DEFAULT_DATE_PRESET);
  });

  it("every CITY_SLUGS entry has a non-empty array of aliases", () => {
    for (const [key, aliases] of Object.entries(CITY_SLUGS)) {
      expect(Array.isArray(aliases)).toBe(true);
      expect(aliases.length).toBeGreaterThan(0);
    }
  });
});
