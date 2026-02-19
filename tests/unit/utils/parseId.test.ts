import { toPositiveInt } from "@/utils/parseId";

describe("toPositiveInt", () => {
  it.each(["1", "42", "999"])(
    "returns number for valid positive integer string %s",
    (value) => {
      expect(toPositiveInt(value)).toBe(Number.parseInt(value, 10));
    },
  );

  it('returns null for "0"', () => {
    expect(toPositiveInt("0")).toBeNull();
  });

  it.each(["-1", "-100"])("returns null for negative number %s", (value) => {
    expect(toPositiveInt(value)).toBeNull();
  });

  it.each(["abc", "", "hello"])(
    "returns null for non-numeric string %s",
    (value) => {
      expect(toPositiveInt(value)).toBeNull();
    },
  );

  it.each(["1.5", "3.14"])(
    "returns integer part for float string %s (parseInt behavior)",
    (value) => {
      expect(toPositiveInt(value)).toBe(Number.parseInt(value, 10));
    },
  );

  it('returns the integer part for strings like "42abc" (parseInt behavior)', () => {
    expect(toPositiveInt("42abc")).toBe(42);
  });
});
