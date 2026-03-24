import { inferYear, parseShortYear, normalizeYear } from "../../../scripts/lib/date.mjs";

describe("parseShortYear", () => {
  it("maps 00 → 2000", () => expect(parseShortYear("00")).toBe(2000));
  it("maps 25 → 2025", () => expect(parseShortYear("25")).toBe(2025));
  it("maps 69 → 2069", () => expect(parseShortYear("69")).toBe(2069));
  it("maps 70 → 1970", () => expect(parseShortYear("70")).toBe(1970));
  it("maps 99 → 1999", () => expect(parseShortYear("99")).toBe(1999));
  it("accepts numeric input", () => expect(parseShortYear(26)).toBe(2026));
});

describe("inferYear", () => {
  const realDate = Date;

  afterEach(() => {
    global.Date = realDate;
  });

  function mockDate(isoString: string) {
    const fixed = new realDate(isoString);
    // @ts-expect-error — partial mock
    global.Date = class extends realDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixed.getTime());
        } else {
          // @ts-expect-error — spread constructor args
          super(...args);
        }
      }

      static now() {
        return fixed.getTime();
      }
    };
  }

  it("returns this year for a future date", () => {
    mockDate("2026-06-01T12:00:00Z");
    expect(inferYear(15, 12)).toBe(2026);
  });

  it("returns this year for today", () => {
    mockDate("2026-06-15T12:00:00Z");
    expect(inferYear(15, 6)).toBe(2026);
  });

  it("returns next year for a date that has passed", () => {
    mockDate("2026-06-15T12:00:00Z");
    expect(inferYear(1, 1)).toBe(2027);
  });

  it("returns next year for a date more than 1 day ago", () => {
    mockDate("2026-06-15T12:00:00Z");
    // June 1 is well past the 1-day grace window
    expect(inferYear(1, 6)).toBe(2027);
  });
});

describe("normalizeYear", () => {
  const realDate = Date;

  afterEach(() => {
    global.Date = realDate;
  });

  function mockDate(isoString: string) {
    const fixed = new realDate(isoString);
    // @ts-expect-error — partial mock
    global.Date = class extends realDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixed.getTime());
        } else {
          // @ts-expect-error — spread constructor args
          super(...args);
        }
      }

      static now() {
        return fixed.getTime();
      }
    };
  }

  it("returns 4-digit year as-is", () => {
    expect(normalizeYear("2026", 1, 1)).toBe("2026");
  });

  it("expands 2-digit year", () => {
    expect(normalizeYear("26", 1, 1)).toBe("2026");
  });

  it("infers year when yearStr is empty", () => {
    mockDate("2026-06-01T12:00:00Z");
    expect(normalizeYear("", 15, 12)).toBe("2026");
  });

  it("infers year when yearStr is undefined", () => {
    mockDate("2026-06-01T12:00:00Z");
    expect(normalizeYear(undefined as unknown as string, 15, 12)).toBe("2026");
  });
});
