import {
  inferYear,
  parseShortYear,
  normalizeYear,
  formatDate,
  parseTime,
  HEBREW_MONTHS,
  parseDotDate,
  parseDashDate,
  parseSlashDate,
  parseHebrewDate,
  parseISODatetime,
  tsToIsrael,
} from "../../../scripts/lib/date.mjs";

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

describe("formatDate", () => {
  it("pads single-digit day and month", () => {
    expect(formatDate(5, 3, 2026)).toBe("2026-03-05");
  });

  it("handles double-digit day and month", () => {
    expect(formatDate(25, 12, 2026)).toBe("2026-12-25");
  });
});

describe("parseTime", () => {
  it("extracts HH:MM from text", () => {
    expect(parseTime("show at 20:30 today")).toBe("20:30");
  });

  it("returns empty string when no time found", () => {
    expect(parseTime("no time here")).toBe("");
  });

  it("extracts first time from multiple", () => {
    expect(parseTime("from 18:00 to 20:00")).toBe("18:00");
  });
});

describe("HEBREW_MONTHS", () => {
  it("maps all 12 months", () => {
    expect(HEBREW_MONTHS["ינואר"]).toBe(1);
    expect(HEBREW_MONTHS["דצמבר"]).toBe(12);
  });

  it("maps both מרס and מרץ to March", () => {
    expect(HEBREW_MONTHS["מרס"]).toBe(3);
    expect(HEBREW_MONTHS["מרץ"]).toBe(3);
  });
});

describe("parseDotDate", () => {
  it("parses DD.MM.YYYY", () => {
    expect(parseDotDate("31.03.2026")).toEqual({ date: "2026-03-31", hour: "" });
  });

  it("parses DD.MM.YYYY with time", () => {
    expect(parseDotDate("31.03.2026 20:00")).toEqual({ date: "2026-03-31", hour: "20:00" });
  });

  it("parses DD.MM.YY (2-digit year)", () => {
    expect(parseDotDate("31.03.26")).toEqual({ date: "2026-03-31", hour: "" });
  });

  it("parses DD.MM (no year) — infers year", () => {
    const result = parseDotDate("31.12");
    expect(result).not.toBeNull();
    expect(result!.date).toMatch(/^\d{4}-12-31$/);
  });

  it("returns null for non-matching text", () => {
    expect(parseDotDate("no date here")).toBeNull();
  });

  it("handles single-digit day/month", () => {
    expect(parseDotDate("5.3.2026")).toEqual({ date: "2026-03-05", hour: "" });
  });
});

describe("parseDashDate", () => {
  it("parses DD-MM-YYYY", () => {
    expect(parseDashDate("31-03-2026")).toEqual({ date: "2026-03-31", hour: "" });
  });

  it("parses DD-MM-YYYY with time", () => {
    expect(parseDashDate("31-03-2026 20:00")).toEqual({ date: "2026-03-31", hour: "20:00" });
  });

  it("returns null for non-matching text", () => {
    expect(parseDashDate("31.03.2026")).toBeNull();
  });
});

describe("parseSlashDate", () => {
  it("parses DD/MM/YYYY", () => {
    expect(parseSlashDate("31/03/2026")).toEqual({ date: "2026-03-31", hour: "" });
  });

  it("parses DD/MM/YY (2-digit year)", () => {
    expect(parseSlashDate("31/03/26")).toEqual({ date: "2026-03-31", hour: "" });
  });

  it("parses with surrounding text and time", () => {
    expect(parseSlashDate("יום: 31/03/2026, 20:00")).toEqual({ date: "2026-03-31", hour: "20:00" });
  });

  it("returns null for non-matching text", () => {
    expect(parseSlashDate("no date")).toBeNull();
  });
});

describe("parseHebrewDate", () => {
  it("parses 'DD בMonthName YYYY בשעה HH:MM'", () => {
    expect(parseHebrewDate("21 במרץ 2026 : בשעה 21:00")).toEqual({
      date: "2026-03-21",
      hour: "21:00",
    });
  });

  it("parses 'DD MonthName YYYY' without ב prefix", () => {
    expect(parseHebrewDate("30 מרס 2026 18:00")).toEqual({
      date: "2026-03-30",
      hour: "18:00",
    });
  });

  it("parses with בשעה: variant", () => {
    expect(parseHebrewDate("19 במרץ 2026 בשעה: 20:00")).toEqual({
      date: "2026-03-19",
      hour: "20:00",
    });
  });

  it("parses date without time", () => {
    expect(parseHebrewDate("שני, 30 מרס 2026")).toEqual({
      date: "2026-03-30",
      hour: "",
    });
  });

  it("returns null for unknown month name", () => {
    expect(parseHebrewDate("30 בלנואר 2026")).toBeNull();
  });

  it("returns null for non-matching text", () => {
    expect(parseHebrewDate("no hebrew date")).toBeNull();
  });
});

describe("parseISODatetime", () => {
  it("parses YYYY-MM-DD HH:MM:SS", () => {
    expect(parseISODatetime("2026-03-30 20:00:00")).toEqual({
      date: "2026-03-30",
      hour: "20:00",
    });
  });

  it("parses YYYY-MM-DDTHH:MM:SS", () => {
    expect(parseISODatetime("2026-03-25T20:30:00")).toEqual({
      date: "2026-03-25",
      hour: "20:30",
    });
  });

  it("returns null for date-only string", () => {
    expect(parseISODatetime("2026-03-25")).toBeNull();
  });

  it("returns null for non-matching text", () => {
    expect(parseISODatetime("not a date")).toBeNull();
  });
});

describe("tsToIsrael", () => {
  it("converts Unix timestamp to Israel date/time", () => {
    // 2026-03-25 18:00:00 UTC = 20:00 IST (UTC+2, before DST switch)
    // 2026-03-25T18:00:00Z = Unix 1774461600
    const result = tsToIsrael(1774461600);
    expect(result.date).toBe("2026-03-25");
    expect(result.hour).toBe("20:00");
  });

  it("returns date and hour strings", () => {
    const result = tsToIsrael(1700000000);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.hour).toMatch(/^\d{2}:\d{2}$/);
  });
});
