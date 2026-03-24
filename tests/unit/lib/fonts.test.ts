jest.mock("next/font/google", () => ({
  Frank_Ruhl_Libre: jest.fn(() => ({
    variable: "--title-font",
    className: "mock-font-class",
    style: { fontFamily: "Frank Ruhl Libre" },
  })),
}));

import { titleFont } from "@/lib/fonts";

describe("titleFont", () => {
  it("has variable '--title-font'", () => {
    expect(titleFont.variable).toBe("--title-font");
  });

  it("is an object with expected properties", () => {
    expect(titleFont).toHaveProperty("className");
    expect(titleFont).toHaveProperty("style");
  });
});
