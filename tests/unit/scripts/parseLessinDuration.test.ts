import { parseLessinDuration } from "../../../scripts/lib/duration.mjs";

describe("parseLessinDuration", () => {
  // ── Null / empty ──
  it("returns null for null input", () => {
    expect(parseLessinDuration(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseLessinDuration("")).toBeNull();
  });

  it("returns null for unparsable text", () => {
    expect(parseLessinDuration("ללא הפסקה")).toBeNull();
  });

  // ── Pure numeric form ──
  it('parses "90 דקות"', () => {
    expect(parseLessinDuration("90 דקות")).toBe(90);
  });

  it('parses "120 דקות"', () => {
    expect(parseLessinDuration("120 דקות")).toBe(120);
  });

  it('parses "60 דקות" (no space)', () => {
    expect(parseLessinDuration("60דקות")).toBe(60);
  });

  // ── Hour base only ──
  it('parses "כשעה"', () => {
    expect(parseLessinDuration("כשעה")).toBe(60);
  });

  it('parses "שעה"', () => {
    expect(parseLessinDuration("שעה")).toBe(60);
  });

  it('parses "כשעתיים"', () => {
    expect(parseLessinDuration("כשעתיים")).toBe(120);
  });

  it('parses "שעתיים"', () => {
    expect(parseLessinDuration("שעתיים")).toBe(120);
  });

  // ── Hour + textual addition ──
  it('parses "כשעה וחצי"', () => {
    expect(parseLessinDuration("כשעה וחצי")).toBe(90);
  });

  it('parses "כשעה ורבע"', () => {
    expect(parseLessinDuration("כשעה ורבע")).toBe(75);
  });

  it('parses "שעתיים וחצי"', () => {
    expect(parseLessinDuration("שעתיים וחצי")).toBe(150);
  });

  it('parses "שעה וחמישים דקות"', () => {
    expect(parseLessinDuration("שעה וחמישים דקות")).toBe(110);
  });

  it('parses "כשעה ועשרים דקות"', () => {
    expect(parseLessinDuration("כשעה ועשרים דקות")).toBe(80);
  });

  // ── Hour + numeric addition (THE BUG CASE) ──
  it('parses "כשעה ו-15 דקות" → 75 (not 15)', () => {
    expect(parseLessinDuration("כשעה ו-15 דקות")).toBe(75);
  });

  it('parses "שעה ו-25 דקות"', () => {
    expect(parseLessinDuration("שעה ו-25 דקות")).toBe(85);
  });

  it('parses "כשעה ו-10 דקות"', () => {
    expect(parseLessinDuration("כשעה ו-10 דקות")).toBe(70);
  });

  it('parses "שעתיים ו-15 דקות"', () => {
    expect(parseLessinDuration("שעתיים ו-15 דקות")).toBe(135);
  });

  // ── With trailing punctuation (as seen on the live site) ──
  it('parses "כשעה ו-15 דקות." with trailing period', () => {
    expect(parseLessinDuration("כשעה ו-15 דקות.")).toBe(75);
  });

  // ── Abbreviation form (ד'' / ד׳) ──
  it("parses \"55 ד''\" (double-quote abbreviation)", () => {
    expect(parseLessinDuration("55 ד''")).toBe(55);
  });

  it('parses "80 ד׳" (geresh abbreviation)', () => {
    expect(parseLessinDuration("80 ד׳")).toBe(80);
  });

  it('parses "60 ד\'" (apostrophe abbreviation)', () => {
    expect(parseLessinDuration("60 ד'")).toBe(60);
  });
});
