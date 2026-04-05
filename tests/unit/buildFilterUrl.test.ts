import { buildFilterUrl } from "@/components/events/buildFilterUrl";

describe("buildFilterUrl", () => {
  it("returns /events when all params are undefined", () => {
    expect(buildFilterUrl(undefined, undefined)).toBe("/events");
  });

  it("omits the default preset (all) from URL segments", () => {
    expect(buildFilterUrl("all", undefined)).toBe("/events");
  });

  it("includes a non-default date preset", () => {
    expect(buildFilterUrl("today", undefined)).toBe("/events/today");
  });

  it("includes a location slug", () => {
    expect(buildFilterUrl(undefined, "tel-aviv")).toBe("/events/tel-aviv");
  });

  it("combines non-default preset and location", () => {
    expect(buildFilterUrl("today", "tel-aviv")).toBe("/events/today/tel-aviv");
  });

  it("appends ?theatre= with encodeURIComponent encoding", () => {
    expect(buildFilterUrl(undefined, undefined, "תיאטרון הקאמרי")).toBe(
      `/events?theatre=${encodeURIComponent("תיאטרון הקאמרי")}`,
    );
  });

  it("combines all three params", () => {
    expect(buildFilterUrl("weekend", "haifa", "תיאטרון חיפה")).toBe(
      `/events/weekend/haifa?theatre=${encodeURIComponent("תיאטרון חיפה")}`,
    );
  });

  it("treats empty strings same as undefined", () => {
    expect(buildFilterUrl("", "")).toBe("/events");
    expect(buildFilterUrl("", "", "")).toBe("/events");
  });
});
