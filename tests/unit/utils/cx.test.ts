import { cx } from "@/utils/cx";

describe("cx", () => {
  it("returns empty string for no args", () => {
    expect(cx()).toBe("");
  });

  it("joins multiple class strings", () => {
    expect(cx("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out false, null, undefined", () => {
    expect(cx(false, null, undefined)).toBe("");
  });

  it("handles mix of valid and falsy values", () => {
    expect(cx("a", false, "b", null, "c", undefined)).toBe("a b c");
  });
});
