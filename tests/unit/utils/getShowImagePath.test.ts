import { getShowImagePath } from "@/utils/getShowImagePath";

describe("getShowImagePath", () => {
  it("replaces spaces with dashes", () => {
    expect(getShowImagePath("hello world")).toBe("/hello-world.webp");
  });

  it("replaces ASCII apostrophe with Hebrew geresh (\\u05F3)", () => {
    expect(getShowImagePath("it's")).toBe("/it\u05F3s.webp");
  });

  it("handles title with no spaces or apostrophes", () => {
    expect(getShowImagePath("hamlet")).toBe("/hamlet.webp");
  });

  it("handles multiple consecutive spaces", () => {
    expect(getShowImagePath("a   b")).toBe("/a-b.webp");
  });

  it("combines space and apostrophe replacements", () => {
    expect(getShowImagePath("king's new play")).toBe(
      "/king\u05F3s-new-play.webp",
    );
  });
});
