import { resolveDatePreset } from "@/lib/datePresets";

/**
 * Helper: create a Date from a UTC timestamp string.
 * The function under test uses Intl.DateTimeFormat with Asia/Jerusalem,
 * so we feed UTC instants and verify that the output matches Jerusalem-local dates.
 */
function utc(iso: string): Date {
  return new Date(iso);
}

/** Shorthand to extract YYYY-MM-DD from a UTC Date. */
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

describe("resolveDatePreset", () => {
  // Wednesday 2026-03-25 at 10:00 UTC → Wednesday 2026-03-25 12:00 Jerusalem (IST UTC+2)
  const wed = utc("2026-03-25T10:00:00Z");

  it("today — returns the Jerusalem-local date", () => {
    const { from, to } = resolveDatePreset("today", wed);
    expect(fmt(from)).toBe("2026-03-25");
    expect(fmt(to)).toBe("2026-03-25");
  });

  it("tomorrow — one day after today", () => {
    const { from, to } = resolveDatePreset("tomorrow", wed);
    expect(fmt(from)).toBe("2026-03-26");
    expect(fmt(to)).toBe("2026-03-26");
  });

  it("7days — today through +6 days", () => {
    const { from, to } = resolveDatePreset("7days", wed);
    expect(fmt(from)).toBe("2026-03-25");
    expect(fmt(to)).toBe("2026-03-31");
  });

  describe("weekend (Israeli Thu–Sat)", () => {
    it("on Wednesday — shows next weekend (Thu–Sat)", () => {
      const { from, to } = resolveDatePreset("weekend", wed);
      expect(fmt(from)).toBe("2026-03-26"); // Thu
      expect(fmt(to)).toBe("2026-03-28"); // Sat
    });

    it("on Thursday — shows current weekend (Thu–Sat)", () => {
      const thu = utc("2026-03-26T10:00:00Z");
      const { from, to } = resolveDatePreset("weekend", thu);
      expect(fmt(from)).toBe("2026-03-26"); // Thu
      expect(fmt(to)).toBe("2026-03-28"); // Sat
    });

    it("on Saturday — shows current weekend (Thu–Sat)", () => {
      const sat = utc("2026-03-28T10:00:00Z");
      const { from, to } = resolveDatePreset("weekend", sat);
      expect(fmt(from)).toBe("2026-03-26"); // Thu
      expect(fmt(to)).toBe("2026-03-28"); // Sat
    });

    it("on Sunday — shows next weekend", () => {
      const sun = utc("2026-03-22T10:00:00Z");
      const { from, to } = resolveDatePreset("weekend", sun);
      expect(fmt(from)).toBe("2026-03-26"); // next Thu
      expect(fmt(to)).toBe("2026-03-28"); // next Sat
    });
  });

  describe("week (Israeli Sun–Sat)", () => {
    it("on Wednesday — shows Sun–Sat of current week", () => {
      const { from, to } = resolveDatePreset("week", wed);
      expect(fmt(from)).toBe("2026-03-22"); // Sun
      expect(fmt(to)).toBe("2026-03-28"); // Sat
    });

    it("on Sunday — shows current week starting that Sunday", () => {
      const sun = utc("2026-03-22T10:00:00Z");
      const { from, to } = resolveDatePreset("week", sun);
      expect(fmt(from)).toBe("2026-03-22");
      expect(fmt(to)).toBe("2026-03-28");
    });
  });

  describe("nextweek (Israeli Sun–Sat)", () => {
    it("on Wednesday — shows next Sun–Sat", () => {
      const { from, to } = resolveDatePreset("nextweek", wed);
      expect(fmt(from)).toBe("2026-03-29"); // next Sun
      expect(fmt(to)).toBe("2026-04-04"); // next Sat
    });
  });

  it("all — from today to 2030-12-31", () => {
    const { from, to } = resolveDatePreset("all", wed);
    expect(fmt(from)).toBe("2026-03-25");
    expect(fmt(to)).toBe("2030-12-31");
  });

  it("unknown preset — falls back to 7days", () => {
    const { from, to } = resolveDatePreset("nonsense", wed);
    expect(fmt(from)).toBe("2026-03-25");
    expect(fmt(to)).toBe("2026-03-31");
  });

  it("handles late-night UTC that is already next day in Jerusalem", () => {
    // 2026-03-24 23:00 UTC → 2026-03-25 01:00 Jerusalem (IST UTC+2)
    const lateUtc = utc("2026-03-24T23:00:00Z");
    const { from, to } = resolveDatePreset("today", lateUtc);
    expect(fmt(from)).toBe("2026-03-25");
    expect(fmt(to)).toBe("2026-03-25");
  });

  it("year rollover — tomorrow from Dec 31", () => {
    const dec31 = utc("2026-12-31T10:00:00Z");
    const { from, to } = resolveDatePreset("tomorrow", dec31);
    expect(fmt(from)).toBe("2027-01-01");
    expect(fmt(to)).toBe("2027-01-01");
  });
});
