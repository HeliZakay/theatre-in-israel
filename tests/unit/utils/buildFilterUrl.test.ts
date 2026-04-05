import { buildFilterUrl } from "@/components/events/buildFilterUrl";

describe("buildFilterUrl", () => {
  it("returns /events with no filters", () => {
    expect(buildFilterUrl(undefined, undefined)).toBe("/events");
  });

  it("omits default date preset (all)", () => {
    expect(buildFilterUrl("all", undefined)).toBe("/events");
  });

  it("includes non-default date preset", () => {
    expect(buildFilterUrl("30days", undefined)).toBe("/events/30days");
  });

  it("includes location slug", () => {
    expect(buildFilterUrl(undefined, "tel-aviv")).toBe("/events/tel-aviv");
  });

  it("includes both date preset and location", () => {
    expect(buildFilterUrl("30days", "haifa")).toBe("/events/30days/haifa");
  });

  it("appends theatre as query param", () => {
    expect(buildFilterUrl(undefined, undefined, "תיאטרון הקאמרי")).toBe(
      "/events?theatre=%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F%20%D7%94%D7%A7%D7%90%D7%9E%D7%A8%D7%99",
    );
  });

  it("combines all params", () => {
    const result = buildFilterUrl("30days", "center", "גשר");
    expect(result).toBe("/events/30days/center?theatre=%D7%92%D7%A9%D7%A8");
  });
});
