import { ENABLE_REVIEW_AUTH_GATEWAY } from "@/constants/featureFlags";
import { FEATURED_SHOW_SLUG } from "@/constants/featuredShow";
import { DEFAULT_SORT } from "@/constants/sorts";

describe("Feature flags", () => {
  it("ENABLE_REVIEW_AUTH_GATEWAY is a boolean", () => {
    expect(typeof ENABLE_REVIEW_AUTH_GATEWAY).toBe("boolean");
  });
});

describe("Featured show", () => {
  it("FEATURED_SHOW_SLUG is a string or null", () => {
    expect(
      typeof FEATURED_SHOW_SLUG === "string" || FEATURED_SHOW_SLUG === null
    ).toBe(true);
  });
});

describe("DEFAULT_SORT", () => {
  it("is a non-empty string", () => {
    expect(typeof DEFAULT_SORT).toBe("string");
    expect(DEFAULT_SORT.length).toBeGreaterThan(0);
  });
});
