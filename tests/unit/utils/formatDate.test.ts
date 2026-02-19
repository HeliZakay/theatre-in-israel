import { formatDate } from "@/utils/formatDate";

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2025-03-15T00:00:00Z");
    const result = formatDate(date);
    expect(result).toBe(
      date.toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
    );
  });

  it("formats a date string", () => {
    const result = formatDate("2025-03-15T00:00:00Z");
    expect(result).toBe(
      new Date("2025-03-15T00:00:00Z").toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
    );
  });

  it("formats a timestamp number", () => {
    const timestamp = new Date("2025-03-15T00:00:00Z").getTime();
    const result = formatDate(timestamp);
    expect(result).toBe(
      new Date(timestamp).toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
    );
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("returns empty string for NaN", () => {
    expect(formatDate(NaN)).toBe("");
  });
});
